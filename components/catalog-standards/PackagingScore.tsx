import type { PackagingStandard } from "@/lib/catalog-standards";

type PackagingScoreProps = {
  className?: string;
  packaging: PackagingStandard;
};

export function PackagingScore({ className = "", packaging }: PackagingScoreProps) {
  const score = packaging.unboxingScore;
  const tone = score >= 85 ? "bg-emerald-600" : score >= 70 ? "bg-amber-600" : "bg-rose-700";

  return (
    <div className={`rounded-[8px] border border-black/10 bg-white p-4 ${className}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/52">Score de embalagem</p>
          <p className="mt-1 text-sm text-black/64">Protecao, limpeza, lacre, NF e experiencia de unboxing.</p>
        </div>
        <p className="font-editorial text-4xl leading-none text-black">{score}</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/8">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
    </div>
  );
}
