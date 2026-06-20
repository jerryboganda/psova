'use client';

import { useEffect, useState } from 'react';
import { getGPUTier } from 'detect-gpu';

export type QualityTier = 'high' | 'mid' | 'low';

/**
 * Resolves a rendering quality tier from the device GPU + viewport.
 * Defaults to 'mid' until detection completes so the first paint is safe.
 */
export function useGpuTier(): { tier: QualityTier; ready: boolean } {
  const [tier, setTier] = useState<QualityTier>('mid');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    getGPUTier()
      .then((result) => {
        if (cancelled) return;
        // detect-gpu tier: 0 (unsupported) → 3 (high-end).
        let t: QualityTier = 'mid';
        if (result.tier >= 3 && !isMobile) t = 'high';
        else if (result.tier <= 1 || result.isMobile) t = 'low';
        else t = isMobile ? 'low' : 'mid';
        setTier(t);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setTier(isMobile ? 'low' : 'mid');
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { tier, ready };
}
