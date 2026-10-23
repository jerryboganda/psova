// GET /api/centre/reports/export?kind=patients|visits — the centre's own data as CSV (decrypted, audited).
// Owner only. Deliberately not membership-guarded: a lapsed centre can always take its data out.
import { exportCentreCsv } from '@/lib/registry/centre-reports';
import { reportExportQuerySchema } from '@/lib/registry/schemas';
import { limit } from '@/lib/registry/rate-limit';
import {
  RegistryApiError,
  apiError,
  getClientIp,
  handleApiError,
  requireCenterMember,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER'] });
    // 5 exports an hour per person: an export is the biggest single read of patient data.
    if (!limit('centreExport', user.id, 5, 60 * 60 * 1000)) throw new RegistryApiError(429, 'rate-limited');
    const parsed = reportExportQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parsed.success) return apiError('validation', 400);

    const { stream } = await exportCentreCsv(center, parsed.data.kind, { actorId: user.id, ip: getClientIp(req) });
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="psova-${center.slug}-${parsed.data.kind}-${stamp}.csv"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
