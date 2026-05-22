import { ProductPublishStatus } from "@/components/catalog-standards/ProductPublishStatus";
import { ProductStandardsChecklist } from "@/components/catalog-standards/ProductStandardsChecklist";
import { SellerQualityScore } from "@/components/catalog-standards/SellerQualityScore";
import { SellerStandardsChecklist } from "@/components/catalog-standards/SellerStandardsChecklist";
import type { CatalogStandardDashboardMetric, ProductQualityStandard, SellerQualityStandard } from "@/lib/catalog-standards";

type AdminQualityDashboardProps = {
  metrics: CatalogStandardDashboardMetric[];
  products: ProductQualityStandard[];
  sellers: SellerQualityStandard[];
};

export function AdminQualityDashboard({ metrics, products, sellers }: AdminQualityDashboardProps) {
  const highlightedSeller = sellers[0];
  const highlightedProduct = products[0];

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.id} className="rounded-[8px] border border-black/10 bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/52">{metric.label}</p>
            <p className="mt-4 font-editorial text-4xl leading-none text-black">{metric.value}</p>
            <p className="mt-3 text-sm leading-relaxed text-black/64">{metric.detail}</p>
          </article>
        ))}
      </div>
      {highlightedSeller && highlightedProduct ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SellerQualityScore seller={highlightedSeller} />
          <ProductPublishStatus product={highlightedProduct} seller={highlightedSeller} />
          <SellerStandardsChecklist seller={highlightedSeller} />
          <ProductStandardsChecklist product={highlightedProduct} />
        </div>
      ) : null}
    </section>
  );
}
