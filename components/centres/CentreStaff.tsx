'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { staffInviteSchema, type StaffInviteInput } from '@/lib/registry/schemas';
import { CENTER_STAFF_ROLES } from '@/lib/registry/constants';
import { FormField } from '@/components/registry/FormField';
import { brandButtonClass, fieldClass } from '@/components/registry/field';
import { cn } from '@/lib/utils';

type Row = { id: string; name: string; email: string; role: string; active: boolean; isOwner: boolean };

const smallBtn =
  'inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/10 disabled:opacity-60';

export function CentreStaff() {
  const t = useTranslations('Centres.staff');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffInviteInput>({ resolver: zodResolver(staffInviteSchema) });

  const load = useCallback(async () => {
    const res = await fetch('/api/centre/staff', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (data?.ok) setRows(data.items as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function invite(values: StaffInviteInput) {
    setInviting(true);
    setNotice(null);
    try {
      const res = await fetch('/api/centre/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        reset();
        setNotice({ kind: 'ok', text: t('invited') });
        load();
      } else {
        setNotice({ kind: 'error', text: data?.error === 'conflict' ? t('exists') : t('error') });
      }
    } finally {
      setInviting(false);
    }
  }

  async function patch(id: string, body: Record<string, string>, okText?: string) {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/centre/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        if (okText) setNotice({ kind: 'ok', text: okText });
        load();
      } else {
        setNotice({ kind: 'error', text: t('error') });
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleSubmit(invite)}
        noValidate
        className="rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6"
      >
        <h2 className="mb-1 text-lg font-semibold">{t('inviteTitle')}</h2>
        <p className="mb-5 text-sm text-[var(--color-muted)]">{t('inviteLede')}</p>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="st-name" label={t('name')} required error={errors.name ? t('invalid') : undefined}>
            <input id="st-name" className={fieldClass} aria-invalid={!!errors.name} aria-describedby="st-name-error" {...register('name')} />
          </FormField>
          <FormField id="st-email" label={t('email')} required error={errors.email ? t('invalid') : undefined}>
            <input id="st-email" type="email" dir="ltr" className={fieldClass} aria-invalid={!!errors.email} aria-describedby="st-email-error" {...register('email')} />
          </FormField>
          <FormField id="st-role" label={t('role')} required error={errors.role ? t('invalid') : undefined}>
            <select id="st-role" className={fieldClass} defaultValue="" aria-invalid={!!errors.role} aria-describedby="st-role-error" {...register('role')}>
              <option value="" disabled>{t('choose')}</option>
              {CENTER_STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{t(`roles.${r}`)}</option>
              ))}
            </select>
          </FormField>
        </div>
        <ul className="mt-4 grid gap-1 text-xs text-[var(--color-faint)] md:grid-cols-3">
          {CENTER_STAFF_ROLES.map((r) => (
            <li key={r}><span className="font-semibold text-[var(--color-muted)]">{t(`roles.${r}`)}:</span> {t(`roleHelp.${r}`)}</li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={inviting} className={brandButtonClass}>
            {inviting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {t('invite')}
          </button>
          {notice && (
            <p role="status" className={cn('text-sm', notice.kind === 'ok' ? 'text-[var(--color-cyan)]' : 'text-[var(--color-rose)]')}>
              {notice.text}
            </p>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.02]">
        <h2 className="border-b border-white/10 px-6 py-4 text-lg font-semibold">{t('listTitle')}</h2>
        {loading ? (
          <p className="p-6 text-sm text-[var(--color-muted)]">…</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    {r.name}
                    {!r.active && <span className="ms-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-[var(--color-faint)]">{t('inactive')}</span>}
                  </p>
                  <p dir="ltr" className="truncate text-xs text-[var(--color-faint)]">{r.email}</p>
                </div>
                {r.isOwner ? (
                  <span className="rounded-full bg-[var(--color-cyan)]/15 px-3 py-1 text-xs font-semibold text-[var(--color-cyan)]">
                    {t('roles.OWNER')}
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={t('role')}
                      value={r.role}
                      disabled={busyId === r.id}
                      onChange={(e) => patch(r.id, { action: 'SET_ROLE', role: e.target.value })}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs [&>option]:bg-[var(--color-base-900)]"
                    >
                      {CENTER_STAFF_ROLES.map((role) => (
                        <option key={role} value={role}>{t(`roles.${role}`)}</option>
                      ))}
                    </select>
                    <button type="button" disabled={busyId === r.id} onClick={() => patch(r.id, { action: 'RESEND' }, t('resent'))} className={smallBtn}>
                      <Mail className="size-3.5" />
                      {t('resend')}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id || !r.active}
                      onClick={() => {
                        if (window.confirm(t('transferConfirm', { name: r.name }))) {
                          patch(r.id, { action: 'TRANSFER_OWNER' }, t('transferred'));
                        }
                      }}
                      className={smallBtn}
                    >
                      <ShieldCheck className="size-3.5" />
                      {t('transferOwner')}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => patch(r.id, { action: r.active ? 'DEACTIVATE' : 'REACTIVATE' })}
                      className={cn(smallBtn, r.active && 'border-[var(--color-rose)]/40 text-[var(--color-rose)]')}
                    >
                      {r.active ? t('deactivate') : t('reactivate')}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
