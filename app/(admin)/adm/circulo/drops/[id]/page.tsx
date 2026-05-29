"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// ── Tipos ────────────────────────────────────────────────────────────────────

type DropStatus = "draft" | "live" | "closed" | "fulfilling" | "delivered";

type DropItem = {
  id: string;
  drop_price_cents: number;
  max_quantity: number;
  sold_quantity: number;
  stripe_payment_link_url: string | null;
  fulfillment_eta_days: number;
  products: { id: string; name: string; slug: string; price_cents: number; images?: string[] } | null;
};

type Broadcast = {
  id: string;
  channel: "email" | "whatsapp";
  sent_at: string;
  recipients_count: number;
  error_log: string | null;
};

type Drop = {
  id: string;
  number: number;
  title: string;
  opens_at: string;
  closes_at: string;
  status: DropStatus;
  total_orders: number;
  gmv_cents: number;
  notes: string | null;
};

const STATUS_LABELS: Record<DropStatus, string> = {
  draft:      "Rascunho",
  live:       "Em pré-venda",
  closed:     "Encerrado",
  fulfilling: "Em separação",
  delivered:  "Entregue",
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toDatetimeLocal(iso: string) {
  return iso ? new Date(iso).toISOString().slice(0, 16) : "";
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function EditDropPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [drop, setDrop] = useState<Drop | null>(null);
  const [items, setItems] = useState<DropItem[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/adm/drops/${id}`);
      if (!res.ok) { setError("Drop não encontrado."); return; }
      const data = (await res.json()) as { drop: Drop; items: DropItem[]; broadcasts: Broadcast[] };
      setDrop(data.drop);
      setItems(data.items);
      setBroadcasts(data.broadcasts);
      setTitle(data.drop.title);
      setOpensAt(toDatetimeLocal(data.drop.opens_at));
      setClosesAt(toDatetimeLocal(data.drop.closes_at));
      setNotes(data.drop.notes ?? "");
    } catch {
      setError("Erro ao carregar drop.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    setError(null); setSuccess(null); setSaving(true);
    try {
      const res = await fetch(`/api/adm/drops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, opens_at: new Date(opensAt).toISOString(), closes_at: new Date(closesAt).toISOString(), notes: notes || null }),
      });
      if (!res.ok) { const d = (await res.json()) as { error?: string }; setError(d.error ?? "Erro."); return; }
      setSuccess("Salvo com sucesso.");
      await load();
    } catch { setError("Erro de conexão."); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!confirm(`Publicar o Drop #${drop?.number ?? ""}? Isso enviará e-mail e WhatsApp para todos os membros do Círculo com consentimento.`)) return;
    setError(null); setSuccess(null); setPublishing(true);
    try {
      const res = await fetch(`/api/adm/drops/${id}/publish`, { method: "POST" });
      const data = (await res.json()) as { message?: string; error?: string; recipients?: number; link_errors?: string[] };
      if (!res.ok) { setError(data.error ?? "Erro ao publicar."); return; }
      setSuccess(`${data.message ?? "Publicado."} ${data.link_errors?.length ? `(${data.link_errors.length} erro(s) de Payment Link)` : ""}`);
      await load();
    } catch { setError("Erro de conexão."); }
    finally { setPublishing(false); }
  };

  const inputClass = "block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus-visible:border-black";
  const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error ?? "Drop não encontrado."}</p>
        <button onClick={() => router.back()} className="mt-4 text-xs text-neutral-400 underline">Voltar</button>
      </div>
    );
  }

  const isDraft = drop.status === "draft";

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Drop #{drop.number}</p>
          <h1 className="mt-0.5 text-xl font-semibold text-neutral-900">{drop.title}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          {isDraft && (
            <button
              onClick={handlePublish}
              disabled={publishing || items.length === 0}
              className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold tracking-wider text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {publishing ? "Publicando..." : "Publicar drop"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDraft}
            className="rounded-lg bg-black px-4 py-2 text-xs font-semibold tracking-wider text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 px-4 py-3 text-xs text-green-700">{success}</div>}
      {!isDraft && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          Status: <strong>{STATUS_LABELS[drop.status]}</strong> — edição de campos bloqueada. Para ajustar SKUs, use a API.
        </div>
      )}

      {/* Dados do drop */}
      <div className="grid gap-5 rounded-xl border border-neutral-200 bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Título</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!isDraft} className={inputClass} maxLength={120} />
        </div>
        <div>
          <label className={labelClass}>Abertura</label>
          <input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} disabled={!isDraft} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Fechamento</label>
          <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} disabled={!isDraft} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notas internas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!isDraft} rows={2} className={`${inputClass} resize-none`} maxLength={1000} />
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Pedidos", value: drop.total_orders },
          { label: "GMV", value: formatCurrency(drop.gmv_cents) },
          { label: "Status", value: STATUS_LABELS[drop.status] },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{m.label}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* SKUs */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">SKUs do drop ({items.length})</p>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400">
            Nenhum SKU adicionado. Use a API PATCH /api/adm/drops/{"{id}"} com o campo items[].
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-left">Preço drop</th>
                  <th className="px-4 py-3 text-left">Qtd máx</th>
                  <th className="px-4 py-3 text-left">Vendido</th>
                  <th className="px-4 py-3 text-left">ETA</th>
                  <th className="px-4 py-3 text-left">Link Stripe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium">{item.products?.name ?? item.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.drop_price_cents)}</td>
                    <td className="px-4 py-3">{item.max_quantity}</td>
                    <td className="px-4 py-3">{item.sold_quantity}</td>
                    <td className="px-4 py-3">{item.fulfillment_eta_days}d</td>
                    <td className="px-4 py-3">
                      {item.stripe_payment_link_url ? (
                        <a href={item.stripe_payment_link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                          Abrir ↗
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-300">Pendente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcasts */}
      {broadcasts.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Histórico de broadcasts</p>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-3 text-left">Canal</th>
                  <th className="px-4 py-3 text-left">Enviado em</th>
                  <th className="px-4 py-3 text-left">Destinatários</th>
                  <th className="px-4 py-3 text-left">Erros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {broadcasts.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 capitalize">{b.channel}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {new Date(b.sent_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">{b.recipients_count}</td>
                    <td className="px-4 py-3 text-xs text-red-500">{b.error_log ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
