"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { getProductDisplayImage } from "@/lib/product/productCovers";
import type {
  EditorialCurationAdminProduct,
  EditorialCurationAdminRow,
  EditorialCurationSurface
} from "@/lib/product/editorialOrder";
import { formatPrice } from "@/lib/utils";

type Props = {
  surface: EditorialCurationSurface;
  curated: EditorialCurationAdminRow[];
  available: EditorialCurationAdminProduct[];
};

const byId = (products: EditorialCurationAdminProduct[]) =>
  new Map(products.map((product) => [product.id, product]));

export default function EditorialCurationManager({ surface, curated, available }: Props) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [orderedIds, setOrderedIds] = useState(curated.map((row) => row.product.id));
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(available[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setOrderedIds(curated.map((row) => row.product.id));
    setSelectedProductId((current) => current || available[0]?.id || "");
  }, [available, curated]);

  const productMap = useMemo(() => byId([...curated.map((row) => row.product), ...available]), [available, curated]);
  const orderedProducts = useMemo(
    () => orderedIds.map((id) => productMap.get(id)).filter(Boolean) as EditorialCurationAdminProduct[],
    [orderedIds, productMap]
  );
  const availableProducts = useMemo(() => {
    const selected = new Set(orderedIds);
    const normalizedQuery = search.trim().toLowerCase();

    return available.filter((product) => {
      if (selected.has(product.id)) return false;
      if (!normalizedQuery) return true;

      const haystack = [product.title, product.category ?? "", product.brand ?? "", product.slug]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [available, orderedIds, search]);

  useEffect(() => {
    if (!availableProducts.length) {
      setSelectedProductId("");
      return;
    }
    if (!selectedProductId || !availableProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(availableProducts[0].id);
    }
  }, [availableProducts, selectedProductId]);

  const addProduct = () => {
    if (!selectedProductId) return;
    setOrderedIds((current) => (current.includes(selectedProductId) ? current : [...current, selectedProductId]));
    setMessage(null);
  };

  const removeProduct = (productId: string) => {
    setOrderedIds((current) => current.filter((id) => id !== productId));
    setMessage(null);
  };

  const moveProduct = (productId: string, direction: -1 | 1) => {
    setOrderedIds((current) => {
      const index = current.indexOf(productId);
      if (index < 0) return current;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setMessage(null);
  };

  const handleSave = () => {
    setMessage(null);
    startSaving(async () => {
      try {
        const response = await fetch("/api/admin/curadoria", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            surface,
            productIds: orderedIds
          })
        });

        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
          throw new Error(payload?.error ?? "Nao foi possivel salvar a curadoria.");
        }

        setMessage("Ordem editorial salva. Home e catalogo featured foram revalidados.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a curadoria.");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.28em] text-bpGraphite/60">
            Ordem compartilhada
          </p>
          <h2 className="mt-2 font-display text-3xl text-bpBlack">Home + Catalogo featured</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bpGraphite/80">
            Os 12 primeiros itens aparecem na vitrine “Curadoria da semana”. A mesma ordem guia o
            /catalogo?sort=featured sem novo deploy.
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.28em] text-bpGraphite/60">Resumo</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-bpGraphite/55">Curados</p>
              <p className="font-display text-3xl text-bpBlack">{orderedProducts.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-bpGraphite/55">Top home</p>
              <p className="font-display text-3xl text-bpBlack">{Math.min(12, orderedProducts.length)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bpBlack px-5 py-3 text-xs uppercase tracking-[0.24em] text-bpOffWhite transition hover:bg-bpBlackSoft disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={14} />
            {isSaving ? "Salvando..." : "Salvar ordem"}
          </button>
          {message ? <p className="mt-3 text-xs text-bpGraphite/75">{message}</p> : null}
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-bpGraphite/60">Adicionar produto</p>
            <h3 className="mt-2 font-display text-2xl text-bpBlack">Selecione itens publicados</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por titulo, categoria ou slug"
              className="rounded-2xl border border-black/10 bg-bpOffWhite px-4 py-3 text-sm text-bpBlack placeholder:text-bpGraphite/50 focus:border-bpPink/45 focus:outline-none"
            />
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack focus:border-bpPink/45 focus:outline-none"
            >
              {availableProducts.length === 0 ? (
                <option value="">Nenhum produto disponivel</option>
              ) : (
                availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={addProduct}
              disabled={!selectedProductId}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-bpPink/40 bg-bpPinkSoft/15 px-4 py-3 text-xs uppercase tracking-[0.24em] text-bpBlack transition hover:border-bpPink/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orderedProducts.map((product, index) => {
          const imageUrl = getProductDisplayImage({
            category: product.category,
            heroImageUrl: product.heroImageUrl,
            coverImage: product.images[0]
          });

          return (
            <div
              key={product.id}
              className="grid gap-4 rounded-3xl border border-black/10 bg-white p-4 shadow-sm md:grid-cols-[92px_1fr_auto]"
            >
              <div className="overflow-hidden rounded-2xl bg-bpOffWhite">
                <img src={imageUrl} alt={product.title} className="h-24 w-full object-cover" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.28em] text-bpGraphite/60">
                  Posicao {index + 1}
                </p>
                <h3 className="mt-2 font-display text-2xl leading-tight text-bpBlack">{product.title}</h3>
                <p className="mt-2 text-sm text-bpGraphite/75">
                  {product.category ?? "Curadoria"}{" "}
                  {product.brand ? `· ${product.brand}` : ""} · {formatPrice(product.priceCents / 100)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-bpGraphite/50">
                  /produto/{product.slug}
                </p>
              </div>

              <div className="flex flex-row gap-2 md:flex-col md:items-end">
                <button
                  type="button"
                  onClick={() => moveProduct(product.id, -1)}
                  disabled={index === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-bpGraphite transition hover:border-bpPink/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronUp size={14} />
                  Subir
                </button>
                <button
                  type="button"
                  onClick={() => moveProduct(product.id, 1)}
                  disabled={index === orderedProducts.length - 1}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-bpGraphite transition hover:border-bpPink/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronDown size={14} />
                  Descer
                </button>
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-bpPink/25 px-3 py-2 text-xs uppercase tracking-[0.2em] text-bpPink transition hover:border-bpPink/60"
                >
                  <Trash2 size={14} />
                  Remover
                </button>
              </div>
            </div>
          );
        })}

        {orderedProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-black/15 bg-white p-6 text-sm text-bpGraphite/75">
            Nenhum produto curado ainda. Adicione itens publicados para controlar a ordem da home e
            do catalogo.
          </div>
        ) : null}
      </div>
    </div>
  );
}
