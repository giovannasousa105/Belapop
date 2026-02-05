import PendingProductList from "@/components/admin/PendingProductList";
import { fetchPendingProducts } from "@/lib/admin/productService";

export default async function PendingProductsPage() {
  const products = await fetchPendingProducts();
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Curadoria BelaPop</p>
        <h1 className="font-display text-4xl text-noir-950">Produtos aguardando revisão</h1>
        <p className="text-sm text-noir-600 max-w-2xl">
          Aprovando e ajustando produtos com linguagem editorial garante uma vitrine coesa e elegante.
        </p>
      </header>
      <PendingProductList products={products} />
    </div>
  );
}
