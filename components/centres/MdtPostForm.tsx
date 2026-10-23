'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Send } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { AGE_BANDS, BODY_SITES, GENDERS, PROVINCES } from '@/lib/registry/constants';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import { fieldClass, labelClass } from '@/components/registry/field';

export type MdtPrefill = {
  gender?: string;
  ageBand?: string;
  province?: string;
  conditionSlug?: string;
  bodySite?: string;
};
export type MdtDocOption = { id: string; kind: string; size: number };

/** A de-identified case for the board. Prefilled from a patient when opened from their page; nothing links back to them. */
export function MdtPostForm({ prefill, documents }: { prefill: MdtPrefill; documents: MdtDocOption[] }) {
  const t = useTranslations('Centres.mdt');
  const td = useTranslations('Centres.documents');
  const tc = useTranslations('RegistryCommon');
  const locale = useLocale();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [gender, setGender] = useState(prefill.gender ?? '');
  const [ageBand, setAgeBand] = useState(prefill.ageBand ?? '');
  const [province, setProvince] = useState(prefill.province ?? '');
  const [conditionSlug, setCondition] = useState(prefill.conditionSlug ?? '');
  const [bodySite, setBodySite] = useState(prefill.bodySite ?? '');
  const [docIds, setDocIds] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/centre/mdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          confirmed,
          documentIds: docIds,
          ...(gender ? { gender } : {}),
          ...(ageBand ? { ageBand } : {}),
          ...(province ? { province } : {}),
          ...(conditionSlug ? { conditionSlug } : {}),
          ...(bodySite ? { bodySite } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) throw new Error();
      router.push(`/centre/mdt/${data.id}`);
    } catch {
      setState('error');
    }
  }

  const select = (id: string, label: string, value: string, set: (v: string) => void, options: { v: string; l: string }[]) => (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <select id={id} value={value} onChange={(e) => set(e.target.value)} className={fieldClass}>
        <option value="">{tc('select')}</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100/90">{t('warning')}</p>

      <div>
        <label htmlFor="mdt-title" className={labelClass}>{t('postTitle')}</label>
        <input id="mdt-title" required minLength={5} maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {select('mdt-gender', t('gender'), gender, setGender, GENDERS.map((g) => ({ v: g, l: tc(`genders.${g}`) })))}
        {select('mdt-age', t('ageBand'), ageBand, setAgeBand, AGE_BANDS.map((b) => ({ v: b.key, l: tc(`ageBands.${b.key}`) })))}
        {select('mdt-province', t('province'), province, setProvince, PROVINCES.map((p) => ({ v: p, l: tc(`provinces.${p}`) })))}
        {select('mdt-condition', t('condition'), conditionSlug, setCondition, CONDITIONS.map((c) => ({ v: c.slug, l: localized(c.name, locale) })))}
        {select('mdt-site', t('bodySite'), bodySite, setBodySite, BODY_SITES.map((b) => ({ v: b, l: tc(`bodySites.${b}`) })))}
      </div>

      <div>
        <label htmlFor="mdt-summary" className={labelClass}>{t('summary')}</label>
        <textarea id="mdt-summary" required minLength={20} maxLength={4000} rows={8} value={summary} onChange={(e) => setSummary(e.target.value)} className={fieldClass} />
        <p className="mt-1 text-xs text-[var(--color-faint)]">{t('summaryHint')}</p>
      </div>

      {documents.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-[var(--color-muted)]">{t('attach')}</legend>
          <div className="flex flex-col gap-2">
            {documents.map((d) => (
              <label key={d.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={docIds.includes(d.id)}
                  onChange={(e) => setDocIds((cur) => (e.target.checked ? [...cur, d.id] : cur.filter((x) => x !== d.id)))}
                  className="size-4 accent-[var(--color-cyan)]"
                />
                {td(`kinds.${d.kind}`)} · {Math.max(1, Math.round(d.size / 1024))} KB
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--color-muted)]">
        <input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-cyan)]" />
        <span>{t('confirm')}</span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === 'sending' || !confirmed}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {state === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t('publish')}
        </button>
        {state === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</p>}
      </div>
    </form>
  );
}
