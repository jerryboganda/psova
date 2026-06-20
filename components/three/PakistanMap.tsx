'use client';

import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CARE_CENTERS } from '@/data/centers';
import { useQuality } from './SceneCanvas';

// Rough normalised outline of Pakistan (x: left→right, y: top→bottom).
const POLY: [number, number][] = [
  [0.55, 0.05], [0.7, 0.16], [0.82, 0.44], [0.78, 0.6], [0.62, 0.72],
  [0.5, 0.95], [0.3, 0.95], [0.2, 0.78], [0.13, 0.6], [0.2, 0.45],
  [0.32, 0.3], [0.42, 0.16],
];

const MAP_W = 5.2;
const MAP_H = 6.2;

function project(x: number, y: number, z = 0): [number, number, number] {
  return [(x - 0.5) * MAP_W, (0.5 - y) * MAP_H, z];
}

function pointInPoly(x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) {
    const [xi, yi] = POLY[i];
    const [xj, yj] = POLY[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const COUNTS = { high: 2600, mid: 1500, low: 600 } as const;

function CityNode({
  position,
  color,
  label,
  active,
  onSelect,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  useFrame((state) => {
    if (!ref.current) return;
    const base = active ? 1.6 : hover ? 1.35 : 1;
    ref.current.scale.setScalar(base + Math.sin(state.clock.elapsedTime * 2.5 + position[0]) * 0.12);
  });
  return (
    <group position={position}>
      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} toneMapped={false} />
        </mesh>
      </group>
      {(hover || active) && (
        <Html center distanceFactor={8} position={[0, 0.32, 0]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-[var(--color-base-900)]/90 px-2 py-0.5 text-[10px] font-medium text-white">
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}

export default function PakistanMap({
  selectedCity,
  onSelectCity,
  locale,
}: {
  selectedCity: string | null;
  onSelectCity: (city: string) => void;
  locale: string;
}) {
  const tier = useQuality();
  const group = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const progress = useRef(0);

  const { start, target, positions } = useMemo(() => {
    const count = COUNTS[tier as keyof typeof COUNTS] ?? COUNTS.mid;
    const start = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const positions = new Float32Array(count * 3);
    let i = 0;
    let guard = 0;
    while (i < count && guard < count * 40) {
      guard++;
      const rx = Math.random();
      const ry = Math.random();
      if (!pointInPoly(rx, ry)) continue;
      const [tx, ty] = project(rx, ry, (Math.random() - 0.5) * 0.4);
      target[i * 3] = tx;
      target[i * 3 + 1] = ty;
      target[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      start[i * 3] = (Math.random() - 0.5) * 14;
      start[i * 3 + 1] = (Math.random() - 0.5) * 14;
      start[i * 3 + 2] = (Math.random() - 0.5) * 6;
      positions[i * 3] = start[i * 3];
      positions[i * 3 + 1] = start[i * 3 + 1];
      positions[i * 3 + 2] = start[i * 3 + 2];
      i++;
    }
    return { start, target, positions };
  }, [tier]);

  useFrame((state, delta) => {
    // Morph particles from scattered → map shape on mount.
    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta * 0.5);
      const e = 1 - Math.pow(1 - progress.current, 3);
      for (let k = 0; k < positions.length; k++) {
        positions[k] = start[k] + (target[k] - start[k]) * e;
      }
      if (points.current) {
        (points.current.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      }
    }
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        state.pointer.x * 0.25,
        2,
        delta,
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -state.pointer.y * 0.12,
        2,
        delta,
      );
    }
  });

  return (
    <>
      <group ref={group}>
        <points ref={points}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
              count={positions.length / 3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.045}
            color="#3d6cff"
            transparent
            opacity={0.55}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>

        {CARE_CENTERS.map((c) => (
          <CityNode
            key={c.id}
            position={project(c.pos.x, c.pos.y, 0.3)}
            color={c.flagship ? '#1fe0d4' : '#ff2d9b'}
            label={locale === 'ur' ? c.city.ur : c.city.en}
            active={selectedCity === c.city.en}
            onSelect={() => onSelectCity(c.city.en)}
          />
        ))}
      </group>

      {tier !== 'low' && (
        <EffectComposer>
          <Bloom intensity={0.85} luminanceThreshold={0.2} luminanceSmoothing={0.5} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}
