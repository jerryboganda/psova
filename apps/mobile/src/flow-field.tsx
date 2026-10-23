import { useEffect, useRef } from 'react';

type Point = [number, number];
type Curve = [Point, Point, Point, Point];

// Vessel paths in fractions of the hero box; they sweep up-right behind the headline.
const VESSELS: Curve[] = [
  [[-0.15, 0.62], [0.2, 0.58], [0.38, 0.16], [1.15, 0.08]],
  [[-0.15, 0.74], [0.3, 0.7], [0.5, 0.34], [1.15, 0.3]],
  [[0.05, 0.98], [0.28, 0.5], [0.62, 0.5], [1.15, 0.5]],
  [[-0.15, 0.4], [0.14, 0.36], [0.36, 0.02], [0.72, -0.12]],
  [[0.38, 1], [0.55, 0.6], [0.78, 0.4], [1.15, 0.38]],
  [[-0.15, 0.86], [0.4, 0.82], [0.7, 0.66], [1.15, 0.7]],
];
// rose → violet → cyan, matching the logo gradient.
const STOPS: [number, number, number][] = [[255, 92, 138], [139, 108, 255], [62, 230, 216]];
const PARTICLES = 120;

type Particle = { vessel: number; t: number; speed: number; lane: number; size: number; px: number; py: number; dx: number; dy: number; fresh: boolean };
type Ripple = { x: number; y: number; age: number };

function bezier(curve: Curve, t: number, w: number, h: number): [number, number, number, number] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = curve; const u = 1 - t;
  const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
  const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
  const tx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2);
  const ty = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2);
  const len = Math.hypot(tx * w, ty * h) || 1;
  return [x * w, y * h, (-ty * h) / len, (tx * w) / len];
}

function colorAt(t: number, alpha: number) {
  const scaled = Math.min(Math.max(t, 0), 1) * (STOPS.length - 1); const index = Math.min(Math.floor(scaled), STOPS.length - 2); const f = scaled - index;
  const [a, b] = [STOPS[index], STOPS[index + 1]];
  return `rgba(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)},${alpha})`;
}

/** Two-beat cardiac pulse (lub-dub) around 70 bpm, 0..1. */
function heartbeat(seconds: number) {
  const phase = (seconds % 0.86) / 0.86;
  return Math.exp(-((phase - 0.08) ** 2) / 0.0016) + 0.55 * Math.exp(-((phase - 0.26) ** 2) / 0.0022);
}

function spawn(fresh: boolean): Particle {
  return { vessel: Math.floor(Math.random() * VESSELS.length), t: fresh ? Math.random() : 0, speed: 0.035 + Math.random() * 0.05, lane: (Math.random() - 0.5) * 10, size: 0.8 + Math.random() * 1.8, px: 0, py: 0, dx: 0, dy: 0, fresh: true };
}

/** Canvas of blood cells streaming through vessels on a heartbeat; cells part around a touch and ripple on tap. */
export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; const host = canvas?.parentElement; const surface = host?.closest('section') ?? host;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !surface || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particles = Array.from({ length: PARTICLES }, () => spawn(true));
    const ripples: Ripple[] = [];
    const pointer = { x: -999, y: -999, strength: 0 };
    const vessels = document.createElement('canvas'); const vctx = vessels.getContext('2d')!;
    let w = 0, h = 0, dpr = 1, frame = 0, last = performance.now(), visible = true, light = false;

    const paintVessels = () => {
      vctx.setTransform(dpr, 0, 0, dpr, 0, 0); vctx.clearRect(0, 0, w, h); vctx.lineCap = 'round';
      for (const curve of VESSELS) {
        const [[x0, y0], c1, c2, [x3, y3]] = curve;
        for (const [width, alpha] of [[14, light ? 0.05 : 0.045], [1.2, light ? 0.28 : 0.32]] as const) {
          const gradient = vctx.createLinearGradient(x0 * w, y0 * h, x3 * w, y3 * h);
          STOPS.forEach((_, i) => gradient.addColorStop(i / (STOPS.length - 1), colorAt(i / (STOPS.length - 1), alpha)));
          vctx.strokeStyle = gradient; vctx.lineWidth = width; vctx.beginPath(); vctx.moveTo(x0 * w, y0 * h);
          vctx.bezierCurveTo(c1[0] * w, c1[1] * h, c2[0] * w, c2[1] * h, x3 * w, y3 * h); vctx.stroke();
        }
      }
    };
    const resize = () => {
      const rect = host.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height; light = getComputedStyle(document.documentElement).colorScheme === 'light';
      for (const c of [canvas, vessels]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      paintVessels(); particles.forEach((p) => { p.fresh = true; });
    };

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const beat = reduce ? 0.3 : heartbeat(now / 1000);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.drawImage(vessels, 0, 0, w, h);
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter'; ctx.lineCap = 'round';
      pointer.strength += ((pointer.x > -999 ? 1 : 0) - pointer.strength) * 0.08;
      for (const p of particles) {
        p.t += p.speed * (0.45 + 1.6 * beat) * dt;
        if (p.t > 1) Object.assign(p, spawn(false));
        const [bx, by, nx, ny] = bezier(VESSELS[p.vessel], p.t, w, h);
        let tx = 0, ty = 0;
        const ox = bx - pointer.x, oy = by - pointer.y, dist = Math.hypot(ox, oy), radius = 90;
        if (dist < radius && pointer.strength > 0.01) { const push = (1 - dist / radius) ** 2 * 34 * pointer.strength; tx = (ox / (dist || 1)) * push; ty = (oy / (dist || 1)) * push; }
        p.dx += (tx - p.dx) * 0.12; p.dy += (ty - p.dy) * 0.12;
        const x = bx + nx * p.lane + p.dx, y = by + ny * p.lane + p.dy;
        if (p.fresh) { p.px = x; p.py = y; p.fresh = false; }
        const fade = Math.min(p.t * 8, 1, (1 - p.t) * 8);
        ctx.strokeStyle = colorAt(p.t, (light ? 0.22 : 0.16) * fade); ctx.lineWidth = p.size * 4;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(x, y); ctx.stroke();
        ctx.strokeStyle = colorAt(p.t, (light ? 0.75 : 0.9) * fade); ctx.lineWidth = p.size;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(x + 0.01, y); ctx.stroke();
        p.px = x; p.py = y;
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]; r.age += dt; const k = r.age / 0.9;
        if (k >= 1) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(${light ? '11,143,132' : '62,230,216'},${0.5 * (1 - k)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(r.x, r.y, 8 + k * 70, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      if (!reduce && visible) frame = requestAnimationFrame(draw);
    };
    const start = () => { cancelAnimationFrame(frame); last = performance.now(); frame = requestAnimationFrame(draw); };

    const local = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); return [event.clientX - rect.left, event.clientY - rect.top] as const; };
    const move = (event: PointerEvent) => { [pointer.x, pointer.y] = local(event); };
    const down = (event: PointerEvent) => { move(event); ripples.push({ x: pointer.x, y: pointer.y, age: 0 }); if (reduce) start(); };
    const leave = () => { pointer.x = -999; pointer.y = -999; };
    const up = (event: PointerEvent) => { if (event.pointerType !== 'mouse') leave(); };
    surface.addEventListener('pointermove', move, { passive: true }); surface.addEventListener('pointerdown', down, { passive: true });
    surface.addEventListener('pointerleave', leave); surface.addEventListener('pointercancel', leave); surface.addEventListener('pointerup', up);

    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
    const themeObserver = new MutationObserver(resize); themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const viewObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && !document.hidden; if (visible) start(); else cancelAnimationFrame(frame); });
    viewObserver.observe(host);
    const onVisibility = () => { visible = !document.hidden; if (visible) start(); else cancelAnimationFrame(frame); };
    document.addEventListener('visibilitychange', onVisibility);
    resize(); start();
    return () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); themeObserver.disconnect(); viewObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      surface.removeEventListener('pointermove', move); surface.removeEventListener('pointerdown', down); surface.removeEventListener('pointerleave', leave); surface.removeEventListener('pointercancel', leave); surface.removeEventListener('pointerup', up);
    };
  }, []);
  return <canvas ref={canvasRef} className="flow-field" aria-hidden="true" />;
}
