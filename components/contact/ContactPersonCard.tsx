import { Phone, Mail } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/Social';
import { cn } from '@/lib/utils';

/**
 * Presentational donations/contact block (Dr Faisal + call + WhatsApp).
 * Takes already-translated labels as props so it works in both server pages
 * (Donate, Contact) and the client Footer without its own translation context.
 */
export function ContactPersonCard({
  name,
  role,
  phoneDisplay,
  telHref,
  waHref,
  callLabel,
  whatsappLabel,
  email,
  emailHref,
  emailLabel,
  className,
}: {
  name: string;
  role?: string;
  phoneDisplay: string;
  telHref: string;
  waHref: string;
  callLabel: string;
  whatsappLabel: string;
  email?: string;
  emailHref?: string;
  emailLabel?: string;
  className?: string;
}) {
  const pill =
    'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[var(--color-cyan)]';

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-center gap-4">
        <div className="bg-brand grid size-14 shrink-0 place-items-center rounded-full text-white">
          <Phone className="size-6" />
        </div>
        <div>
          <p className="text-lg font-semibold">{name}</p>
          {role && <p className="text-sm text-[var(--color-muted)]">{role}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={telHref} className={cn(pill, 'bg-brand text-white hover:-translate-y-0.5')}>
          <Phone className="size-4" />
          <span>{callLabel}:</span>
          <span dir="ltr">{phoneDisplay}</span>
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className={cn(pill, 'glass text-[var(--color-fg)] hover:bg-white/10')}
        >
          <WhatsappIcon className="size-4 text-[#25D366]" />
          {whatsappLabel}
        </a>
        {email && emailHref && (
          <a
            href={emailHref}
            className={cn(pill, 'glass text-[var(--color-fg)] hover:bg-white/10')}
          >
            <Mail className="size-4" />
            {emailLabel ?? email}
          </a>
        )}
      </div>
    </div>
  );
}
