type KpiTrend = "up" | "down" | "neutral";

const sparklinePath = (points: number[]) => {
  if (!points.length) return "";
  const width = 72;
  const height = 24;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point - min) / span) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};

export default function KpiCard({
  label,
  value,
  delta,
  hint,
  trend = "up",
  sparkline = []
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  trend?: KpiTrend;
  sparkline?: number[];
}) {
  const tone =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-rose-600"
        : "text-slate-500";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        {hint ? (
          <span
            title={hint}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[11px] text-slate-500"
          >
            i
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`text-xs ${tone}`}>{delta ?? "Sem variacao no periodo."}</p>
        {sparkline.length > 1 ? (
          <svg
            viewBox="0 0 72 24"
            className="h-6 w-[72px]"
            aria-label={`Tendencia de ${label}`}
            role="img"
          >
            <path
              d={sparklinePath(sparkline)}
              fill="none"
              stroke={trend === "down" ? "#ef4444" : "#0f172a"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
      </div>
    </article>
  );
}
