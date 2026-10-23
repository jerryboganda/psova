import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from '@/i18n/navigation';
import { CaseAttributes } from '@/components/centres/CaseAttributes';
import { MdtCommentForm, MdtStatusButton } from '@/components/centres/MdtDiscussion';
import { getMdtPost } from '@/lib/registry/centre-mdt';
import { centrePageContext } from '@/lib/registry/centre-page';
import { membershipAllowsWrites } from '@/lib/registry/membership';

export const dynamic = 'force-dynamic';

export default async function MdtPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { center, state } = await centrePageContext(locale, ['OWNER', 'DOCTOR']);
  const post = await getMdtPost(id);
  if (!post) notFound();

  const t = await getTranslations('Centres.mdt');
  const td = await getTranslations('Centres.documents');
  const format = await getFormatter();
  const canWrite = membershipAllowsWrites(state);
  const isAuthorCentre = post.centreId === center.id;

  return (
    <Section>
      <Link href="/centre/mdt" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">
        <ArrowLeft className="size-4 rtl:-scale-x-100" />
        {t('back')}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{post.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {post.centre.name} · {post.centre.city}
            {post.author && <> · {post.author}</>} · {format.dateTime(new Date(post.createdAt), { dateStyle: 'medium' })} · {t(`status.${post.status}`)}
          </p>
        </div>
        {isAuthorCentre && canWrite && <MdtStatusButton postId={post.id} status={post.status} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-6">
          <GlassCard interactive={false}>
            <div className="mb-4">
              <CaseAttributes
                gender={post.gender}
                ageBand={post.ageBand}
                province={post.province}
                conditionSlug={post.conditionSlug}
                bodySite={post.bodySite}
              />
            </div>
            <p className="whitespace-pre-wrap text-sm">{post.summary}</p>
            {post.documents.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {post.documents.map((d, i) => (
                  <li key={d.id}>
                    <a
                      href={`/api/centre/mdt/${post.id}/documents/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
                    >
                      {td(`kinds.${d.kind}`)} {i + 1} · {d.mime.startsWith('image/') ? td('open') : td('download')}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>

        <GlassCard interactive={false}>
          <h2 className="mb-4 text-lg font-bold">{t('discussion', { count: post.comments.length })}</h2>
          {post.comments.length === 0 ? (
            <p className="mb-5 text-sm text-[var(--color-muted)]">{t('noComments')}</p>
          ) : (
            <ul className="mb-5 flex flex-col gap-4">
              {post.comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="text-xs text-[var(--color-faint)]">
                    {c.author ?? t('unknownAuthor')} · {c.centre} · {format.dateTime(new Date(c.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
          {canWrite ? <MdtCommentForm postId={post.id} /> : <p className="text-sm text-[var(--color-muted)]">{t('readOnly')}</p>}
        </GlassCard>
      </div>
    </Section>
  );
}
