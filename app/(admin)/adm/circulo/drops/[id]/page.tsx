"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
      {items.length > 0 && (
        <div className="rounded-xl border border-neutral-200">
          <div className="border-b border-neutral-100 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Itens do drop</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Produto</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Preço</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Vendidos</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Total</th>
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
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{item.max_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
