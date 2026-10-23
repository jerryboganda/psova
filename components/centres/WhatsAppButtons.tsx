'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { waLink } from '@/lib/registry/whatsapp';

/**
 * "Send on WhatsApp": opens WhatsApp Web with the message prefilled (no API, staff press
 * send). The click is audited server-side without any PII or message text.
 */
export function WhatsAppButtons({
  patientId,
  phone,
  template,
  texts,
}: {
  patientId: string;
  phone: string;
  template: 'trackingCode' | 'appointment' | 'missed';
  texts: { en: string; ur: string };
}) {
  const t = useTranslations('Centres.wa');
  const links = { en: waLink(phone, texts.en), ur: waLink(phone, texts.ur) };

  if (!links.en) return <p className="text-sm text-[var(--color-faint)]">{t('noMobile')}</p>;

  function open(lang: 'en' | 'ur') {
    // Fire-and-forget: the audit must never block opening WhatsApp.
    void fetch(`/api/centre/patients/${patientId}/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template }),
    }).catch(() => {});
    window.open(links[lang]!, '_blank', 'noopener,noreferrer');
  }

  const btn =
    'inline-flex items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2 text-sm font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/20';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => open('en')} className={btn}>
        <MessageCircle className="size-4" />
        {t('english')}
      </button>
      <button type="button" onClick={() => open('ur')} className={btn}>
        <MessageCircle className="size-4" />
        {t('urdu')}
      </button>
    </div>
  );
}
