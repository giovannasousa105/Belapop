import type { ProductQualityScoreBreakdown } from "@/lib/catalog-standards";

type ProductQualityScoreProps = {
  breakdown?: Partial<ProductQualityScoreBreakdown>;
  className?: string;
  compact?: boolean;
  label?: string;
  score: number;
};

const resolveTone = (score: number) => {
  if (score >= 90) return "bg-emerald-600";
  if (score >= 75) return "bg-stone-800";
  if (score >= 60) return "bg-amber-600";
  return "bg-rose-700";
};

export function ProductQualityScore({
  breakdown,
  className = "",
  compact = false,
  label = "Score de qualidade",
  score
}: ProductQualityScoreProps) {
  const entries = Object.entries(breakdown ?? {}).slice(0, compact ? 3 : 7);

  return (
    <section className={`rounded-[8px] border border-black/10 bg-white p-4 ${className}`} aria-label={label}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/52">{label}</p>
          <p className="mt-1 text-sm text-black/64">Naming, imagem, claims, logistica e autenticidade.</p>
        </div>
        <p className="font-editorial text-4xl leading-none text-black">{score}</p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/8">
        <div className={`h-full rounded-full ${resolveTone(score)}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>

      {entries.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-2 text-xs text-black/64">
              <span className="capitalize">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
              <span className="font-semibold text-black/80">{value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
