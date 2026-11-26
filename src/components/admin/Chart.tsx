/**
 * Single-series bar chart (one hue = one measure; no dual axis).
 * Each bar has a hover/focus tooltip; a visually-hidden table provides the data to screen readers.
 */
export function BarChart({
  data,
  format,
  label,
  height = 180,
}: {
  data: { key: string; label: string; value: number }[];
  format: (n: number) => string;
  label: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const ticks = [max, max / 2, 0];
  return (
    <figure>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-0 text-right text-[11px] tabular-nums text-ink-400" style={{ height }} aria-hidden>
          {ticks.map((t, i) => (
            <span key={i} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{format(Math.round(t))}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            {ticks.map((_, i) => (
              <div key={i} className={`border-t ${i === ticks.length - 1 ? "border-ink-400/50" : "border-dashed border-line"}`} />
            ))}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height }} aria-hidden>
            {data.map((d) => (
              <div key={d.key} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none" aria-label={`${d.label}: ${format(d.value)}`}>
                <div
                  className="w-full rounded-t-[4px] bg-brand-600 transition group-hover:bg-brand-800 group-focus:bg-brand-800"
                  style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs text-white shadow-pop group-hover:block group-focus:block">
                  <span className="block text-white/70">{d.label}</span>
                  <span className="font-semibold tabular-nums">{format(d.value)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-[2px] text-[10px] text-ink-400" aria-hidden>
            {data.map((d, i) => (
              <span key={d.key} className="flex-1 truncate text-center">{i % Math.ceil(data.length / 7) === 0 ? d.label : ""}</span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}><th scope="row">{d.label}</th><td>{format(d.value)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Horizontal bars for ranked lists (single hue). */
export function RankBars({ rows, format }: { rows: { label: string; value: number; sub?: string }[]; format: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">{format(r.value)}{r.sub && <span className="ml-1 font-normal text-ink-400">{r.sub}</span>}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-canvas">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
