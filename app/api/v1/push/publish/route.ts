import { z } from 'zod';
import { serverEnv } from '@/lib/server/env';
import { publishPush } from '@/lib/server/push';
import { serverContentSnapshot } from '@/lib/server/content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ eventId: z.string().regex(/^[a-z0-9-]{4,100}$/), newsId: z.string().min(1), dryRun: z.boolean().default(true) });

export async function POST(request: Request) {
  const env = serverEnv();
  if (!env.PUSH_PUBLISH_SECRET || request.headers.get('authorization') !== `Bearer ${env.PUSH_PUBLISH_SECRET}`) return Response.json({ ok: false }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: 'Invalid publication.' }, { status: 400 });
  const snapshot = await serverContentSnapshot(); const news = snapshot.news.find((item) => item.id === parsed.data.newsId);
  if (!news || (!parsed.data.dryRun && news.publicationStatus !== 'published')) return Response.json({ ok: false, error: 'News item is not approved for publication.' }, { status: 409 });
  const result = await publishPush({ eventId: parsed.data.eventId, title: news.title.en, body: news.excerpt.en, deepLink: `psova://news/${news.id}`, dryRun: parsed.data.dryRun });
  return Response.json({ ok: true, ...result });
}
