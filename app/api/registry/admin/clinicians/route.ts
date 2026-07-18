// GET /api/registry/admin/clinicians — list (decrypted PMC no.) (API-SPEC §4).
// The list decrypts each clinician's pmcNumber (PII), so the view is audited —
// PII decryption for display is never silent (SECURITY §4).
import { NextResponse } from 'next/server';
import { listClinicians } from '@/lib/registry/patients';
import { adminCliniciansQuerySchema } from '@/lib/registry/schemas';
import { writeAudit } from '@/lib/registry/audit';
import { AuditAction } from '@/lib/registry/constants';
import { apiError, getClientIp, handleApiError, requireAdmin } from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req.headers);
    const url = new URL(req.url);
    const parsed = adminCliniciansQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return apiError('validation', 400);
    const result = await listClinicians(parsed.data);

    await writeAudit({
      actorId: admin.id,
      actorRole: 'admin',
      action: AuditAction.RECORD_VIEW_PII,
      entity: 'ClinicianProfile',
      meta: { count: result.items.length, page: parsed.data.page, approved: parsed.data.approved },
      ip: getClientIp(req),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
