'use client';

import { usePrefersReducedMotion } from '@/lib/hooks';

// Subtle cinematic color grade applied to the footage/poster.
const GRADE = 'brightness(1.08) contrast(1.05) saturate(1.18)';

// Cinematic ink-in-water hero background. Falls back to a static poster
// for users who prefer reduced motion.
export function HeroVideo() {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-poster.jpg)', filter: GRADE }}
      />
    );
  }

  return (
    <video
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover"
      style={{ filter: GRADE }}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/hero-poster.jpg"
    >
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  );
}
