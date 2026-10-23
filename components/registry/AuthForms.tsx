'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Check, LogIn, UserPlus } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/registry/auth-client';
import {
  loginSchema,
  clinicianRegisterSchema,
  type LoginInput,
  type ClinicianRegisterInput,
} from '@/lib/registry/schemas';
import { PROVINCES } from '@/lib/registry/constants';
import { fieldClass, labelClass, errorClass, brandButtonClass } from './field';
import { cn } from '@/lib/utils';

type Tab = 'signin' | 'register';

export function AuthForms() {
  const t = useTranslations('RegistryAuth');
  const [tab, setTab] = useState<Tab>('signin');

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        role="tablist"
        aria-label={t('title')}
        className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/5 p-1"
      >
        <TabButton active={tab === 'signin'} onClick={() => setTab('signin')} icon={<LogIn className="size-4" />}>
          {t('signIn')}
        </TabButton>
        <TabButton active={tab === 'register'} onClick={() => setTab('register')} icon={<UserPlus className="size-4" />}>
          {t('register')}
        </TabButton>
      </div>

      {tab === 'signin' ? <SignInForm onSwitch={() => setTab('register')} /> : <RegisterForm onSwitch={() => setTab('signin')} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
        active ? 'bg-brand text-white' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/* ------------------------------- sign in ---------------------------------- */

function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const t = useTranslations('RegistryAuth');
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setStatus('sending');
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setStatus('error');
      return;
    }
    // Route by role.
    const session = await authClient.getSession();
    const role = (session.data?.user as { role?: string } | undefined)?.role;
    router.push(role === 'admin' ? '/registry/admin' : role === 'center' ? '/centre' : '/registry/clinician');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="signin-email" className={labelClass}>
          {t('email')}
        </label>
        <input id="signin-email" type="email" autoComplete="email" className={fieldClass} aria-invalid={!!errors.email} {...register('email')} />
        {errors.email && <p className={errorClass}>{t('errorsGeneric')}</p>}
      </div>
      <div>
        <label htmlFor="signin-password" className={labelClass}>
          {t('password')}
        </label>
        <input id="signin-password" type="password" autoComplete="current-password" className={fieldClass} aria-invalid={!!errors.password} {...register('password')} />
      </div>
      {status === 'error' && <p className={errorClass}>{t('errorsGeneric')}</p>}
      <button type="submit" disabled={status === 'sending'} className={brandButtonClass}>
        {status === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4 rtl:-scale-x-100" />}
        {status === 'sending' ? t('signingIn') : t('submitSignIn')}
      </button>
      <button type="button" onClick={onSwitch} className="text-sm text-[var(--color-cyan)] hover:underline">
        {t('toRegister')}
      </button>
    </form>
  );
}

/* ------------------------------- register --------------------------------- */

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const t = useTranslations('RegistryAuth');
  const tc = useTranslations('RegistryCommon');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClinicianRegisterInput>({ resolver: zodResolver(clinicianRegisterSchema) });

  async function onSubmit(values: ClinicianRegisterInput) {
    setStatus('sending');
    try {
      const res = await fetch('/api/registry/clinicians/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 p-10 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
          <Check className="size-7" />
        </div>
        <h3 className="text-lg font-semibold">{t('registerSuccessTitle')}</h3>
        <p className="text-sm text-[var(--color-muted)]">{t('registerSuccessBody')}</p>
        <button type="button" onClick={onSwitch} className="text-sm text-[var(--color-cyan)] hover:underline">
          {t('toSignIn')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <input type="text" tabIndex={-1} aria-hidden autoComplete="off" className="hidden" {...register('website')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-name" label={t('name')} error={!!errors.name} reg={register('name')} />
        <Field id="reg-email" label={t('email')} type="email" autoComplete="email" error={!!errors.email} reg={register('email')} />
      </div>
      <div>
        <label htmlFor="reg-password" className={labelClass}>
          {t('password')}
        </label>
        <input id="reg-password" type="password" autoComplete="new-password" className={fieldClass} aria-invalid={!!errors.password} {...register('password')} />
        <p className="mt-1 text-xs text-[var(--color-faint)]">{t('passwordHint')}</p>
        {errors.password && <p className={errorClass}>{t('passwordHint')}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-pmc" label={t('pmc')} error={!!errors.pmcNumber} reg={register('pmcNumber')} />
        <Field id="reg-specialty" label={t('specialty')} error={!!errors.specialty} reg={register('specialty')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-facility" label={t('facility')} error={!!errors.facility} reg={register('facility')} />
        <Field id="reg-city" label={t('city')} error={!!errors.city} reg={register('city')} />
      </div>
      <div>
        <label htmlFor="reg-province" className={labelClass}>
          {t('province')}
        </label>
        <select id="reg-province" className={fieldClass} defaultValue="" aria-invalid={!!errors.province} {...register('province')}>
          <option value="" disabled>
            {tc('select')}
          </option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {tc(`provinces.${p}`)}
            </option>
          ))}
        </select>
      </div>
      {status === 'error' && <p className={errorClass}>{t('errorsGeneric')}</p>}
      <button type="submit" disabled={status === 'sending'} className={brandButtonClass}>
        {status === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        {status === 'sending' ? t('registering') : t('submitRegister')}
      </button>
      <button type="button" onClick={onSwitch} className="text-sm text-[var(--color-cyan)] hover:underline">
        {t('toSignIn')}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  error,
  reg,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: boolean;
  reg: ReturnType<ReturnType<typeof useForm>['register']>;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} type={type} autoComplete={autoComplete} className={fieldClass} aria-invalid={error} {...reg} />
    </div>
  );
}
