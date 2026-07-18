// /api/registry/cases — clinician case submission + own-case listing (API-SPEC §3).
// Guard: approved clinician or admin.

import { createClinicianCase, listClinicianCases } from '@/lib/registry/patients';
import { caseSchema, casesQuerySchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireApprovedClinician,
  verifyOrigin,
} from '@/lib/registry/guards';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    const { user, profile } = await requireApprovedClinician(req.headers);
    const ip = getClientIp(req);

    const raw = await req.json().catch(() => null);
    const parsed = caseSchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);

    const { trackingCode } = await createClinicianCase(parsed.data, {
      clinicianId: profile?.id ?? null,
      actorId: user.id,
      ip,
    });
    return apiOk({ trackingCode }, { status: 201 });
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
