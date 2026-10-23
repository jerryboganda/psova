'use client';

import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { brandButtonClass } from '@/components/registry/field';

export function PrintButton() {
  const t = useTranslations('Centres.certificate');
  return (
    <button type="button" onClick={() => window.print()} className={brandButtonClass}>
      <Printer className="size-4" />
      {t('print')}
    </button>
  );
}
