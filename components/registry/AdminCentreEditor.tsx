'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Save, Trash2, UserPlus, Mail, Power, X } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { Dialog } from './Dialog';
import { fieldClass, labelClass, errorClass, brandButtonClass } from './field';
import { GlassCard } from '@/components/ui/GlassCard';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import {
  CENTER_SERVICES,
  CENTER_STATUSES,
  CENTER_TIERS,
  CENTER_TYPES,
  CENTER_ROLES,
  CONDITION_SLUGS,
  PROVINCES,
} from '@/lib/registry/constants';
import { cn } from '@/lib/utils';

type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  isOwner: boolean;
  createdAt: string;
};

type PaymentRow = {
  id: string;
  amount: number;
  method: string;
  txnRef: string;
  paidOn: string;
  status: string;
  rejectReason: string | null;
  createdAt: string;
};

type CenterDetail = {
  id: string;
  slug: string;
  nameEn: string;
  nameUr: string | null;
  type: string;
  city: string;
  province: string;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  lat: number | null;
  lng: number | null;
  services: string[];
  conditions: string[];
  licenceNumber: string;
  headDoctorName: string;
  headDoctorPmc: string;
  status: string;
  tier: string;
  statusReason: string | null;
  approvedAt: string | null;
  membershipExpiresAt: string | null;
  membership: string;
  createdAt: string;
  updatedAt: string;
};

type Detail = {
  center: CenterDetail;
  staff: StaffRow[];
  payments: PaymentRow[];
  counts: Record<string, number>;
};

type FormState = {
  nameEn: string;
  nameUr: string;
  type: string;
  city: string;
  province: string;
  address: string;
  phone: string;
  contactEmail: string;
  websiteUrl: string;
  lat: string;
  lng: string;
  services: string[];
  conditions: string[];
  licenceNumber: string;
  headDoctorName: string;
  headDoctorPmc: string;
  status: string;
  tier: string;
  membershipExpiresAt: string;
  statusReason: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
};

const emptyForm: FormState = {
  nameEn: '',
  nameUr: '',
  type: 'PRIVATE',
  city: '',
  province: 'PUNJAB',
  address: '',
  phone: '',
  contactEmail: '',
  websiteUrl: '',
  lat: '',
  lng: '',
  services: [],
  conditions: [],
  licenceNumber: '',
  headDoctorName: '',
  headDoctorPmc: '',
  status: 'APPROVED',
  tier: 'MEMBER',
  membershipExpiresAt: '',
  statusReason: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
};

function formFromDetail(d: CenterDetail): FormState {
  return {
    nameEn: d.nameEn,
    nameUr: d.nameUr ?? '',
    type: d.type,
    city: d.city,
    province: d.province,
    address: d.address,
    phone: d.phone,
    contactEmail: d.email,
    websiteUrl: d.website ?? '',
    lat: d.lat != null ? String(d.lat) : '',
    lng: d.lng != null ? String(d.lng) : '',
    services: d.services,
    conditions: d.conditions,
    licenceNumber: d.licenceNumber,
    headDoctorName: d.headDoctorName,
    headDoctorPmc: d.headDoctorPmc,
    status: d.status,
    tier: d.tier,
    membershipExpiresAt: d.membershipExpiresAt?.slice(0, 10) ?? '',
    statusReason: d.statusReason ?? '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
  };
}

export function AdminCentreEditor({ id }: { id?: string }) {
  const t = useTranslations('RegistryAdmin.centreForm');
  const tc = useTranslations('RegistryAdmin.centres');
  const tp = useTranslations('RegistryAdmin.payments');
  const tcm = useTranslations('RegistryCommon');
  const tcn = useTranslations('Centres');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();

  const isCreate = !id;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [staffOpen, setStaffOpen] = useState(false);
  const [staffBusy, setStaffBusy] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'DOCTOR', password: '' });
  const [removeStaff, setRemoveStaff] = useState<StaffRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/registry/admin/centres/${id}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      setDetail(data as Detail);
      setForm(formFromDetail(data.center as CenterDetail));
    } catch {
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleList(key: 'services' | 'conditions', value: string) {
    setForm((f) => {
      const list = f[key];
      return {
        ...f,
        [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
      };
    });
  }

  function payload() {
    const base: Record<string, unknown> = {
      nameEn: form.nameEn,
      nameUr: form.nameUr,
      type: form.type,
      city: form.city,
      province: form.province,
      address: form.address,
      phone: form.phone,
      contactEmail: form.contactEmail,
      websiteUrl: form.websiteUrl,
      services: form.services,
      conditions: form.conditions,
      licenceNumber: form.licenceNumber,
      headDoctorName: form.headDoctorName,
      status: form.status,
      tier: form.tier,
      membershipExpiresAt: form.membershipExpiresAt,
      statusReason: form.statusReason,
    };
    if (form.headDoctorPmc.trim()) base.headDoctorPmc = form.headDoctorPmc;
    if (form.lat.trim()) base.lat = Number(form.lat);
    else if (!isCreate) base.lat = null;
    if (form.lng.trim()) base.lng = Number(form.lng);
    else if (!isCreate) base.lng = null;
    if (isCreate) {
      base.ownerName = form.ownerName;
      base.ownerEmail = form.ownerEmail;
      if (form.ownerPassword.trim()) base.ownerPassword = form.ownerPassword;
    } else {
      base.action = 'UPDATE';
    }
    return base;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (form.services.length === 0 || form.conditions.length === 0) {
      setError(t('chooseAtLeastOne'));
      return;
    }
    if ((form.status === 'REJECTED' || form.status === 'SUSPENDED') && form.statusReason.trim().length < 5) {
      setError(t('reasonRequired'));
      return;
    }
    if (isCreate && Boolean(form.ownerName.trim()) !== Boolean(form.ownerEmail.trim())) {
      setError(t('ownerPair'));
      return;
    }
    if ((form.lat.trim() && Number.isNaN(Number(form.lat))) || (form.lng.trim() && Number.isNaN(Number(form.lng)))) {
      setError(t('coords'));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        isCreate ? '/api/registry/admin/centres' : `/api/registry/admin/centres/${id}`,
        {
          method: isCreate ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload()),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 409
            ? t('conflict')
            : res.status === 400
              ? t('validation')
              : t('saveError'),
        );
        return;
      }
      if (isCreate) {
        setNotice(t('created'));
        router.push(`/registry/admin/centres/${data.id}`);
        router.refresh();
      } else {
        setNotice(t('saved'));
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function staffAction(member: StaffRow, action: 'SET_ROLE' | 'DEACTIVATE' | 'REACTIVATE' | 'RESEND', role?: string) {
    if (!id || staffBusy) return;
    setStaffBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/registry/admin/centres/${id}/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(role ? { role } : {}) }),
      });
      if (!res.ok) {
        setError(res.status === 409 ? t('lastOwner') : t('staffError'));
        await load();
        return;
      }
      await load();
    } finally {
      setStaffBusy(false);
    }
  }

  async function addStaff(e: FormEvent) {
    e.preventDefault();
    if (!id || staffBusy) return;
    setStaffBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/registry/admin/centres/${id}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });
      if (!res.ok) {
        setError(res.status === 409 ? t('staffExists') : t('staffError'));
        return;
      }
      setStaffOpen(false);
      setStaffForm({ name: '', email: '', role: 'DOCTOR', password: '' });
      await load();
    } finally {
      setStaffBusy(false);
    }
  }

  async function confirmRemoveStaff() {
    if (!id || !removeStaff || staffBusy) return;
    setStaffBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/registry/admin/centres/${id}/staff/${removeStaff.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setError(res.status === 409 ? t('lastOwner') : t('staffError'));
        return;
      }
      setRemoveStaff(null);
      await load();
    } finally {
      setStaffBusy(false);
    }
  }

  async function deleteCentre() {
    if (!id || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/registry/admin/centres/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError(res.status === 409 ? t('deleteBlocked') : t('deleteError'));
        return;
      }
      router.push('/registry/admin/centres');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[var(--color-muted)]">
        <Loader2 className="size-5 animate-spin" /> {tcm('loading')}
      </div>
    );
  }

  const counts = detail?.counts;
  const linkedRecords = counts
    ? Object.values(counts).reduce((sum, n) => sum + n, 0)
    : 0;
  const allowedNext: Record<string, string[]> = {
    APPLIED: ['APPROVED', 'REJECTED'],
    APPROVED: ['SUSPENDED'],
    REJECTED: ['APPROVED'],
    SUSPENDED: ['APPROVED'],
  };
  const currentStatus = detail?.center.status ?? form.status;
  const statusOptions = isCreate
    ? CENTER_STATUSES
    : CENTER_STATUSES.filter((s) => s === currentStatus || (allowedNext[currentStatus] ?? []).includes(s));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link
        href="/registry/admin/centres"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-4 rtl:-scale-x-100" /> {t('back')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {isCreate ? t('createTitle') : detail?.center.nameEn || t('editTitle')}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {isCreate ? t('createLede') : detail?.center.slug}
          </p>
        </div>
        {!isCreate && detail && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {tc(`statuses.${detail.center.status}`)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {tcn(`tiers.${detail.center.tier}`)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {tc(`states.${detail.center.membership}`)}
            </span>
          </div>
        )}
      </div>

      {error && <p role="alert" className="rounded-2xl border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/5 px-4 py-3 text-sm text-[var(--color-rose)]">{error}</p>}
      {notice && <p role="status" className="rounded-2xl border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 px-4 py-3 text-sm text-[var(--color-cyan)]">{notice}</p>}

      <form onSubmit={submit} className="flex flex-col gap-6">
        <GlassCard interactive={false} className="p-5 md:p-6">
          <h2 className="mb-4 text-lg font-bold">{t('identity')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cf-nameEn" className={labelClass}>{t('nameEn')}</label>
              <input id="cf-nameEn" required minLength={3} className={fieldClass} value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-nameUr" className={labelClass}>{t('nameUr')}</label>
              <input id="cf-nameUr" dir="rtl" lang="ur" className={fieldClass} value={form.nameUr} onChange={(e) => set('nameUr', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-type" className={labelClass}>{t('type')}</label>
              <select id="cf-type" className={fieldClass} value={form.type} onChange={(e) => set('type', e.target.value)}>
                {CENTER_TYPES.map((v) => <option key={v} value={v}>{tcn(`apply.types.${v}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cf-licence" className={labelClass}>{t('licenceNumber')}</label>
              <input id="cf-licence" required minLength={3} className={fieldClass} value={form.licenceNumber} onChange={(e) => set('licenceNumber', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-doctor" className={labelClass}>{t('headDoctorName')}</label>
              <input id="cf-doctor" required minLength={3} className={fieldClass} value={form.headDoctorName} onChange={(e) => set('headDoctorName', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-pmc" className={labelClass}>{t('headDoctorPmc')}</label>
              <input id="cf-pmc" dir="ltr" required minLength={4} className={fieldClass} value={form.headDoctorPmc} onChange={(e) => set('headDoctorPmc', e.target.value)} />
            </div>
          </div>
        </GlassCard>

        <GlassCard interactive={false} className="p-5 md:p-6">
          <h2 className="mb-4 text-lg font-bold">{t('location')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cf-city" className={labelClass}>{t('city')}</label>
              <input id="cf-city" required minLength={2} className={fieldClass} value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-province" className={labelClass}>{t('province')}</label>
              <select id="cf-province" className={fieldClass} value={form.province} onChange={(e) => set('province', e.target.value)}>
                {PROVINCES.map((v) => <option key={v} value={v}>{tcm(`provinces.${v}`)}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cf-address" className={labelClass}>{t('address')}</label>
              <textarea id="cf-address" required minLength={5} rows={2} className={fieldClass} value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-phone" className={labelClass}>{t('phone')}</label>
              <input id="cf-phone" dir="ltr" required minLength={7} className={fieldClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-email" className={labelClass}>{t('contactEmail')}</label>
              <input id="cf-email" type="email" required className={fieldClass} value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cf-website" className={labelClass}>{t('websiteUrl')}</label>
              <input id="cf-website" type="url" dir="ltr" className={fieldClass} value={form.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-lat" className={labelClass}>{t('latitude')}</label>
              <input id="cf-lat" dir="ltr" inputMode="decimal" className={fieldClass} value={form.lat} onChange={(e) => set('lat', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-lng" className={labelClass}>{t('longitude')}</label>
              <input id="cf-lng" dir="ltr" inputMode="decimal" className={fieldClass} value={form.lng} onChange={(e) => set('lng', e.target.value)} />
            </div>
          </div>
        </GlassCard>

        <GlassCard interactive={false} className="p-5 md:p-6">
          <h2 className="mb-1 text-lg font-bold">{t('care')}</h2>
          <p className="mb-4 text-sm text-[var(--color-muted)]">{t('careHint')}</p>
          <fieldset>
            <legend className={labelClass}>{t('services')}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CENTER_SERVICES.map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <input type="checkbox" checked={form.services.includes(v)} onChange={() => toggleList('services', v)} className="size-4 accent-[var(--color-cyan)]" />
                  {tcn(`services.${v}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className={labelClass}>{t('conditions')}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONDITION_SLUGS.map((slug) => {
                const c = CONDITIONS.find((x) => x.slug === slug);
                return (
                  <label key={slug} className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <input type="checkbox" checked={form.conditions.includes(slug)} onChange={() => toggleList('conditions', slug)} className="size-4 accent-[var(--color-cyan)]" />
                    {c ? localized(c.name, locale) : slug}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {form.services.length === 0 || form.conditions.length === 0 ? (
            <p className={errorClass}>{t('chooseAtLeastOne')}</p>
          ) : null}
        </GlassCard>

        <GlassCard interactive={false} className="p-5 md:p-6">
          <h2 className="mb-4 text-lg font-bold">{t('statusMembership')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cf-status" className={labelClass}>{t('status')}</label>
              <select id="cf-status" className={fieldClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {statusOptions.map((v) => <option key={v} value={v}>{tc(`statuses.${v}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cf-tier" className={labelClass}>{t('tier')}</label>
              <select id="cf-tier" className={fieldClass} value={form.tier} onChange={(e) => set('tier', e.target.value)}>
                {CENTER_TIERS.map((v) => <option key={v} value={v}>{tcn(`tiers.${v}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cf-expiry" className={labelClass}>{t('membershipExpiresAt')}</label>
              <input id="cf-expiry" type="date" dir="ltr" className={fieldClass} value={form.membershipExpiresAt} onChange={(e) => set('membershipExpiresAt', e.target.value)} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--color-faint)]">{t('membershipHint')}</p>
          <div className="mt-4">
            <label htmlFor="cf-reason" className={labelClass}>{t('statusReason')}</label>
            <textarea id="cf-reason" rows={2} className={fieldClass} value={form.statusReason} onChange={(e) => set('statusReason', e.target.value)} />
            <p className="mt-1 text-xs text-[var(--color-faint)]">{t('statusReasonHint')}</p>
          </div>
        </GlassCard>

        {isCreate && (
          <GlassCard interactive={false} className="p-5 md:p-6">
            <h2 className="mb-1 text-lg font-bold">{t('owner')}</h2>
            <p className="mb-4 text-sm text-[var(--color-muted)]">{t('ownerHint')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cf-owner-name" className={labelClass}>{t('ownerName')}</label>
                <input id="cf-owner-name" className={fieldClass} value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
              </div>
              <div>
                <label htmlFor="cf-owner-email" className={labelClass}>{t('ownerEmail')}</label>
                <input id="cf-owner-email" type="email" dir="ltr" className={fieldClass} value={form.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} />
              </div>
              <div>
                <label htmlFor="cf-owner-password" className={labelClass}>{t('ownerPassword')}</label>
                <input id="cf-owner-password" type="password" dir="ltr" minLength={10} className={fieldClass} value={form.ownerPassword} onChange={(e) => set('ownerPassword', e.target.value)} />
                <p className="mt-1 text-xs text-[var(--color-faint)]">{t('ownerPasswordHint')}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--color-faint)]">{t('ownerEmailHint')}</p>
          </GlassCard>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className={brandButtonClass}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isCreate ? t('create') : t('save')}
            </button>
          </div>
          {!isCreate && detail && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 px-5 py-3 text-sm font-semibold text-[var(--color-rose)]"
            >
              <Trash2 className="size-4" /> {t('delete')}
            </button>
          )}
        </div>
      </form>

      {!isCreate && detail && (
        <>
          <GlassCard interactive={false} className="p-5 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{t('staff')}</h2>
                <p className="text-sm text-[var(--color-muted)]">{t('staffHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => { setError(null); setStaffOpen(true); }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-cyan)]"
              >
                <UserPlus className="size-4" /> {t('addStaff')}
              </button>
            </div>
            {detail.staff.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">{t('noStaff')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-[var(--color-faint)]">
                      <th className="px-3 py-2 text-start">{t('name')}</th>
                      <th className="px-3 py-2 text-start">{t('email')}</th>
                      <th className="px-3 py-2 text-start">{t('role')}</th>
                      <th className="px-3 py-2 text-start">{t('state')}</th>
                      <th className="px-3 py-2 text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.staff.map((m) => (
                      <tr key={m.id} className="border-b border-white/5">
                        <td className="px-3 py-3">{m.name}{m.isOwner ? <span className="ms-2 text-xs text-[var(--color-faint)]">({tcn('staff.roles.OWNER')})</span> : null}</td>
                        <td className="px-3 py-3 text-xs" dir="ltr">{m.email}</td>
                        <td className="px-3 py-3">
                          <select
                            aria-label={t('role')}
                            className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
                            value={m.role}
                            disabled={staffBusy}
                            onChange={(e) => staffAction(m, 'SET_ROLE', e.target.value)}
                          >
                            {CENTER_ROLES.map((r) => <option key={r} value={r}>{tcn(`staff.roles.${r}`)}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-xs">{m.active ? t('active') : t('inactive')}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" disabled={staffBusy} onClick={() => staffAction(m, 'RESEND')} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--color-muted)]" title={t('resend')}>
                              <Mail className="size-3.5" /> {t('resend')}
                            </button>
                            <button type="button" disabled={staffBusy} onClick={() => staffAction(m, m.active ? 'DEACTIVATE' : 'REACTIVATE')} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--color-muted)]">
                              <Power className="size-3.5" /> {m.active ? t('deactivate') : t('reactivate')}
                            </button>
                            {!m.isOwner && (
                              <button type="button" disabled={staffBusy} onClick={() => setRemoveStaff(m)} className="inline-flex items-center gap-1 rounded-full border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/10 px-3 py-1 text-xs text-[var(--color-rose)]">
                                <X className="size-3.5" /> {t('remove')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          <GlassCard interactive={false} className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{t('payments')}</h2>
              <Link href="/registry/admin/centres?tab=payments" className="text-sm text-[var(--color-cyan)] hover:underline">
                {t('allPayments')}
              </Link>
            </div>
            {detail.payments.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">{t('noPayments')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-[var(--color-faint)]">
                      <th className="px-3 py-2 text-start">{tp('amount')}</th>
                      <th className="px-3 py-2 text-start">{tp('method')}</th>
                      <th className="px-3 py-2 text-start">{tp('txn')}</th>
                      <th className="px-3 py-2 text-start">{tp('paidOn')}</th>
                      <th className="px-3 py-2 text-start">{tp('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.payments.map((p) => (
                      <tr key={p.id} className="border-b border-white/5">
                        <td className="px-3 py-3" dir="ltr">PKR {p.amount.toLocaleString('en-US')}</td>
                        <td className="px-3 py-3">{tcn(`apply.payment.methods.${p.method}`)}</td>
                        <td className="px-3 py-3 font-mono text-xs" dir="ltr">{p.txnRef}</td>
                        <td className="px-3 py-3">{format.dateTime(new Date(p.paidOn), { dateStyle: 'medium' })}</td>
                        <td className="px-3 py-3 text-xs">{tp(`statuses.${p.status}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          <p className="text-xs text-[var(--color-faint)]">
            {t('linkedRecords', { count: linkedRecords })}
          </p>
        </>
      )}

      <Dialog
        open={staffOpen}
        onClose={() => setStaffOpen(false)}
        title={t('addStaffTitle')}
        footer={
          <>
            <button type="button" onClick={() => setStaffOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[var(--color-fg)]">
              {t('cancel')}
            </button>
            <button type="submit" form="staff-form" disabled={staffBusy} className={cn(brandButtonClass, 'px-5 py-2.5')}>
              {staffBusy && <Loader2 className="size-4 animate-spin" />} {t('addStaff')}
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={addStaff} className="flex flex-col gap-4">
          <div>
            <label htmlFor="sf-name" className={labelClass}>{t('staffName')}</label>
            <input id="sf-name" required minLength={2} className={fieldClass} value={staffForm.name} onChange={(e) => setStaffForm((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="sf-email" className={labelClass}>{t('email')}</label>
            <input id="sf-email" type="email" required dir="ltr" className={fieldClass} value={staffForm.email} onChange={(e) => setStaffForm((s) => ({ ...s, email: e.target.value }))} />
            <p className="mt-1 text-xs text-[var(--color-faint)]">{t('staffEmailHint')}</p>
          </div>
          <div>
            <label htmlFor="sf-role" className={labelClass}>{t('role')}</label>
            <select id="sf-role" className={fieldClass} value={staffForm.role} onChange={(e) => setStaffForm((s) => ({ ...s, role: e.target.value }))}>
              {CENTER_ROLES.map((r) => <option key={r} value={r}>{tcn(`staff.roles.${r}`)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sf-password" className={labelClass}>{t('staffPassword')}</label>
            <input id="sf-password" type="password" dir="ltr" minLength={10} className={fieldClass} value={staffForm.password} onChange={(e) => setStaffForm((s) => ({ ...s, password: e.target.value }))} />
            <p className="mt-1 text-xs text-[var(--color-faint)]">{t('staffPasswordHint')}</p>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={removeStaff !== null}
        onClose={() => setRemoveStaff(null)}
        title={t('removeTitle')}
        footer={
          <>
            <button type="button" onClick={() => setRemoveStaff(null)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[var(--color-fg)]">
              {t('cancel')}
            </button>
            <button type="button" onClick={confirmRemoveStaff} disabled={staffBusy} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rose)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {staffBusy && <Loader2 className="size-4 animate-spin" />} {t('remove')}
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-muted)]">{t('removeBody', { name: removeStaff?.name ?? '' })}</p>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('deleteTitle')}
        footer={
          <>
            <button type="button" onClick={() => setDeleteOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[var(--color-fg)]">
              {t('cancel')}
            </button>
            <button type="button" onClick={deleteCentre} disabled={saving || linkedRecords > 0} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-rose)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {saving && <Loader2 className="size-4 animate-spin" />} {t('delete')}
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-muted)]">{t('deleteBody')}</p>
        {linkedRecords > 0 && <p className="mt-3 text-sm text-[var(--color-rose)]">{t('deleteBlocked')}</p>}
      </Dialog>
    </div>
  );
}
