import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'glass' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 ease-[var(--ease-out-expo)] focus-visible:outline-2 focus-visible:outline-[var(--color-cyan)] disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white shadow-[0_10px_40px_-12px_rgba(255,45,155,0.6)] hover:shadow-[0_14px_50px_-10px_rgba(139,61,255,0.75)] hover:-translate-y-0.5',
  glass:
    'glass text-[var(--color-fg)] hover:border-white/25 hover:-translate-y-0.5 hover:bg-white/10',
  ghost:
    'text-[var(--color-fg)] hover:text-white hover:bg-white/5',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonAsLink = CommonProps & {
  href: string;
  external?: boolean;
  onClick?: never;
  type?: never;
};

type ButtonAsButton = CommonProps & {
  href?: undefined;
  onClick?: () => void;
  type?: 'button' | 'submit';
};

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { children, variant = 'primary', size = 'md', className } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (props.href !== undefined) {
    if (props.external) {
      return (
        <a href={props.href} target="_blank" rel="noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={props.type ?? 'button'} onClick={props.onClick} className={classes}>
      {children}
    </button>
  );
}
