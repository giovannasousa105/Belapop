import { PackageCheck } from "lucide-react";

import { PackagingScore } from "@/components/catalog-standards/PackagingScore";
import type { PackagingStandard } from "@/lib/catalog-standards";

type PackagingStandardCardProps = {
  className?: string;
  compact?: boolean;
  packaging: PackagingStandard;
};

export function PackagingStandardCard({ className = "", compact = false, packaging }: PackagingStandardCardProps) {
  return (
    <section className={`rounded-[8px] border border-black/10 bg-white p-4 ${className}`} aria-label="Padrao de embalagem">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-[#f7f1ea]">
          <PackageCheck className="h-4 w-4 text-black/75" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/52">Embalagem</p>
          <h3 className="mt-1 text-sm font-semibold text-black/82">
            Produto protegido e nota fiscal garantida
          </h3>
          {!compact ? (
            <p className="mt-2 text-sm leading-relaxed text-black/64">
              Embalagem limpa, protecao contra avarias e apresentacao alinhada ao padrao minimo BelaPop.
            </p>
          ) : null}
        </div>
      </div>
      {!compact ? <PackagingScore className="mt-4" packaging={packaging} /> : null}
    </section>
  );
}
