'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function NewsletterForm() {
  const t = useTranslations('Footer');
  const [done, setDone] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
      className="flex items-center gap-2"
    >
      <input
        type="email"
        required
        aria-label={t('newsletter')}
        placeholder={t('emailPlaceholder')}
        className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[var(--color-faint)] focus:border-[var(--color-cyan)]/60 focus:outline-none"
      />
      <button
        type="submit"
        aria-label={t('subscribe')}
        className="bg-brand grid size-10 shrink-0 place-items-center rounded-full text-white"
      >
        {done ? <Check className="size-4" /> : <ArrowRight className="size-4 rtl:rotate-180" />}
      </button>
    </form>
  );
}
