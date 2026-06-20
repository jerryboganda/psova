import type { ReactNode } from 'react';
import { Reveal } from './Reveal';
import { Eyebrow, GradientText } from './GradientText';

/** Standard inner-page hero: ambient gradient backdrop + title block. */
export function PageHeader({
  eyebrow,
  title,
  highlight,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden px-5 pb-8 pt-32 sm:px-6 md:pt-40 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 animate-gradient bg-[radial-gradient(60%_60%_at_20%_0%,rgba(255,45,155,0.2),transparent_60%),radial-gradient(50%_50%_at_85%_10%,rgba(61,108,255,0.22),transparent_60%)]"
      />
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="text-balance text-4xl font-bold md:text-6xl lg:text-7xl">
            {title} {highlight && <GradientText>{highlight}</GradientText>}
          </h1>
        </Reveal>
        {lead && (
          <Reveal delay={0.16}>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-muted)] md:text-xl">
              {lead}
            </p>
          </Reveal>
        )}
        {children && (
          <Reveal delay={0.24}>
            <div className="mt-2">{children}</div>
          </Reveal>
        )}
      </div>
    </header>
  );
}
