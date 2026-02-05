"use client";

import { useMemo, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { productRepository } from "@/lib/repositories/productRepository";
import { formatPrice } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "review", label: "Aguardando curadoria" },
  { value: "draft", label: "Rascunhos" },
  { value: "paused", label: "Pausados" }
] as const;

const statusLabel = (status: string) => {
  switch (status) {
    case "published":
      return "Publicado";
    case "review":
      return "Aguardando curadoria";
    case "paused":
      return "Pausado";
    default:
      return "Rascunho";
  }
};

export default function SellerProductsPage() {
  const { user } = useAuth();
  const { products, refresh } = useStoredProducts();
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]["value"]>("all");

  const sellerProducts = products.filter(
    (product) => product.sellerId === user?.sellerProfile?.sellerId
  );

  const filteredProducts = useMemo(() => {
    if (statusFilter === "all") return sellerProducts;
    return sellerProducts.filter((product) => product.status === statusFilter);
  }, [sellerProducts, statusFilter]);

  const handleDelete = async (id: string) => {
    await productRepository.remove(id);
    refresh();
  };

  const handlePublish = async (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    await productRepository.upsert({ ...product, status: "review" });
    refresh();
  };

  const handlePause = async (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    await productRepository.upsert({ ...product, status: "paused" });
    refresh();
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
            Produtos da loja
          </p>
          <h1 className="mt-2 font-display text-3xl text-noir-950">
            Catálogo institucional
          </h1>
        </div>
        <LuxuryButton tone="retail" href="/seller/products/new">
          Adicionar novo produto
        </LuxuryButton>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
          Filtros
        </p>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
              statusFilter === option.value
                ? "border-luxe-600/60 text-noir-900"
                : "border-black/10 text-noir-500 hover:border-luxe-600/40 hover:text-noir-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm text-noir-600">
            Nenhum produto encontrado para o filtro selecionado.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                  {product.category} • {statusLabel(product.status)}
                </p>
                <h3 className="mt-2 font-display text-xl text-noir-950">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm text-noir-600">
                  {formatPrice(product.price)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LuxuryButton
                  tone="retail"
                  variant="outline"
                  size="sm"
                  href={`/seller/products/${product.id}/edit`}
                >
                  Editar
                </LuxuryButton>
                {product.status === "draft" || product.status === "paused" ? (
                  <LuxuryButton tone="retail" size="sm" onClick={() => handlePublish(product.id)}>
                    Enviar para curadoria
                  </LuxuryButton>
                ) : product.status === "review" ? (
                  <span className="rounded-full border border-black/10 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-noir-500">
                    Em curadoria
                  </span>
                ) : (
                  <LuxuryButton
                    tone="retail"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePause(product.id)}
                  >
                    Pausar
                  </LuxuryButton>
                )}
                <button
                  onClick={() => handleDelete(product.id)}
                  className="text-xs uppercase tracking-[0.3em] text-noir-500 hover:text-noir-900"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
