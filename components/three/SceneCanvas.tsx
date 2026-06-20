'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useGpuTier, type QualityTier } from '@/lib/useGpuTier';
import { cn } from '@/lib/utils';

export const QualityContext = createContext<QualityTier>('mid');
export const useQuality = () => useContext(QualityContext);

type SceneCanvasProps = {
  children: ReactNode;
  className?: string;
  /** Mount immediately (hero). Otherwise mounts when scrolled near. */
  eager?: boolean;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  /** Shown when WebGL is suppressed (reduced-motion / very low tier). */
  fallback?: ReactNode;
};

const DefaultFallback = () => (
  <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(139,61,255,0.35),transparent_70%)]" />
);

export function SceneCanvas({
  children,
  className,
  eager = false,
  cameraPosition = [0, 0, 6],
  cameraFov = 55,
  fallback,
}: SceneCanvasProps) {
  const reduced = usePrefersReducedMotion();
  const { tier, ready } = useGpuTier();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(eager);

  useEffect(() => {
    if (eager || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  // Suppress WebGL entirely for reduced-motion users — show the poster instead.
  const suppress = reduced;
  const dprMax = tier === 'high' ? 2 : tier === 'mid' ? 1.5 : 1;

  return (
    <div ref={ref} className={cn('absolute inset-0', className)}>
      {fallback ?? <DefaultFallback />}
      {!suppress && inView && ready && (
        <Canvas
          className="!absolute inset-0"
          dpr={[1, dprMax]}
          camera={{ position: cameraPosition, fov: cameraFov }}
          gl={{ antialias: tier !== 'low', alpha: true, powerPreference: 'high-performance' }}
          performance={{ min: 0.5 }}
        >
          <QualityContext.Provider value={tier}>{children}</QualityContext.Provider>
        </Canvas>
      )}
    </div>
  );
}
