// GET /api/registry/admin/export — streamed decrypted CSV (API-SPEC §4).
// POST /api/registry/admin/export — same export for filters that must not travel in
// a URL (CNIC/phone search). The UI uses POST for every export.
// Audits EXPORT_CSV (row count + non-PII filter flags) BEFORE streaming.
import { countExportRows, streamExportCsv } from '@/lib/registry/patients';
import { adminExportQuerySchema, type AdminExportQuery } from '@/lib/registry/schemas';
import { writeAudit } from '@/lib/registry/audit';
import { AuditAction } from '@/lib/registry/constants';
import { apiError, getClientIp, handleApiError, requireAdmin, verifyOrigin } from '@/lib/registry/guards';

export const runtime = 'nodejs';

/** Audit metadata must never contain a CNIC, phone, name or other PII value. */
function safeFilters(query: AdminExportQuery) {
  return {
    status: query.status,
    province: query.province,
    conditionSlug: query.conditionSlug,
    source: query.source,
    possibleDuplicate: query.possibleDuplicate,
    from: query.from,
    to: query.to,
    hasLookup: Boolean(query.q),
    lookupType: query.qType,
  };
}

async function run(req: Request, query: AdminExportQuery) {
  const admin = await requireAdmin(req.headers);
  const rows = await countExportRows(query);
  await writeAudit({
    actorId: admin.id,
    actorRole: 'admin',
    action: AuditAction.EXPORT_CSV,
    entity: 'Export',
    meta: { rows, filters: safeFilters(query) },
    ip: getClientIp(req),
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stream = streamExportCsv(query);
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="psova-registry-export-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(req: Request) {
  try {
    const parsed = adminExportQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parsed.success) return apiError('validation', 400);
    return await run(req, parsed.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    const parsed = adminExportQuerySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    return await run(req, parsed.data);
  } catch (error) {
    return handleApiError(error);
  }
}
