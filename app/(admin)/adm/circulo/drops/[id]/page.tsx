"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";

type DropStatus = "draft" | "scheduled" | "live" | "closed" | "sold_out" | "fulfilling" | "delivered";

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface DropItem {
  id: string;
  drop_price_cents: number;
  max_quantity: number;
  sold_quantity: number;
  fulfillment_eta_days: number;
  stripe_payment_link_url: string | null;
  products: { id: string; name: string; slug: string | null } | null;
}

interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  sellerId: string | null;
}

interface DropDetail {
  id: string;
  number: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  opens_at: string | null;
  closes_at: string | null;
  status: DropStatus;
  sem_reposicao: boolean;
  canal: string;
  total_orders: number;
  gmv_cents: number;
  notes: string | null;
  glass_qty: number;
}

const STATUS_LABELS: Record<DropStatus, string> = {
  draft:      "Rascunho",
  scheduled:  "Agendado",
  live:       "Ao vivo",
  closed:     "Encerrado",
  sold_out:   "Esgotado",
  fulfilling: "Em separação",
  delivered:  "Entregue",
};

const STATUS_OPTIONS: DropStatus[] = ["draft", "scheduled", "live", "closed", "fulfilling", "delivered"];

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DropDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [drop, setDrop] = useState<DropDetail | null>(null);
  const [items, setItems] = useState<DropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [status, setStatus] = useState<DropStatus>("draft");
  const [notes, setNotes] = useState("");
  const [glassQty, setGlassQty] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Add-item state
  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState<ProductSearchResult[]>([]);
  const [itemSearching, setItemSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemEta, setNewItemEta] = useState("7");
  const [addingItem, setAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDrop = useCallback(async () => {
    const res = await fetch(`/api/adm/drops/${id}`);
    if (!res.ok) { setError("Drop não encontrado."); setLoading(false); return; }
    const data = await res.json() as { drop: DropDetail; items: DropItem[] };

    setDrop(data.drop);
    setItems(data.items ?? []);
    setTitle(data.drop.title);
    setSlug(data.drop.slug ?? "");
    setSubtitle(data.drop.subtitle ?? "");
    setDescription(data.drop.description ?? "");
    setCoverImageUrl(data.drop.cover_image_url ?? null);
    setOpensAt(toLocalDatetime(data.drop.opens_at));
    setClosesAt(toLocalDatetime(data.drop.closes_at));
    setStatus(data.drop.status);
    setNotes(data.drop.notes ?? "");
    setGlassQty(data.drop.glass_qty ?? 0);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchDrop(); }, [fetchDrop]);

  const handleItemQueryChange = (value: string) => {
    setItemQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (value.trim().length < 2) { setItemResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setItemSearching(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(value)}&pageSize=8`);
        const data = await res.json() as { items?: ProductSearchResult[] };
        setItemResults(data.items ?? []);
      } finally {
        setItemSearching(false);
      }
    }, 300);
  };

  const handleSelectProduct = (product: ProductSearchResult) => {
    setSelectedProduct(product);
    setNewItemPrice((product.price).toFixed(2));
    setItemResults([]);
    setItemQuery("");
    setAddItemError(null);
  };

  const handleAddItem = async () => {
    if (!selectedProduct) return;
    if (!selectedProduct.sellerId) {
      setAddItemError("Este produto não tem vendedor vinculado e não pode ser adicionado.");
      return;
    }
    const priceCents = Math.round(parseFloat(newItemPrice) * 100);
    const qty = parseInt(newItemQty, 10);
    const eta = parseInt(newItemEta, 10);
    if (!priceCents || priceCents <= 0 || !qty || qty < 1 || !eta || eta < 1) {
      setAddItemError("Preencha preço, quantidade e prazo corretamente.");
      return;
    }
    setAddingItem(true);
    setAddItemError(null);
    try {
      const res = await fetch(`/api/adm/drops/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id:           selectedProduct.id,
          seller_id:            selectedProduct.sellerId,
          drop_price_cents:     priceCents,
          max_quantity:         qty,
          fulfillment_eta_days: eta,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setAddItemError(data.error ?? "Erro ao adicionar."); return; }
      setSelectedProduct(null);
      setItemQuery("");
      setNewItemPrice("");
      setNewItemQty("1");
      setNewItemEta("7");
      await fetchDrop();
    } finally {
      setAddingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Remover este produto do drop? O lote de estoque associado será suspenso.")) return;
    const res = await fetch(`/api/adm/drops/${id}/items?item_id=${itemId}`, { method: "DELETE" });
    if (res.ok) {
      await fetchDrop();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Erro ao remover item.");
    }
  };

  // Live stats polling (10s)
  useEffect(() => {
    if (status !== "live") return;
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`/api/adm/drops/${id}`);
      if (!res.ok) return;
      const data = await res.json() as { drop: DropDetail; items: DropItem[] };
      setDrop((prev) => prev
        ? { ...prev, total_orders: data.drop.total_orders, gmv_cents: data.drop.gmv_cents, status: data.drop.status }
        : prev
      );
      setItems(data.items ?? []);
    }, 10_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [id, status]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/adm/drops/${id}/upload-image`, { method: "POST", body: form });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) { setUploadError(data.error ?? "Erro no upload."); return; }
      setCoverImageUrl(data.url ?? null);
    } catch {
      setUploadError("Erro de conexão no upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/adm/drops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:           title.trim() || undefined,
          slug:            slug.trim() || undefined,
          subtitle:        subtitle.trim() || undefined,
          description:     description.trim() || undefined,
          cover_image_url: coverImageUrl ?? null,
          opens_at:        opensAt ? new Date(opensAt).toISOString() : undefined,
          closes_at:       closesAt ? new Date(closesAt).toISOString() : undefined,
          status,
          notes:           notes.trim() || null,
          glass_qty:       glassQty,
        }),
      });

      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Erro ao salvar."); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este rascunho? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    const res = await fetch(`/api/adm/drops/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/adm/circulo/drops");
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Erro ao excluir.");
      setDeleting(false);
    }
  };

  const inputClass = "block w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black/10";
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="p-6 text-sm text-neutral-500">
        Drop não encontrado.{" "}
        <Link href="/adm/circulo/drops" className="text-black underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/adm/circulo/drops" className="text-xs text-neutral-400 hover:text-neutral-700">← Drops</Link>
            <span className="text-xs text-neutral-300">/</span>
            <span className="text-xs text-neutral-500">Drop #{drop.number}</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-neutral-900">{drop.title}</h1>
          <p className="mt-0.5 text-xs text-neutral-400">
            Slug: <code className="font-mono">/drops/{drop.slug}</code>
          </p>
        </div>
        <a
          href={`/drops/${drop.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600 hover:border-neutral-400"
        >
          Ver PDP ↗
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-[10px] uppercase tracking-wider text-neutral-400">Pedidos</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{drop.total_orders}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-[10px] uppercase tracking-wider text-neutral-400">GMV</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{formatCurrency(drop.gmv_cents)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-[10px] uppercase tracking-wider text-neutral-400">Status</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">{STATUS_LABELS[drop.status]}</p>
          {drop.status === "live" && (
            <span className="mt-1 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Produto do drop</h2>
          {items.length === 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">Nenhum produto</span>
          )}
        </div>
        {items.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Produto</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Preço</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Vendidos / Total</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Prazo</th>
                {(drop.status === "draft" || drop.status === "scheduled") && (
                  <th className="px-4 py-2.5" />
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-neutral-900">{item.products?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-700">{formatCurrency(item.drop_price_cents)}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    <span className={item.sold_quantity >= item.max_quantity ? "font-semibold text-red-600" : ""}>
                      {item.sold_quantity}
                    </span>
                    <span className="text-neutral-400"> / {item.max_quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{item.fulfillment_eta_days}d</td>
                  {(drop.status === "draft" || drop.status === "scheduled") && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-[11px] text-neutral-400 transition-colors hover:text-red-600"
                      >
                        Remover
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-5 text-sm text-neutral-400">Nenhum produto adicionado ainda.</p>
        )}
      </div>

      {/* Add item form — only for editable drops without an item yet */}
      {(drop.status === "draft" || drop.status === "scheduled") && items.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">Adicionar produto</h2>

          {!selectedProduct ? (
            <div className="relative">
              <label className={labelClass}>Buscar produto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={itemQuery}
                  onChange={(e) => handleItemQueryChange(e.target.value)}
                  placeholder="Digite o nome do produto..."
                  className={`${inputClass} pl-9`}
                />
              </div>
              {itemSearching && (
                <p className="mt-2 text-[11px] text-neutral-400">Buscando...</p>
              )}
              {itemResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-xl">
                  {itemResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span className="font-medium text-neutral-900">{product.name}</span>
                      <span className="ml-4 shrink-0 text-neutral-400">
                        {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{selectedProduct.name}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    Preço de catálogo: {selectedProduct.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedProduct(null); setAddItemError(null); }}
                  className="ml-4 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Preço do drop (R$)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="0,00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Qtd máxima</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Prazo (dias úteis)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newItemEta}
                    onChange={(e) => setNewItemEta(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {!selectedProduct.sellerId && (
                <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                  Este produto não tem vendedor vinculado e não pode ser adicionado.
                </p>
              )}

              {addItemError && (
                <p className="rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-700">{addItemError}</p>
              )}

              <button
                type="button"
                onClick={handleAddItem}
                disabled={addingItem || !selectedProduct.sellerId}
                className="w-full rounded-lg bg-black py-3 text-xs font-semibold tracking-wider text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
              >
                {addingItem ? "Adicionando..." : "Confirmar e adicionar ao drop"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Editar drop</h2>

        {/* Imagem de capa */}
        <div>
          <label className={labelClass}>Imagem de capa</label>
          <div className="flex items-start gap-4">
            <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
              {coverImageUrl ? (
                <Image
                  src={coverImageUrl}
                  alt="Capa do drop"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] text-neutral-400">
                  Sem imagem
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-400 disabled:opacity-50"
              >
                {coverImageUrl ? "Alterar imagem" : "Enviar imagem"}
              </button>
              <p className="text-[11px] text-neutral-400">JPG, PNG, WebP ou GIF · máx. 5 MB</p>
              {uploadError && (
                <p className="text-[11px] text-red-600">{uploadError}</p>
              )}
              {coverImageUrl && (
                <button
                  type="button"
                  onClick={() => setCoverImageUrl(null)}
                  className="block text-[11px] text-neutral-400 underline hover:text-red-500"
                >
                  Remover imagem
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            maxLength={120} className={inputClass} required />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className={labelClass} style={{ marginBottom: 0 }}>Slug (URL)</span>
            <button
              type="button"
              onClick={() => setSlug(toSlug(title))}
              className="text-[11px] text-neutral-400 underline hover:text-neutral-700"
            >
              Gerar do título
            </button>
          </div>
          <div className="flex items-center rounded-lg border border-neutral-200 bg-white focus-within:border-black focus-within:ring-2 focus-within:ring-black/10">
            <span className="select-none pl-4 font-mono text-sm text-neutral-400">/drops/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              maxLength={80}
              className="flex-1 bg-transparent py-2.5 pr-4 font-mono text-sm outline-none"
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">Apenas letras minúsculas, números e hífens.</p>
        </div>

        <div>
          <label className={labelClass}>Subtítulo</label>
          <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
            maxLength={200} className={inputClass} placeholder="Linha de apoio exibida na PDP" />
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={5} maxLength={3000} className={`${inputClass} resize-none`}
            placeholder="Markdown suportado na PDP." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Abertura</label>
            <input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fechamento</label>
            <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)}
              className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as DropStatus)}
            className={inputClass}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Drop Glass (quantidade)</label>
          <input
            type="number"
            value={glassQty}
            onChange={(e) => setGlassQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
            min={0}
            step={1}
            className={inputClass}
            placeholder="0"
          />
        </div>

        <div>
          <label className={labelClass}>Notas internas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={3} maxLength={1000} className={`${inputClass} resize-none`} />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
        )}
        {saved && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-xs text-green-700">Salvo com sucesso.</div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 rounded-lg bg-black py-3 text-xs font-semibold tracking-wider text-white transition-colors hover:bg-neutral-700 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          {drop.status === "draft" && (
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="rounded-lg border border-red-200 px-5 py-3 text-xs text-red-600 transition-colors hover:border-red-400 disabled:opacity-50">
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
