import { serverContentSnapshot } from '@/lib/server/content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const snapshot = await serverContentSnapshot();
  const etag = `"${snapshot.checksum}"`;
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  return Response.json(snapshot, { headers: { ETag: etag, 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400', 'X-Content-Revision': snapshot.revision } });
}
