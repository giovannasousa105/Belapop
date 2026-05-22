import { CheckCircle2, CircleAlert } from "lucide-react";

import type { ProductSkuStandard, StandardChecklistItem } from "@/lib/catalog-standards";

type ProductStandardsChecklistProps = {
  checks?: StandardChecklistItem[];
  className?: string;
  compact?: boolean;
  product?: ProductSkuStandard;
  title?: string;
};

const buildProductChecks = (product: ProductSkuStandard): StandardChecklistItem[] => {
  const missing = new Set(product.missingFields);
  return [
    {
      detail: product.normalizedName,
      label: "Naming padronizado",
      passed: Boolean(product.normalizedName) && !product.validationAlerts.some((alert) => alert.field === "name"),
      required: true
    },
    {
      detail: product.claims.join(", "),
      label: "Claims controlados",
      passed: !product.validationAlerts.some((alert) => alert.field === "claims" && alert.severity === "critical"),
      required: true
    },
    {
      detail: `${product.images.length} imagem(ns) cadastrada(s)`,
      label: "Imagem principal e apoio",
      passed: product.images.length > 0 && !product.validationAlerts.some((alert) => alert.field === "images" && alert.severity === "critical"),
      required: true
    },
    {
      detail: product.authenticity.origin,
      label: "Origem e NF",
      passed: product.authenticity.status === "verified",
      required: true
    },
    {
      detail: product.dispatchDeadline,
      label: "Prazo de envio",
      passed: !missing.has("política de envio"),
      required: true
    },
    {
      detail: product.seo.title,
      label: "SEO basico",
      passed: !missing.has("seo"),
      required: false
    },
    {
      detail: `Unboxing ${product.packaging.unboxingScore}/100`,
      label: "Embalagem premium",
      passed: product.packaging.unboxingScore >= 80,
      required: false
    }
  ];
};

export function ProductStandardsChecklist({
  checks,
  className = "",
  compact = false,
  product,
  title = "Checklist Padrao BelaPop"
}: ProductStandardsChecklistProps) {
  const resolvedChecks = checks ?? (product ? buildProductChecks(product) : []);

  return (
    <section className={`rounded-[8px] border border-black/10 bg-white p-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/52">Governanca de SKU</p>
          <h3 className="mt-1 text-sm font-semibold text-black/84">{title}</h3>
        </div>
        {product ? <span className="text-xs font-semibold text-black/60">{product.qualityScore}/100</span> : null}
      </div>

      <div className={`mt-4 ${compact ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}`}>
        {resolvedChecks.map((check) => {
          const Icon = check.passed ? CheckCircle2 : CircleAlert;
          return (
            <div
              key={check.label}
              className={`rounded-[8px] border px-3 py-3 ${
                check.passed ? "border-emerald-100 bg-emerald-50/60" : "border-amber-100 bg-amber-50/70"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${check.passed ? "text-emerald-700" : "text-amber-700"}`} aria-hidden="true" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/76">{check.label}</p>
              </div>
              {!compact && check.detail ? <p className="mt-2 text-xs leading-relaxed text-black/60">{check.detail}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
