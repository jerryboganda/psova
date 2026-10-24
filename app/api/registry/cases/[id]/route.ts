// GET /api/registry/cases/[id] — clinician's own decrypted case (API-SPEC §3).
// Audited RECORD_VIEW_PII. Clinicians see only their own records (404 otherwise);
// admins may view any.

import { getDecryptedRecord } from '@/lib/registry/patients';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireApprovedClinician,
  roleOf,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, profile } = await requireApprovedClinician(req.headers);
    const { id } = await params;

    const record = await getDecryptedRecord(
      id,
      // An admin reaches this endpoint with profile=null (unrestricted view), so
      // the audit role must reflect the real session role, not a hardcoded value.
      { actorId: user.id, actorRole: roleOf(user), ip: getClientIp(req) },
      profile ? { restrictClinicianId: profile.id } : undefined,
    );
    if (!record) return apiError('not-found', 404);

    // internalNote is PSOVA-only. Never include it in a clinician's response,
    // even though the shared RecordView does not render it.
    if (profile) {
      const { internalNote: _internalNote, ...clinicianRecord } = record;
      return apiOk({ record: clinicianRecord });
    }
    return apiOk({ record });
  } catch (error) {
    return handleApiError(error);
  }
}
