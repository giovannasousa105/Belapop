import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionFrame } from "@/components/SectionFrame";
import { fetchProducts, AdminProductRow } from "@/lib/admin/data";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

const productStatusLabel = (status: string) => {
  switch (status) {
    case "published":
      return "Publicado";
    case "review":
      return "Em curadoria";
    case "paused":
      return "Pausado";
    default:
      return "Rascunho";
  }
};

export default async function AdminProductsPage() {
  const products = await fetchProducts();

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Produtos</p>
          <h1 className="font-display text-3xl text-noir-950">Curadoria BelaPop</h1>
          <p className="text-sm text-noir-600">
            Selecionar quais produtos aparecem para clientes com aprovação manual.
          </p>
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#F6D6E2] p-4"
            >
              <div>
                <p className="text-sm font-semibold text-noir-900">{product.name}</p>
                <p className="text-xs text-noir-500">{formatPrice(product.price_cents)}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <StatusBadge status={productStatusLabel(product.status)} />
                  <StatusBadge status={product.curated ? "Curado" : "Sem curadoria"} />
                </div>
              </div>
              <div className="flex gap-2">
                <LuxuryButton variant="secondary" href={`/admin/products/${product.id}`}>
                  Detalhes
                </LuxuryButton>
                <LuxuryButton variant="primary" href={`/admin/products/${product.id}`}>
                  Aprovar
                </LuxuryButton>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-noir-600">Não há produtos para analisar.</p>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}
