// POST /api/registry/clinicians/register — clinician self-registration (API-SPEC §1).
// Flow: honeypot → rate-limit → origin → validate → signUpEmail → create
// ClinicianProfile(approved:false, encrypted pmcNumber + pmcHash) → audit.

import { auth } from '@/lib/registry/auth';
import { prisma } from '@/lib/registry/db';
import { blindIndex, encryptField } from '@/lib/registry/crypto';
import { clinicianRegisterSchema } from '@/lib/registry/schemas';
import { checkLimit } from '@/lib/registry/rate-limit';
import { writeAudit } from '@/lib/registry/audit';
import { AuditAction } from '@/lib/registry/constants';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  rateLimitedResponse,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    const ip = getClientIp(req) ?? 'unknown';

    const raw = await req.json().catch(() => null);

    // Honeypot: silently accept & drop when filled. Must be INDISTINGUISHABLE
    // from a genuine success (SECURITY §5.3) — a genuine register returns 201,
    // so the fake success must return 201 too.
    if (raw && typeof raw === 'object' && typeof raw.website === 'string' && raw.website.length > 0) {
      return apiOk(undefined, { status: 201 });
    }

    const limited = checkLimit('register', ip);
    if (!limited.ok) return rateLimitedResponse(limited.retryAfter);

    const parsed = clinicianRegisterSchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);
    const data = parsed.data;

    // Create the auth user (role defaults to 'clinician', non-settable).
    let userId: string;
    try {
      const result = await auth.api.signUpEmail({
        body: { name: data.name, email: data.email, password: data.password },
        headers: req.headers,
      });
      userId = result.user.id;
    } catch (error) {
      // Do not reveal whether the email already exists. A duplicate returns the
      // same 201 as a genuine registration; a real failure is re-thrown as 500.
      const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
      if (existing) return apiOk(undefined, { status: 201 });
      throw error;
    }

    const pmcHash = blindIndex(data.pmcNumber, 'pmc');
    const duplicatePmc = await prisma.clinicianProfile.findFirst({ where: { pmcHash } });

    let profileId: string;
    try {
      const profile = await prisma.clinicianProfile.create({
        data: {
          userId,
          pmcNumber: encryptField(data.pmcNumber),
          pmcHash,
          specialty: data.specialty,
          facility: data.facility,
          city: data.city,
          province: data.province,
          approved: false,
        },
      });
      profileId = profile.id;
    } catch (e) {
      // Roll back the orphaned user so a retry can succeed cleanly.
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      throw e;
    }

    await writeAudit({
      actorId: userId,
      actorRole: 'clinician',
      action: AuditAction.CLINICIAN_REGISTER,
      entity: 'ClinicianProfile',
      entityId: profileId,
      meta: {
        province: data.province,
        specialty: data.specialty,
        ...(duplicatePmc ? { possibleDuplicatePmc: true } : {}),
      },
      ip,
    });

    return apiOk(undefined, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
