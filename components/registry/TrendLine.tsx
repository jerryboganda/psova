// Inline SVG trend line (UI-SPEC §2). Suppressed points (<5) plot as 0 but the
// sr-only table reports "fewer than five". Stroke uses the brand gradient.

export type TrendPoint = { year: number; count: number | null };

export function TrendLine({
  title,
  points,
  suppressedSr,
}: {
  title: string;
  points: TrendPoint[];
  suppressedSr: string;
}) {
  const W = 640;
  const H = 180;
  const PAD = 28;
  const max = Math.max(1, ...points.map((p) => p.count ?? 0));
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const x = (i: number) =>
    points.length <= 1 ? W / 2 : PAD + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD + innerH - (v / max) * innerH;

  const coords = points.map((p, i) => ({ cx: x(i), cy: y(p.count ?? 0), year: p.year }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.cx.toFixed(1)} ${c.cy.toFixed(1)}`).join(' ');

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-hidden preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-magenta)" />
            <stop offset="50%" stopColor="var(--color-purple)" />
            <stop offset="100%" stopColor="var(--color-cyan)" />
          </linearGradient>
        </defs>
        {points.length > 1 && (
          <path d={path} fill="none" stroke="url(#brandGradient)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {coords.map((c) => (
          <g key={c.year}>
            <circle cx={c.cx} cy={c.cy} r={4} fill="var(--color-cyan)" />
            <text x={c.cx} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--color-faint)">
              {c.year}
            </text>
          </g>
        ))}
      </svg>

      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.year}>
              <th scope="row">{p.year}</th>
              <td>{p.count === null ? suppressedSr : p.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
