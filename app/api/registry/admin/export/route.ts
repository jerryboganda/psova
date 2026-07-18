// GET /api/registry/admin/export — streamed decrypted CSV (API-SPEC §4).
// Audits EXPORT_CSV (rows + filters) BEFORE streaming.
import { countExportRows, streamExportCsv } from '@/lib/registry/patients';
import { adminExportQuerySchema } from '@/lib/registry/schemas';
import { writeAudit } from '@/lib/registry/audit';
import { AuditAction } from '@/lib/registry/constants';
import { apiError, getClientIp, handleApiError, requireAdmin } from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req.headers);
    const url = new URL(req.url);
    const parsed = adminExportQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return apiError('validation', 400);

    const rows = await countExportRows(parsed.data);
    await writeAudit({
      actorId: admin.id,
      actorRole: 'admin',
      action: AuditAction.EXPORT_CSV,
      entity: 'Export',
      meta: { rows, filters: parsed.data },
      ip: getClientIp(req),
    });

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const stream = streamExportCsv(parsed.data);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="psova-registry-export-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
