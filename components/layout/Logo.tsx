import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/** PSOVA wordmark with an animated vascular "pulse" mark. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="PSOVA home"
      className={cn('group flex items-center gap-2.5', className)}
    >
      <span className="relative grid size-9 place-items-center">
        <svg viewBox="0 0 40 40" className="size-9" fill="none" aria-hidden>
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
              <stop stopColor="#ff2d9b" />
              <stop offset="0.5" stopColor="#8b3dff" />
              <stop offset="1" stopColor="#1fe0d4" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" stroke="url(#logoGrad)" strokeWidth="2" opacity="0.4" />
          {/* Vessel / heartbeat path */}
          <path
            d="M5 22 H13 L16 13 L21 28 L24 20 H35"
            stroke="url(#logoGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute inset-0 -z-10 rounded-full bg-[var(--color-purple)] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-50" />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-[var(--color-fg)]">
        PSOVA
      </span>
    </Link>
  );
}
