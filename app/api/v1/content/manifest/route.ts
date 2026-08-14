import { serverContentSnapshot } from '@/lib/server/content';

export const runtime = 'nodejs';

export async function GET() {
  const snapshot = await serverContentSnapshot();
  return Response.json({ schemaVersion: snapshot.schemaVersion, revision: snapshot.revision, publishedAt: snapshot.publishedAt, checksum: snapshot.checksum, review: snapshot.review }, { headers: { ETag: `"${snapshot.checksum}"`, 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400' } });
}
