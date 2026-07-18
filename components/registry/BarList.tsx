// Horizontal CSS bar chart (UI-SPEC §2). No chart library. Accessible via an
// sr-only data table; suppressed cells read "fewer than five".

export type BarItem = { label: string; count: number | null };

export function BarList({
  title,
  items,
  suppressedLabel,
  suppressedSr,
}: {
  title: string;
  items: BarItem[];
  suppressedLabel: string;
  suppressedSr: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count ?? 0));

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold">{title}</h3>

      <div className="flex flex-col gap-3" aria-hidden>
        {items.map((i) => {
          const width = i.count === null ? 6 : Math.max(4, Math.round((i.count / max) * 100));
          return (
            <div key={i.label}>
              <div className="mb-1 flex items-baseline justify-between gap-4 text-sm">
                <span className="text-[var(--color-fg)]">{i.label}</span>
                <span className="font-medium text-[var(--color-muted)]">
                  {i.count === null ? suppressedLabel : i.count}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${width}%`, opacity: i.count === null ? 0.4 : 1 }}
                />
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-[var(--color-faint)]">—</p>}
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {items.map((i) => (
            <tr key={i.label}>
              <th scope="row">{i.label}</th>
              <td>{i.count === null ? suppressedSr : i.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
