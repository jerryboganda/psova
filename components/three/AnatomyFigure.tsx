'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CONDITIONS } from '@/data/conditions';
import { useQuality } from './SceneCanvas';

// Map a condition's normalised 2D hotspot to a 3D point on the figure's front.
function to3D(x: number, y: number): [number, number, number] {
  return [(x - 0.5) * 2.4, 2.2 - y * 4.6, 0.55];
}

function HotSpot({
  position,
  color,
  active,
  onSelect,
}: {
  position: [number, number, number];
  color: string;
  active: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const base = active ? 1.5 : hover ? 1.3 : 1;
    const pulse = base + Math.sin(t * 3 + position[1]) * 0.12;
    ref.current.scale.setScalar(pulse);
  });

  return (
    <group
      ref={ref}
      position={position}
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
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Body() {
  // Stylised holographic figure from primitives.
  const mat = (
    <meshBasicMaterial color="#8b3dff" transparent opacity={0.12} toneMapped={false} />
  );
  const wire = (
    <meshBasicMaterial color="#1fe0d4" wireframe transparent opacity={0.18} toneMapped={false} />
  );
  const parts: { geo: React.ReactNode; pos: [number, number, number] }[] = [
    { geo: <sphereGeometry args={[0.42, 24, 24]} />, pos: [0, 2.05, 0] }, // head
    { geo: <capsuleGeometry args={[0.55, 1.3, 8, 16]} />, pos: [0, 0.55, 0] }, // torso
    { geo: <capsuleGeometry args={[0.16, 1.1, 6, 12]} />, pos: [-0.78, 0.6, 0] }, // left arm
    { geo: <capsuleGeometry args={[0.16, 1.1, 6, 12]} />, pos: [0.78, 0.6, 0] }, // right arm
    { geo: <capsuleGeometry args={[0.22, 1.5, 6, 12]} />, pos: [-0.3, -1.55, 0] }, // left leg
    { geo: <capsuleGeometry args={[0.22, 1.5, 6, 12]} />, pos: [0.3, -1.55, 0] }, // right leg
  ];
  return (
    <group>
      {parts.map((p, i) => (
        <group key={i} position={p.pos}>
          <mesh>
            {p.geo}
            {mat}
          </mesh>
          <mesh>
            {p.geo}
            {wire}
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function AnatomyFigure({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  const tier = useQuality();
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const targetY = state.pointer.x * 0.5;
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      targetY,
      2.5,
      delta,
    );
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <group ref={group}>
        <Body />
        {CONDITIONS.map((c) => {
          const { x, y } = c.hotspot;
          return (
            <HotSpot
              key={c.slug}
              position={to3D(x, y)}
              color={c.accent}
              active={selected === c.slug}
              onSelect={() => onSelect(c.slug)}
            />
          );
        })}
      </group>
      {tier !== 'low' && (
        <EffectComposer>
          <Bloom intensity={0.9} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}
