// Shared form styling tokens for registry forms — mirrors the ContactForm
// `field` class so registry inputs look native to the site (UI-SPEC §1).

export const fieldClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-faint)] transition-colors focus:border-[var(--color-cyan)]/60 focus:outline-none disabled:opacity-60';

export const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--color-muted)]';

export const errorClass = 'mt-1 text-xs text-[var(--color-rose)]';

export const brandButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60';
