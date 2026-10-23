// Auth/RBAC guards + API error envelope (ARCHITECTURE §4, SECURITY §3/§5.6,
// API-SPEC §5). Defense in depth: protected layouts redirect, API routes call
// these guards (401/403 JSON), service functions re-assert for decrypt/export.

import { NextResponse } from 'next/server';
import type { Center, CenterMember, ClinicianProfile } from '@prisma/client';
import { auth } from './auth';
import { prisma } from './db';
import { RegistryCryptoError } from './crypto';
import type { ActorRole, CenterRoleValue } from './constants';
import { membershipAllowsWrites, membershipState, type MembershipState } from './membership';

/* -------------------------------------------------------------------------- */
/*  Typed API error + envelope helpers                                        */
/* -------------------------------------------------------------------------- */

export type ApiErrorCode =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'invalid-transition'
  | 'membership-expired'
  | 'payload-too-large'
  | 'rate-limited'
  | 'server-error';

export class RegistryApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'RegistryApiError';
  }
}

/** Success envelope: `{ ok: true, ...data }`. */
export function apiOk<T extends object>(data?: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, ...(data ?? {}) }, init);
}

/** Failure envelope: `{ ok: false, error }` with the right status. */
export function apiError(code: ApiErrorCode, status: number, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ ok: false, error: code }, { status, headers });
}

/** Map any thrown error to a safe envelope — never leak internals or PII. */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof RegistryApiError) {
    return apiError(error.code, error.status);
  }
  if (error instanceof RegistryCryptoError) {
    console.error('[registry crypto]', error.message);
    return apiError('server-error', 500);
  }
  console.error('[registry api] unhandled error', error);
  return apiError('server-error', 500);
}

/** 429 with a Retry-After header. */
export function rateLimitedResponse(retryAfter: number): NextResponse {
  return apiError('rate-limited', 429, { 'Retry-After': String(retryAfter) });
}

/* -------------------------------------------------------------------------- */
/*  Request helpers                                                           */
/* -------------------------------------------------------------------------- */

/** First hop of x-forwarded-for (SECURITY §4). */
export function getClientIp(req: Request): string | null {
  return clientIpFromHeaders(req.headers);
}

/** Same lookup for server components, which only have `headers()`. */
export function clientIpFromHeaders(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip');
}

/**
 * Origin verification for mutating routes (SECURITY §5.6). Requires an Origin
 * header matching NEXT_PUBLIC_SITE_URL. Throws 403 on mismatch/absence.
 */
export function verifyOrigin(req: Request): void {
  const origin = req.headers.get('origin');
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) throw new RegistryApiError(403, 'forbidden', 'Site origin not configured');
  if (!origin) throw new RegistryApiError(403, 'forbidden', 'Missing origin');
  try {
    if (new URL(origin).origin !== new URL(site).origin) {
      throw new RegistryApiError(403, 'forbidden', 'Origin mismatch');
    }
  } catch (e) {
    if (e instanceof RegistryApiError) throw e;
    throw new RegistryApiError(403, 'forbidden', 'Invalid origin');
  }
}

/* -------------------------------------------------------------------------- */
/*  Session / role guards                                                     */
/* -------------------------------------------------------------------------- */

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type FullSession = { user: SessionUser } | null;

/** Read the current session (or null). Accepts a Headers object. */
export async function getSession(headers: Headers): Promise<FullSession> {
  const result = await auth.api.getSession({ headers });
  if (!result?.user) return null;
  const u = result.user as unknown as SessionUser;
  return { user: { id: u.id, email: u.email, name: u.name, role: u.role ?? 'clinician' } };
}

export function roleOf(user: SessionUser): ActorRole {
  if (user.role === 'admin') return 'admin';
  return user.role === 'center' ? 'center' : 'clinician';
}

/** Any signed-in user, else 401. */
export async function requireSession(headers: Headers): Promise<SessionUser> {
  const s = await getSession(headers);
  if (!s) throw new RegistryApiError(401, 'unauthorized');
  return s.user;
}

/** Admin role, else 401/403. */
export async function requireAdmin(headers: Headers): Promise<SessionUser> {
  const user = await requireSession(headers);
  if (user.role !== 'admin') throw new RegistryApiError(403, 'forbidden');
  return user;
}

export type ClinicianContext = {
  user: SessionUser;
  /** null when the caller is an admin acting as a clinician (no profile). */
  profile: ClinicianProfile | null;
};

/**
 * Approved clinician OR admin (API-SPEC §3). Clinicians must have an approved
 * ClinicianProfile; admins pass through with a null profile.
 */
export async function requireApprovedClinician(headers: Headers): Promise<ClinicianContext> {
  const user = await requireSession(headers);
  if (user.role === 'admin') {
    return { user, profile: null };
  }
  if (user.role !== 'clinician') throw new RegistryApiError(403, 'forbidden');
  const profile = await prisma.clinicianProfile.findUnique({ where: { userId: user.id } });
  if (!profile || !profile.approved) throw new RegistryApiError(403, 'forbidden');
  return { user, profile };
}

export type CenterContext = {
  user: SessionUser;
  member: CenterMember;
  center: Center;
  state: MembershipState;
};

/**
 * Active staff member of an APPROVED centre. `roles` narrows by staff role;
 * `write` additionally requires a live (or in-grace) membership — expired
 * centres keep read access so they can renew (docs/centres/PLAN.md).
 */
export async function requireCenterMember(
  headers: Headers,
  opts: { roles?: readonly CenterRoleValue[]; write?: boolean } = {},
): Promise<CenterContext> {
  const user = await requireSession(headers);
  if (user.role !== 'center') throw new RegistryApiError(403, 'forbidden');
  const member = await prisma.centerMember.findUnique({
    where: { userId: user.id },
    include: { center: true },
  });
  if (!member || !member.active || member.center.status !== 'APPROVED') {
    throw new RegistryApiError(403, 'forbidden');
  }
  if (opts.roles && !opts.roles.includes(member.role)) {
    throw new RegistryApiError(403, 'forbidden');
  }
  const { center, ...memberOnly } = member;
  const state = membershipState(center.membershipExpiresAt);
  if (opts.write && !membershipAllowsWrites(state)) {
    throw new RegistryApiError(403, 'membership-expired');
  }
  return { user, member: memberOnly, center, state };
}
