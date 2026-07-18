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
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, profile } = await requireApprovedClinician(req.headers);
    const { id } = await params;

    const record = await getDecryptedRecord(
      id,
      { actorId: user.id, actorRole: 'clinician', ip: getClientIp(req) },
      profile ? { restrictClinicianId: profile.id } : undefined,
    );
    if (!record) return apiError('not-found', 404);

    return apiOk({ record });
  } catch (error) {
    return handleApiError(error);
  }
}
