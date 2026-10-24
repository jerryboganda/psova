// /api/registry/cases — clinician case submission + own-case listing (API-SPEC §3).
// Guard: approved clinician or admin.

import { createClinicianCase, listClinicianCases } from '@/lib/registry/patients';
import { caseSchema, casesQuerySchema } from '@/lib/registry/schemas';
import { checkLimit } from '@/lib/registry/rate-limit';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  rateLimitedResponse,
  requireApprovedClinician,
  verifyOrigin,
} from '@/lib/registry/guards';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_BODY = 100 * 1024; // 100 KB

export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    const { user, profile } = await requireApprovedClinician(req.headers);
    const ip = getClientIp(req);
    const limited = checkLimit('cases', ip ?? 'unknown');
    if (!limited.ok) return rateLimitedResponse(limited.retryAfter);

    const contentLength = req.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY) return apiError('payload-too-large', 413);
    const rawText = await req.text();
    if (rawText.length > MAX_BODY) return apiError('payload-too-large', 413);
    let raw: unknown = null;
    try {
      raw = JSON.parse(rawText);
    } catch {
      raw = null;
    }
    const parsed = caseSchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);

    const { trackingCode, patientId } = await createClinicianCase(parsed.data, {
      clinicianId: profile?.id ?? null,
      actorId: user.id,
      ip,
    });
    return apiOk({ trackingCode, patientId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: Request) {
  try {
    const { profile } = await requireApprovedClinician(req.headers);

    // Admins have no clinician profile, so no "own" cases.
    if (!profile) {
      return NextResponse.json({ ok: true, items: [], page: 1, pageSize: 20, total: 0 });
    }

    const url = new URL(req.url);
    const parsed = casesQuerySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
    });
    if (!parsed.success) return apiError('validation', 400);

    const result = await listClinicianCases(profile.id, parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
