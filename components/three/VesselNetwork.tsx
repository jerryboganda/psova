'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useQuality } from './SceneCanvas';

const PALETTE = ['#ff2d9b', '#8b3dff', '#3d6cff', '#1fe0d4', '#ff5d7e'];
const TAU = Math.PI * 2;

type Cfg = { trunks: number; particles: number; samples: number };
const COUNTS: Record<string, Cfg> = {
  high: { trunks: 12, particles: 1300, samples: 220 },
  mid: { trunks: 8, particles: 800, samples: 160 },
  low: { trunks: 5, particles: 280, samples: 110 },
};

// Deterministic PRNG so the network is stable between renders.
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// Elliptical weighting for the central "safe zone" (wide horizontally for the headline).
const FX = 0.5;
const FY = 0.85;
const F_INNER = 2.0;
const F_OUTER = 4.8;

type Vessel = { curve: THREE.CatmullRomCurve3; color: THREE.Color; radius: number; dim: number };

// Build a coherent, peripheral, branching vascular network — roots distributed around a
// ring so vessels arc around the edges and leave the centre (headline area) clear.
function buildNetwork(cfg: Cfg): Vessel[] {
  const r = makeRng(7.77);
  const out: Vessel[] = [];
  const zLayers = [-5.5, -4, -2.6, -1.2, 0.4, 1.6];

  for (let k = 0; k < cfg.trunks; k++) {
    const angle = (k / cfg.trunks) * TAU + (r() - 0.5) * 0.5;
    const baseR = 4.8 + r() * 2.6;
    const z = zLayers[k % zLayers.length] + (r() - 0.5);
    const root = new THREE.Vector3(
      Math.cos(angle) * baseR,
      Math.sin(angle) * baseR * 0.72,
      z,
    );
    const tangent = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
    const outward = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const sign = r() > 0.5 ? 1 : -1;
    const segs = 5 + Math.floor(r() * 3);

    const pts: THREE.Vector3[] = [root.clone()];
    let cur = root.clone();
    for (let i = 0; i < segs; i++) {
      const step = tangent
        .clone()
        .multiplyScalar(sign * (1.3 + r() * 1.0))
        .add(outward.clone().multiplyScalar((r() - 0.3) * 0.8))
        .add(new THREE.Vector3((r() - 0.5) * 0.8, (r() - 0.5) * 0.8, (r() - 0.5) * 0.9));
      cur = cur.clone().add(step);
      pts.push(cur.clone());
    }

    const color = new THREE.Color(PALETTE[k % PALETTE.length]);
    const dim = z < -2 ? 0.62 : 1;
    const radius = 0.02 + r() * 0.016;
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    out.push({ curve, color, radius, dim });

    // Optional child branch off the trunk for an organic, arterial look.
    if (r() > 0.35) {
      const t0 = 0.45 + r() * 0.3;
      const bRoot = curve.getPoint(t0);
      const bdir = tangent
        .clone()
        .multiplyScalar(-sign)
        .add(new THREE.Vector3(r() - 0.5, r() - 0.5, (r() - 0.5) * 0.6))
        .normalize();
      const bpts: THREE.Vector3[] = [bRoot.clone()];
      let bc = bRoot.clone();
      const bsegs = 3 + Math.floor(r() * 2);
      for (let j = 0; j < bsegs; j++) {
        bc = bc
          .clone()
          .add(bdir.clone().multiplyScalar(1 + r() * 0.8))
          .add(new THREE.Vector3((r() - 0.5) * 0.6, (r() - 0.5) * 0.6, (r() - 0.5) * 0.5));
        bpts.push(bc.clone());
      }
      out.push({
        curve: new THREE.CatmullRomCurve3(bpts, false, 'catmullrom', 0.5),
        color: color.clone(),
        radius: radius * 0.6,
        dim: dim * 0.85,
      });
    }
  }
  return out;
}

const VERT = /* glsl */ `
  attribute vec3 color;
  varying vec3 vColor;
  varying float vFade;
  varying float vU;
  uniform float uInner;
  uniform float uOuter;
  void main() {
    vColor = color;
    vec2 p = vec2(position.x * ${FX.toFixed(2)}, position.y * ${FY.toFixed(2)});
    vFade = smoothstep(uInner, uOuter, length(p));
    vU = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vFade;
  varying float vU;
  uniform float uTime;
  uniform float uOpacity;
  void main() {
    // Flowing brightness pulse along the vessel length.
    float flow = 0.55 + 0.45 * sin(vU * 16.0 - uTime * 1.6);
    float a = uOpacity * vFade * (0.35 + 0.65 * flow);
    gl_FragColor = vec4(vColor * (0.85 + 0.5 * flow), a);
  }
`;

export default function VesselNetwork() {
  const tier = useQuality();
  const cfg = COUNTS[tier] ?? COUNTS.mid;
  const group = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  const network = useMemo(() => buildNetwork(cfg), [cfg]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uInner: { value: F_INNER },
          uOuter: { value: F_OUTER },
          uOpacity: { value: 0.55 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const geometries = useMemo(
    () =>
      network.map((v) => {
        const g = new THREE.TubeGeometry(v.curve, 60, v.radius, 6, false);
        const n = g.attributes.position.count;
        const col = new Float32Array(n * 3);
        const c = v.color.clone().multiplyScalar(v.dim);
        for (let i = 0; i < n; i++) {
          col[i * 3] = c.r;
          col[i * 3 + 1] = c.g;
          col[i * 3 + 2] = c.b;
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        return g;
      }),
    [network],
  );

  const sampled = useMemo(
    () => network.map((v) => v.curve.getSpacedPoints(cfg.samples)),
    [network, cfg.samples],
  );

  const particles = useMemo(() => {
    const count = cfg.particles;
    const positions = new Float32Array(count * 3);
    const colorsArr = new Float32Array(count * 3);
    const baseColors = new Float32Array(count * 3);
    const curveIdx = new Int16Array(count);
    const t = new Float32Array(count);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const ci = i % network.length;
      curveIdx[i] = ci;
      t[i] = Math.random();
      speed[i] = 0.03 + Math.random() * 0.1;
      const c = network[ci].color;
      baseColors[i * 3] = c.r;
      baseColors[i * 3 + 1] = c.g;
      baseColors[i * 3 + 2] = c.b;
      colorsArr[i * 3] = c.r;
      colorsArr[i * 3 + 1] = c.g;
      colorsArr[i * 3 + 2] = c.b;
    }
    return { count, positions, colorsArr, baseColors, curveIdx, t, speed };
  }, [cfg.particles, network]);

  // Soft round sprite for particles.
  const sprite = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Dispose GPU resources on unmount.
  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
      sprite.dispose();
    };
  }, [geometries, material, sprite]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const now = state.clock.elapsedTime;
    material.uniforms.uTime.value = now;

    const { count, positions, colorsArr, baseColors, curveIdx, t, speed } = particles;
    for (let i = 0; i < count; i++) {
      t[i] += speed[i] * dt;
      if (t[i] >= 1) t[i] -= 1;
      const pts = sampled[curveIdx[i]];
      const f = t[i] * (pts.length - 1);
      const i0 = Math.floor(f);
      const i1 = Math.min(i0 + 1, pts.length - 1);
      const a = f - i0;
      const p0 = pts[i0];
      const p1 = pts[i1];
      const x = p0.x + (p1.x - p0.x) * a;
      const y = p0.y + (p1.y - p0.y) * a;
      const z = p0.z + (p1.z - p0.z) * a;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      // Same elliptical centre-fade as the tubes (additive → dim the colour).
      const fade = smoothstep(F_INNER, F_OUTER, Math.hypot(x * FX, y * FY));
      colorsArr[i * 3] = baseColors[i * 3] * fade;
      colorsArr[i * 3 + 1] = baseColors[i * 3 + 1] * fade;
      colorsArr[i * 3 + 2] = baseColors[i * 3 + 2] * fade;
    }
    if (points.current) {
      points.current.geometry.attributes.position.needsUpdate = true;
      points.current.geometry.attributes.color.needsUpdate = true;
    }

    // Calm, organic drift + subtle mouse parallax (no constant spin).
    if (group.current) {
      group.current.rotation.y = Math.sin(now * 0.08) * 0.12 + state.pointer.x * 0.06;
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -state.pointer.y * 0.05,
        2.5,
        dt,
      );
      group.current.position.x = THREE.MathUtils.damp(
        group.current.position.x,
        state.pointer.x * 0.25,
        2.5,
        dt,
      );
    }
  });

  const bloom =
    tier === 'high'
      ? { intensity: 0.7, threshold: 0.5 }
      : { intensity: 0.5, threshold: 0.55 };

  return (
    <>
      <fog attach="fog" args={['#0a0520', 9, 22]} />
      <group ref={group} scale={viewport.width < 6 ? 0.82 : 1}>
        {geometries.map((g, i) => (
          <mesh key={i} geometry={g} material={material} />
        ))}

        <points ref={points}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particles.positions, 3]}
              count={particles.count}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[particles.colorsArr, 3]}
              count={particles.count}
            />
          </bufferGeometry>
          <pointsMaterial
            size={tier === 'high' ? 0.13 : 0.1}
            map={sprite}
            vertexColors
            transparent
            depthWrite={false}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      </group>

      {tier !== 'low' && (
        <EffectComposer>
          <Bloom
            intensity={bloom.intensity}
            luminanceThreshold={bloom.threshold}
            luminanceSmoothing={0.5}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}
