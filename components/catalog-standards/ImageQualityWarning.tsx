import { AlertTriangle, CheckCircle2 } from "lucide-react";

import type { ProductImageValidationResult } from "@/lib/catalog-standards";

type ImageQualityWarningProps = {
  className?: string;
  result: ProductImageValidationResult;
};

export function ImageQualityWarning({ className = "", result }: ImageQualityWarningProps) {
  const Icon = result.isValid ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`rounded-[8px] border ${result.isValid ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${result.isValid ? "text-emerald-700" : "text-amber-800"}`} aria-hidden="true" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/58">
            Qualidade de imagem: {result.score}/100
          </p>
          {result.alerts.length > 0 ? (
            <div className="mt-3 space-y-2">
              {result.alerts.map((alert) => (
                <p key={`${alert.code}-${alert.detail}`} className="text-sm leading-relaxed text-black/70">
                  {alert.detail}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-black/70">
              Imagens dentro do padrao minimo de vitrine premium.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
