import { CircleAlert, Lock, Unlock } from "lucide-react";

import { canPublishProduct, type ProductQualityStandard, type SellerQualityStandard } from "@/lib/catalog-standards";

type ProductPublishStatusProps = {
  className?: string;
  product: ProductQualityStandard;
  seller?: SellerQualityStandard | null;
};

export function ProductPublishStatus({ className = "", product, seller }: ProductPublishStatusProps) {
  const result = canPublishProduct(product, seller);
  const Icon = result.canPublish ? Unlock : Lock;

  return (
    <section className={`rounded-[8px] border ${result.canPublish ? "border-emerald-100 bg-emerald-50" : "border-rose-100 bg-rose-50"} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${result.canPublish ? "text-emerald-700" : "text-rose-800"}`} aria-hidden="true" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/52">Status de publicacao</p>
          <h3 className="mt-1 text-sm font-semibold text-black/84">
            {result.canPublish ? "SKU liberado para publicar" : "SKU bloqueado para publicação"}
          </h3>
          {result.blockingIssues.length > 0 ? (
            <div className="mt-3 space-y-2">
              {result.blockingIssues.map((issue) => (
                <p key={`${issue.code}-${issue.detail}`} className="flex gap-2 text-sm leading-relaxed text-rose-950">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {issue.detail}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
