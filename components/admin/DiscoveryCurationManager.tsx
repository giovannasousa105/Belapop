"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getDiscoveryCollectionKindMeta,
  type DiscoveryCollectionAdminProduct,
  type DiscoveryCollectionAdminRow,
  type DiscoveryCollectionKind,
  type DiscoveryCollectionKindMeta
} from "@/lib/admin/discoveryCuration.shared";
import { getProductDisplayImage } from "@/lib/product/productCovers";
import { formatPrice } from "@/lib/utils";

type Props = {
  kinds: DiscoveryCollectionKindMeta[];
  collections: DiscoveryCollectionAdminRow[];
  availableProducts: DiscoveryCollectionAdminProduct[];
};

type SaveMode = "collections" | "products" | "details" | null;

type CollectionDraft = DiscoveryCollectionAdminRow;

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((item) => [item.id, item]));

const COVER_FALLBACK = "/editorial/presenca-diurna.svg";

function toDraft(collection: DiscoveryCollectionAdminRow): CollectionDraft {
  return {
    ...collection,
    products: collection.products.map((item) => ({ ...item, product: { ...item.product } }))
  };
}

export default function DiscoveryCurationManager({ kinds, collections, availableProducts }: Props) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [saveMode, setSaveMode] = useState<SaveMode>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeKind, setActiveKind] = useState<DiscoveryCollectionKind>(kinds[0]?.key ?? "curation");
  const [collectionsState, setCollectionsState] = useState<CollectionDraft[]>(collections.map(toDraft));
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    setCollectionsState(collections.map(toDraft));
  }, [collections]);

  const collectionsByKind = useMemo(() => {
    const map = new Map<DiscoveryCollectionKind, CollectionDraft[]>();
    for (const kind of kinds.map((item) => item.key)) {
      map.set(kind, []);
    }
    for (const collection of collectionsState) {
      const list = map.get(collection.kind) ?? [];
      list.push(collection);
      map.set(collection.kind, list);
    }
    for (const [kind, list] of map.entries()) {
      const key = getDiscoveryCollectionKindMeta(kind).key;
      map.set(
        key,
        [...list].sort((left, right) => {
          const boostLeft = kind === "trend" ? left.trendBoost : left.editorialBoost;
          const boostRight = kind === "trend" ? right.trendBoost : right.editorialBoost;
          return boostRight - boostLeft || String(right.publishedAt ?? "").localeCompare(String(left.publishedAt ?? ""));
        })
      );
    }
    return map;
  }, [collectionsState, kinds]);

  const visibleCollections = useMemo(() => collectionsByKind.get(activeKind) ?? [], [collectionsByKind, activeKind]);

  useEffect(() => {
    if (!visibleCollections.length) {
      setSelectedCollectionId(null);
      return;
    }
    if (!selectedCollectionId || !visibleCollections.some((item) => item.id === selectedCollectionId)) {
      setSelectedCollectionId(visibleCollections[0].id);
    }
  }, [selectedCollectionId, visibleCollections]);

  const selectedCollection = useMemo(
    () => collectionsState.find((item) => item.id === selectedCollectionId) ?? null,
    [collectionsState, selectedCollectionId]
  );

  const productMap = useMemo(() => byId(availableProducts), [availableProducts]);
  const selectedProductIds = useMemo(
    () => new Set(selectedCollection?.products.map((item) => item.productId) ?? []),
    [selectedCollection]
  );

  const availableForSelectedCollection = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableProducts.filter((product) => {
      if (selectedProductIds.has(product.id)) return false;
      if (!query) return true;
      const haystack = [product.title, product.brand ?? "", product.category ?? "", product.slug]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [availableProducts, search, selectedProductIds]);

  useEffect(() => {
    if (!availableForSelectedCollection.length) {
      setSelectedProductId("");
      return;
    }
    if (!selectedProductId || !availableForSelectedCollection.some((item) => item.id === selectedProductId)) {
      setSelectedProductId(availableForSelectedCollection[0].id);
    }
  }, [availableForSelectedCollection, selectedProductId]);

  const updateCollection = (collectionId: string, updater: (current: CollectionDraft) => CollectionDraft) => {
    setCollectionsState((current) => current.map((item) => (item.id === collectionId ? updater(item) : item)));
    setMessage(null);
  };

  const moveCollection = (collectionId: string, direction: -1 | 1) => {
    const currentKind = activeKind;
    const kindCollections = [...(collectionsByKind.get(currentKind) ?? [])];
    const index = kindCollections.findIndex((item) => item.id === collectionId);
    if (index < 0) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= kindCollections.length) return;
    [kindCollections[index], kindCollections[targetIndex]] = [kindCollections[targetIndex], kindCollections[index]];

    const total = kindCollections.length;
    setCollectionsState((current) =>
      current.map((item) => {
        const movedIndex = kindCollections.findIndex((candidate) => candidate.id === item.id);
        if (item.kind !== currentKind || movedIndex === -1) return item;
        const nextBoost = Math.max(0, 100 - movedIndex);
        return {
          ...item,
          editorialBoost: currentKind === "trend" ? item.editorialBoost : nextBoost,
          trendBoost: currentKind === "trend" ? nextBoost : item.trendBoost,
          publishedAt: item.publishedAt ?? new Date(Date.now() - (total - movedIndex) * 1000).toISOString()
        };
      })
    );
    setMessage(null);
  };

  const moveProduct = (productId: string, direction: -1 | 1) => {
    if (!selectedCollection) return;
    const currentProducts = [...selectedCollection.products];
    const index = currentProducts.findIndex((item) => item.productId === productId);
    if (index < 0) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentProducts.length) return;
    [currentProducts[index], currentProducts[targetIndex]] = [currentProducts[targetIndex], currentProducts[index]];
    updateCollection(selectedCollection.id, (current) => ({
      ...current,
      products: currentProducts.map((item, itemIndex) => ({
        ...item,
        position: itemIndex + 1,
        editorialBoost: Math.max(0, 100 - itemIndex)
      }))
    }));
  };

  const removeProduct = (productId: string) => {
    if (!selectedCollection) return;
    updateCollection(selectedCollection.id, (current) => ({
      ...current,
      products: current.products
        .filter((item) => item.productId !== productId)
        .map((item, index) => ({ ...item, position: index + 1 }))
    }));
  };

  const addProduct = () => {
    if (!selectedCollection || !selectedProductId) return;
    const product = productMap.get(selectedProductId);
    if (!product) return;
    updateCollection(selectedCollection.id, (current) => ({
      ...current,
      products: [
        ...current.products,
        {
          productId: product.id,
          position: current.products.length + 1,
          editorialBoost: 0,
          product
        }
      ]
    }));
  };

  const saveCollectionOrder = () => {
    setMessage(null);
    setSaveMode("collections");
    startSaving(async () => {
      try {
        const response = await fetch("/api/admin/curadoria", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reorder_collections",
            kind: activeKind,
            collectionIds: visibleCollections.map((item) => item.id)
          })
        });
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(payload?.error ?? "Falha ao salvar a ordem das colecoes.");
        setMessage(`Ordem de ${getDiscoveryCollectionKindMeta(activeKind).label} salva.`);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao salvar a ordem das colecoes.");
      } finally {
        setSaveMode(null);
      }
    });
  };

  const saveCollectionProducts = () => {
    if (!selectedCollection) return;
    setMessage(null);
    setSaveMode("products");
    startSaving(async () => {
      try {
        const response = await fetch("/api/admin/curadoria", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "set_collection_products",
            collectionId: selectedCollection.id,
            productIds: selectedCollection.products.map((item) => item.productId)
          })
        });
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(payload?.error ?? "Falha ao salvar os produtos da colecao.");
        setMessage(`Produtos de ${selectedCollection.title} salvos.`);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao salvar os produtos da colecao.");
      } finally {
        setSaveMode(null);
      }
    });
  };

  const saveCollectionDetails = () => {
    if (!selectedCollection) return;
    setMessage(null);
    setSaveMode("details");
    startSaving(async () => {
      try {
        const response = await fetch("/api/admin/curadoria", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collectionId: selectedCollection.id,
            title: selectedCollection.title,
            description: selectedCollection.description,
            coverImage: selectedCollection.coverImage,
            status: selectedCollection.status,
            editorialBoost: selectedCollection.editorialBoost,
            trendBoost: selectedCollection.trendBoost,
            publishedAt: selectedCollection.publishedAt
          })
        });
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(payload?.error ?? "Falha ao salvar os detalhes da colecao.");
        setMessage(`Detalhes de ${selectedCollection.title} salvos.`);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao salvar os detalhes da colecao.");
      } finally {
        setSaveMode(null);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="space-y-4 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {kinds.map((kind) => {
              const count = collectionsByKind.get(kind.key)?.length ?? 0;
              const active = kind.key === activeKind;
              return (
                <button
                  key={kind.key}
                  type="button"
                  onClick={() => setActiveKind(kind.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.22em] transition ${
                    active
                      ? "border-bpPink/70 bg-bpPinkSoft/20 text-bpBlack"
                      : "border-black/10 bg-bpOffWhite text-bpGraphite hover:border-bpPink/35"
                  }`}
                >
                  <Sparkles size={13} />
                  {kind.label}
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] tracking-[0.18em] text-bpGraphite">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-black/8 bg-bpOffWhite/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-bpGraphite/55">Camada ativa</p>
            <h2 className="mt-2 font-display text-3xl text-bpBlack">{getDiscoveryCollectionKindMeta(activeKind).label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-bpGraphite/80">
              {getDiscoveryCollectionKindMeta(activeKind).description}
            </p>
            <button
              type="button"
              onClick={saveCollectionOrder}
              disabled={isSaving && saveMode !== null}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-bpBlack px-5 py-3 text-xs uppercase tracking-[0.22em] text-bpOffWhite transition hover:bg-bpBlackSoft disabled:opacity-60"
            >
              <Save size={14} />
              {isSaving && saveMode === "collections" ? "Salvando..." : "Salvar ordem das colecoes"}
            </button>
          </div>

          <div className="space-y-3">
            {visibleCollections.map((collection, index) => {
              const selected = collection.id === selectedCollectionId;
              return (
                <div
                  key={collection.id}
                  className={`rounded-[24px] border p-4 transition ${
                    selected ? "border-bpPink/45 bg-bpPinkSoft/10" : "border-black/10 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCollectionId(collection.id)}
                      className="flex-1 text-left"
                    >
                      <p className="text-[10px] uppercase tracking-[0.28em] text-bpGraphite/55">
                        #{index + 1} Â· {collection.status}
                      </p>
                      <h3 className="mt-2 font-display text-2xl text-bpBlack">{collection.title}</h3>
                      <p className="mt-2 text-sm text-bpGraphite/75">
                        {collection.productCount} produtos Â· boost editorial {collection.editorialBoost.toFixed(0)}
                        {activeKind === "trend" ? ` Â· trend ${collection.trendBoost.toFixed(0)}` : ""}
                      </p>
                    </button>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => moveCollection(collection.id, -1)}
                        disabled={index === 0}
                        className="rounded-full border border-black/10 p-2 text-bpGraphite transition hover:border-bpPink/40 disabled:opacity-40"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCollection(collection.id, 1)}
                        disabled={index === visibleCollections.length - 1}
                        className="rounded-full border border-black/10 p-2 text-bpGraphite transition hover:border-bpPink/40 disabled:opacity-40"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleCollections.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-black/15 bg-white p-5 text-sm text-bpGraphite/75">
                Nenhuma colecao desse tipo ainda. O schema novo ja esta ligado, mas ainda nao ha registros para esta camada.
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-4 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          {selectedCollection ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[24px] border border-black/10 bg-bpOffWhite">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={selectedCollection.coverImage || COVER_FALLBACK}
                        alt={selectedCollection.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 320px"
                        unoptimized={String(selectedCollection.coverImage || COVER_FALLBACK).endsWith('.svg')}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-bpGraphite/60">
                      Status
                      <select
                        value={selectedCollection.status}
                        onChange={(event) =>
                          updateCollection(selectedCollection.id, (current) => ({
                            ...current,
                            status: event.target.value as CollectionDraft["status"]
                          }))
                        }
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-bpBlack outline-none focus:border-bpPink/45"
                      >
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                        <option value="archived">archived</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-bpGraphite/60">
                      Cover image
                      <input
                        value={selectedCollection.coverImage ?? ""}
                        onChange={(event) =>
                          updateCollection(selectedCollection.id, (current) => ({
                            ...current,
                            coverImage: event.target.value.trim() || null
                          }))
                        }
                        placeholder="/editorial/...svg"
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-bpBlack outline-none placeholder:text-bpGraphite/45 focus:border-bpPink/45"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-bpGraphite/60">
                    Titulo
                    <input
                      value={selectedCollection.title}
                      onChange={(event) =>
                        updateCollection(selectedCollection.id, (current) => ({ ...current, title: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base normal-case tracking-normal text-bpBlack outline-none focus:border-bpPink/45"
                    />
                  </label>
                  <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-bpGraphite/60">
                    Descricao
                    <textarea
                      value={selectedCollection.description ?? ""}
                      onChange={(event) =>
                        updateCollection(selectedCollection.id, (current) => ({
                          ...current,
                          description: event.target.value.trim() || null
                        }))
                      }
                      rows={4}
                      className="w-full rounded-3xl border border-black/10 bg-white px-4 py-4 text-sm normal-case tracking-normal text-bpBlack outline-none placeholder:text-bpGraphite/45 focus:border-bpPink/45"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-bpGraphite/60">
                      Editorial boost
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={selectedCollection.editorialBoost}
                        onChange={(event) =>
                          updateCollection(selectedCollection.id, (current) => ({
                            ...current,
                            editorialBoost: Math.max(0, Math.min(100, Number(event.target.value || 0)))
                          }))
                        }
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-bpBlack outline-none focus:border-bpPink/45"
                      />
                    </label>
                    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-bpGraphite/60">
                      Trend boost
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={selectedCollection.trendBoost}
                        onChange={(event) =>
                          updateCollection(selectedCollection.id, (current) => ({
                            ...current,
                            trendBoost: Math.max(0, Math.min(100, Number(event.target.value || 0)))
                          }))
                        }
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-bpBlack outline-none focus:border-bpPink/45"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={saveCollectionDetails}
                    disabled={isSaving && saveMode !== null}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-bpBlack transition hover:border-bpPink/40 disabled:opacity-60"
                  >
                    <Save size={14} />
                    {isSaving && saveMode === "details" ? "Salvando..." : "Salvar detalhes"}
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-black/10 bg-bpOffWhite/45 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-bpGraphite/55">Collection products</p>
                    <h3 className="mt-2 font-display text-2xl text-bpBlack">Ordenar produtos da colecao</h3>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar por titulo, marca, categoria ou slug"
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none placeholder:text-bpGraphite/45 focus:border-bpPink/45"
                    />
                    <select
                      value={selectedProductId}
                      onChange={(event) => setSelectedProductId(event.target.value)}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack outline-none focus:border-bpPink/45"
                    >
                      {availableForSelectedCollection.length === 0 ? (
                        <option value="">Nenhum produto disponivel</option>
                      ) : (
                        availableForSelectedCollection.map((product) => (
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
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-bpPink/35 bg-white px-4 py-3 text-xs uppercase tracking-[0.22em] text-bpBlack transition hover:border-bpPink/70 disabled:opacity-50"
                    >
                      <Plus size={14} />
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedCollection.products.map((item, index) => {
                  const imageUrl = getProductDisplayImage({
                    category: item.product.category,
                    heroImageUrl: item.product.heroImageUrl,
                    coverImage: item.product.images[0]
                  });

                  return (
                    <div
                      key={item.productId}
                      className="grid gap-4 rounded-[24px] border border-black/10 bg-white p-4 md:grid-cols-[88px_1fr_auto]"
                    >
                      <div className="overflow-hidden rounded-2xl bg-bpOffWhite">
                        <div className="relative h-24 w-full">
                          <Image
                            src={imageUrl}
                            alt={item.product.title}
                            fill
                            className="object-cover"
                            sizes="88px"
                            unoptimized={String(imageUrl).endsWith('.svg')}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-bpGraphite/55">
                          Posicao {index + 1} Â· score {item.product.productScore?.toFixed(1) ?? "--"}
                        </p>
                        <h4 className="mt-2 font-display text-2xl text-bpBlack">{item.product.title}</h4>
                        <p className="mt-2 text-sm text-bpGraphite/75">
                          {item.product.category ?? "Categoria"}
                          {item.product.brand ? ` Â· ${item.product.brand}` : ""} Â· {formatPrice(item.product.priceCents / 100)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/50">
                          /produto/{item.product.slug}
                        </p>
                      </div>
                      <div className="flex flex-row gap-2 md:flex-col md:items-end">
                        <button
                          type="button"
                          onClick={() => moveProduct(item.productId, -1)}
                          disabled={index === 0}
                          className="rounded-full border border-black/10 p-2 text-bpGraphite transition hover:border-bpPink/40 disabled:opacity-40"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProduct(item.productId, 1)}
                          disabled={index === selectedCollection.products.length - 1}
                          className="rounded-full border border-black/10 p-2 text-bpGraphite transition hover:border-bpPink/40 disabled:opacity-40"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProduct(item.productId)}
                          className="rounded-full border border-bpPink/35 p-2 text-bpPink transition hover:border-bpPink/70"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {selectedCollection.products.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-black/15 bg-white p-5 text-sm text-bpGraphite/75">
                    Esta colecao ainda nao tem produtos. Adicione itens publicados e salve a lista para refletir na home/catalogo.
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={saveCollectionProducts}
                disabled={isSaving && saveMode !== null}
                className="inline-flex items-center gap-2 rounded-full bg-bpBlack px-5 py-3 text-xs uppercase tracking-[0.22em] text-bpOffWhite transition hover:bg-bpBlackSoft disabled:opacity-60"
              >
                <Save size={14} />
                {isSaving && saveMode === "products" ? "Salvando..." : "Salvar produtos da colecao"}
              </button>
            </>
          ) : (
            <div className="rounded-[24px] border border-dashed border-black/15 bg-bpOffWhite/40 p-6 text-sm text-bpGraphite/75">
              Selecione uma colecao para editar os produtos e a ordem editorial.
            </div>
          )}

          {message ? <p className="text-sm text-bpGraphite/80">{message}</p> : null}
        </section>
      </div>
    </div>
  );
}

