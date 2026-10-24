// Admin record list + search (API-SPEC §4).
// GET  — filters + tracking-code search only (code is not PII, so URL-safe).
// POST — same filters but carries the CNIC/phone lookup value in the JSON body,
//        so plaintext PII never lands in URLs/access logs (SECURITY §5.7, which
//        by precedence overrides the GET-with-q shape in API-SPEC §4).
import { NextResponse } from 'next/server';
import { listRecords } from '@/lib/registry/patients';
import { adminRecordsQuerySchema, type AdminRecordsQuery } from '@/lib/registry/schemas';
import { writeAudit } from '@/lib/registry/audit';
import { AuditAction } from '@/lib/registry/constants';
import { apiError, getClientIp, handleApiError, requireAdmin } from '@/lib/registry/guards';

export const runtime = 'nodejs';

async function auditLookup(req: Request, adminId: string, query: AdminRecordsQuery, found: number) {
  if (!query.q) return;
  await writeAudit({
    actorId: adminId,
    actorRole: 'admin',
    action: AuditAction.RECORD_VIEW_PII,
    entity: 'RegistryPatient',
    meta: {
      lookupType: query.qType,
      found: found > 0,
      filters: {
        status: query.status,
        province: query.province,
        conditionSlug: query.conditionSlug,
        source: query.source,
        possibleDuplicate: query.possibleDuplicate,
      },
    },
    ip: getClientIp(req),
  });
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req.headers);
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);
    // Never accept PII lookup values via the URL — those must use POST.
    if (params.qType === 'cnic' || params.qType === 'phone') {
      delete params.q;
      delete params.qType;
    }
    const parsed = adminRecordsQuerySchema.safeParse(params);
    if (!parsed.success) return apiError('validation', 400);
    const result = await listRecords(parsed.data);
    await auditLookup(req, admin.id, parsed.data, result.total);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req.headers);
    const raw = await req.json().catch(() => null);
    const parsed = adminRecordsQuerySchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);
    const result = await listRecords(parsed.data);
    await auditLookup(req, admin.id, parsed.data, result.total);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
