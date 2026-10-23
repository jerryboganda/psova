'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe2, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';

/** Opt a patient into (or out of) the national registry. Consent is the patient's: recorded at intake or confirmed here. */
export function NvarSharePanel({
  patientId,
  shared,
  nvarStatus,
  consentRecorded,
  rejectReason,
}: {
  patientId: string;
  shared: boolean;
  nvarStatus: string;
  consentRecorded: boolean;
  rejectReason: string | null;
}) {
  const t = useTranslations('Centres.sharing');
  const tc = useTranslations('RegistryCommon');
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/centre/patients/${patientId}/nvar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error === 'invalid-transition' ? t('nvarWithdrawBlocked') : t('error'));
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setBusy(false);
    }
  }

  const canWithdraw = nvarStatus === 'PENDING' || nvarStatus === 'REJECTED';
  const btn = 'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60';

  return (
    <div>
      <h3 className="mb-1 flex items-center gap-2 font-semibold">
        <Globe2 className="size-4 text-[var(--color-cyan)]" />
        {t('nvarTitle')}
      </h3>
      <p className="mb-3 text-sm text-[var(--color-muted)]">{shared ? t('nvarShared') : t('nvarNot')}</p>

      {shared ? (
        <>
          <p className="mb-3 text-sm">
            {t('nvarStatus')}: <span className="font-semibold">{tc(`statuses.${nvarStatus}`)}</span>
          </p>
          {nvarStatus === 'REJECTED' && rejectReason && (
            <p className="mb-3 rounded-xl border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/5 p-3 text-xs text-[var(--color-rose)]">{rejectReason}</p>
          )}
          {canWithdraw ? (
            <button type="button" disabled={busy} onClick={() => send({ action: 'WITHDRAW' })} className={`${btn} border border-white/10 bg-white/5`}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {t('nvarWithdraw')}
            </button>
          ) : (
            <p className="text-xs text-[var(--color-faint)]">{t('nvarWithdrawBlocked')}</p>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {!consentRecorded && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[var(--color-muted)]">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-cyan)]" />
              <span>{t('nvarConsent')}</span>
            </label>
          )}
          <div>
            <button
              type="button"
              disabled={busy || (!consentRecorded && !confirmed)}
              onClick={() => send({ action: 'SHARE', consentConfirmed: confirmed })}
              className={`${btn} bg-brand text-white`}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {t('nvarShare')}
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-[var(--color-rose)]">{error}</p>}
    </div>
  );
}
