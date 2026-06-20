import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';
import { Eyebrow, GradientText } from './GradientText';

export function Section({
  children,
  className,
  id,
  containerClassName,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  containerClassName?: string;
}) {
  return (
    <section id={id} className={cn('relative px-5 py-16 sm:px-6 md:py-20 lg:px-8', className)}>
      <div className={cn('mx-auto w-full max-w-7xl', containerClassName)}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  lead,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  lead?: string;
  align?: 'center' | 'start';
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        'flex max-w-3xl flex-col gap-5',
        align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-start',
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-balance text-4xl font-bold md:text-6xl">
        {title} {highlight && <GradientText>{highlight}</GradientText>}
      </h2>
      {lead && (
        <p className="text-pretty text-lg leading-relaxed text-[var(--color-muted)] md:text-xl">
          {lead}
        </p>
      )}
    </Reveal>
  );
}
