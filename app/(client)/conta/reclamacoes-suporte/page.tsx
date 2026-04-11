"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/lib/AuthContext";
import {
  type OrderRow,
  type SubOrderRow,
  formatDateTimePtBr,
  shortId,
  statusClassName,
  statusLabel,
  statusMessage
} from "@/lib/customer/portal";
import {
  getCustomerOrders,
  getCustomerSupportTickets,
  mapOrdersListToLegacy,
  mapTicketSummaryToLegacy,
  postCustomerSupportTicket
} from "@/lib/customer/api";

type TicketRow = {
  id: string;
  status: string;
  subject: string;
  created_at: string;
};

const REASONS = [
  { key: "nao_chegou", label: "Nao chegou" },
  { key: "produto_errado", label: "Produto errado" },
  { key: "avaria", label: "Avaria" },
  { key: "qualidade", label: "Qualidade" },
  { key: "atendimento", label: "Atendimento" },
  { key: "outros", label: "Outros" }
];

const OUTCOMES = [
  { key: "reenvio", label: "Quero reenvio" },
  { key: "reembolso", label: "Quero reembolso" },
  { key: "troca", label: "Quero troca" },
  { key: "registro", label: "So registrar" }
];

const protocolCode = (id: string) => `BP-${id.slice(0, 8).toUpperCase()}`;

const reasonMap: Record<string, string> = {
  nao_chegou: "NOT_RECEIVED",
  produto_errado: "WRONG_ITEM",
  avaria: "DAMAGED_ITEM",
  qualidade: "QUALITY_ISSUE",
  atendimento: "SERVICE_ISSUE",
  outros: "OTHER",
  produto: "QUALITY_ISSUE",
  troca: "OTHER",
  reembolso: "OTHER",
  vale: "OTHER"
};

const resolutionMap: Record<string, string> = {
  reenvio: "RESHIP",
  reembolso: "REFUND",
  troca: "EXCHANGE",
  registro: "INFO"
};

export default function ContaSuportePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [subOrders, setSubOrders] = useState<SubOrderRow[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, string>>({});
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmTruth, setConfirmTruth] = useState(false);
  const [form, setForm] = useState({
    orderId: searchParams.get("order") ?? "",
    sellerId: searchParams.get("seller") ?? "",
    reason: searchParams.get("reason") ?? "nao_chegou",
    outcome: "reembolso",
    evidenceUrl: "",
    description: ""
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const [orderRows, ticketRows] = await Promise.all([
          getCustomerOrders({ page: 1, page_size: 30 }),
          getCustomerSupportTickets({ page: 1, page_size: 30 })
        ]);
        const mappedOrders = mapOrdersListToLegacy(orderRows);

        if (!active) return;
        setOrders(mappedOrders.orders as OrderRow[]);
        setSubOrders(mappedOrders.subOrders as SubOrderRow[]);
        setSellerMap(mappedOrders.sellerMap);
        setTickets(ticketRows.items.map(mapTicketSummaryToLegacy));
      } catch {
        if (active) {
          setOrders([]);
          setSubOrders([]);
          setSellerMap({});
          setTickets([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user]);

  const sellersForSelectedOrder = useMemo(() => {
    if (!form.orderId) return [];
    const current = subOrders.filter((row) => row.order_id === form.orderId);
    const ids = Array.from(new Set(current.map((row) => row.seller_id)));
    return ids.map((id) => ({ id, name: sellerMap[id] ?? "Lojista" }));
  }, [form.orderId, sellerMap, subOrders]);

  useEffect(() => {
    if (!form.orderId) return;
    if (form.sellerId && sellersForSelectedOrder.some((seller) => seller.id === form.sellerId)) return;
    setForm((prev) => ({
      ...prev,
      sellerId: sellersForSelectedOrder[0]?.id ?? ""
    }));
  }, [form.orderId, form.sellerId, sellersForSelectedOrder]);

  const handleCreateTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.orderId || !form.sellerId || !form.reason || !form.description.trim()) {
      setMessage("Selecione pedido, lojista, motivo e descreva o ocorrido.");
      return;
    }
    if (!confirmTruth) {
      setMessage("Confirme que as informacoes sao verdadeiras para abrir o protocolo.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const selectedSubOrder = subOrders.find(
        (subOrder) => subOrder.order_id === form.orderId && subOrder.seller_id === form.sellerId
      );
      const outcomeLabel = OUTCOMES.find((outcome) => outcome.key === form.outcome)?.label ?? form.outcome;
      const description = [
        form.description.trim(),
        form.evidenceUrl.trim() ? `Evidencia: ${form.evidenceUrl.trim()}` : null,
        `Resultado esperado: ${outcomeLabel}`
      ]
        .filter(Boolean)
        .join("\n");

      const ticket = await postCustomerSupportTicket({
        order_id: form.orderId,
        sub_order_id: selectedSubOrder?.id,
        seller_id: form.sellerId,
        reason: reasonMap[form.reason] ?? "OTHER",
        desired_resolution: resolutionMap[form.outcome] ?? "INFO",
        description
      });

      setTickets((prev) => [
        {
          id: ticket.ticket_id,
          status: ticket.status,
          subject: `${ticket.reason} - ${ticket.protocol}`,
          created_at: ticket.created_at
        },
        ...prev
      ]);
      setMessage(`Protocolo ${protocolCode(ticket.ticket_id)} criado com sucesso.`);
      setForm((prev) => ({
        ...prev,
        description: "",
        evidenceUrl: "",
        reason: "nao_chegou",
        outcome: "reembolso"
      }));
      setConfirmTruth(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel abrir o protocolo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Reclamacoes e suporte</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Central com protocolo</h1>
        <p className="mt-3 text-sm text-bpGraphite/75">
          SLA alvo: resposta inicial em ate 24h. Toda atualizacao fica registrada no historico do caso.
        </p>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <p className="text-sm font-semibold text-bpBlack">Abrir nova reclamacao</p>

          <div className="rounded-2xl border border-black/10 bg-bpOffWhite/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Passo 1 e 2</p>
            <p className="mt-1 text-sm text-bpGraphite/75">Selecione pedido e lojista.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.orderId}
              onChange={(event) => setForm((prev) => ({ ...prev, orderId: event.target.value }))}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
            >
              <option value="">Selecione o pedido</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  Pedido {shortId(order.id)} - {statusLabel(order.status, "order")}
                </option>
              ))}
            </select>

            <select
              value={form.sellerId}
              onChange={(event) => setForm((prev) => ({ ...prev, sellerId: event.target.value }))}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
            >
              <option value="">Selecione o lojista</option>
              {sellersForSelectedOrder.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>

            <select
              value={form.reason}
              onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
            >
              {REASONS.map((reason) => (
                <option key={reason.key} value={reason.key}>
                  {reason.label}
                </option>
              ))}
            </select>

            <select
              value={form.outcome}
              onChange={(event) => setForm((prev) => ({ ...prev, outcome: event.target.value }))}
              className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
            >
              {OUTCOMES.map((outcome) => (
                <option key={outcome.key} value={outcome.key}>
                  {outcome.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-black/10 bg-bpOffWhite/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Passo 3</p>
            <p className="mt-1 text-sm text-bpGraphite/75">Defina motivo e resultado esperado.</p>
          </div>
          <input
            value={form.evidenceUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, evidenceUrl: event.target.value }))}
            placeholder="Link da evidencia (foto/video), opcional"
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />

          <div className="rounded-2xl border border-black/10 bg-bpOffWhite/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Passo 4</p>
            <p className="mt-1 text-sm text-bpGraphite/75">Descreva e confirme as evidencias.</p>
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Descreva o ocorrido e o que voce espera como resolucao"
            className="min-h-[130px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
          />

          <label className="flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm text-bpGraphite/80">
            <input
              type="checkbox"
              checked={confirmTruth}
              onChange={(event) => setConfirmTruth(event.target.checked)}
              className="h-4 w-4 accent-[#C2185B]"
            />
            Confirmo que as informacoes sao verdadeiras.
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full border border-bpPink/50 bg-bpPink px-6 py-3 text-xs uppercase tracking-[0.22em] text-white disabled:opacity-60"
          >
            {saving ? "Abrindo..." : "Abrir protocolo"}
          </button>

          {message ? <p className="text-sm text-bpPink">{message}</p> : null}
        </form>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-bpBlack">Protocolos recentes</p>
          {loading ? <span className="text-xs text-bpGraphite/65">Carregando...</span> : null}
        </div>

        <div className="mt-4 space-y-3">
          {tickets.length ? (
            tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-2xl border border-black/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-bpBlackSoft">{ticket.subject}</p>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${statusClassName(
                      ticket.status,
                      "ticket"
                    )}`}
                  >
                    {statusLabel(ticket.status, "ticket")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-bpGraphite/70">
                  Protocolo {protocolCode(ticket.id)} - aberto em {formatDateTimePtBr(ticket.created_at)}
                </p>
                <p className="mt-2 text-sm text-bpGraphite/75">{statusMessage(ticket.status, "ticket")}</p>
                <Link
                  href={`/conta/reclamacoes-suporte/${ticket.id}`}
                  className="mt-3 inline-flex rounded-full border border-black/15 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-bpGraphite"
                >
                  Ver conversa
                </Link>
              </article>
            ))
          ) : (
            <p className="text-sm text-bpGraphite/70">Nenhum protocolo aberto no momento.</p>
          )}
        </div>
      </section>
    </div>
  );
}
