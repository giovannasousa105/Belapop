"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";
import { formatDateTimePtBr, statusClassName, statusLabel, statusMessage } from "@/lib/customer/portal";
import {
  getCustomerSupportTicket,
  postCustomerSupportTicketMessage
} from "@/lib/customer/api";

type TicketRow = {
  id: string;
  status: string;
  subject: string;
  created_at: string;
  order_id?: string | null;
  seller_id?: string | null;
  reason?: string | null;
  desired_resolution?: string | null;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  sender_role: string;
  message: string;
  created_at: string;
};

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = String(params?.ticketId ?? "");
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !ticketId) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const payload = await getCustomerSupportTicket(ticketId);
        if (!active) return;
        setTicket({
          id: payload.ticket_id,
          status: payload.status,
          subject: `${payload.reason} - ${payload.protocol}`,
          created_at: payload.created_at,
          order_id: payload.order_id,
          seller_id: payload.seller_id,
          reason: payload.reason,
          desired_resolution: payload.desired_resolution
        });
        setMessages(
          payload.messages.map((message) => ({
            id: message.message_id,
            ticket_id: payload.ticket_id,
            sender_role: message.sender_type.toLowerCase(),
            message: message.text,
            created_at: message.sent_at
          }))
        );
      } catch {
        if (active) {
          setTicket(null);
          setMessages([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [ticketId, user]);

  const parsedSummary = useMemo(() => {
    if (!ticket) return null;
    return {
      order_id: ticket.order_id ?? "-",
      seller_id: ticket.seller_id ?? "-",
      reason: ticket.reason ?? "-",
      desired_resolution: ticket.desired_resolution ?? "-"
    };
  }, [ticket]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !ticket || !text.trim()) return;
    setSending(true);
    setNotice(null);
    try {
      const data = await postCustomerSupportTicketMessage(ticket.id, { text: text.trim() });
      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id,
          ticket_id: ticket.id,
          sender_role: data.sender_type.toLowerCase(),
          message: data.text,
          created_at: data.sent_at
        }
      ]);
      setText("");
      setNotice("Mensagem enviada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Nao foi possivel enviar.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
        Carregando protocolo...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
        Protocolo nao encontrado.
      </div>
    );
  }

  return (
    <div className="grid gap-4 pb-8 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Resumo do protocolo</p>
        <p className="mt-2 text-lg font-semibold text-bpBlack">{ticket.subject}</p>
        <p className="mt-1 text-xs text-bpGraphite/70">Aberto em {formatDateTimePtBr(ticket.created_at)}</p>
        <span
          className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${statusClassName(
            ticket.status,
            "ticket"
          )}`}
        >
          {statusLabel(ticket.status, "ticket")}
        </span>
        <p className="mt-3 text-sm text-bpGraphite/75">{statusMessage(ticket.status, "ticket")}</p>
        <p className="mt-4 text-sm text-bpGraphite/75">SLA: resposta inicial em ate 24h.</p>

        {parsedSummary ? (
          <div className="mt-4 space-y-2 rounded-2xl border border-black/10 bg-bpOffWhite/70 p-4 text-sm text-bpGraphite/80">
            <p>
              <strong>Pedido:</strong> {String(parsedSummary.order_id ?? "-")}
            </p>
            <p>
              <strong>Lojista:</strong> {String(parsedSummary.seller_id ?? "-")}
            </p>
            <p>
              <strong>Motivo:</strong> {String(parsedSummary.reason ?? "-")}
            </p>
            <p>
              <strong>Resolucao:</strong> {String(parsedSummary.desired_resolution ?? "-")}
            </p>
          </div>
        ) : null}
      </aside>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-bpBlack">Conversa</p>
        <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-black/10 bg-bpOffWhite/60 p-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm ${
                message.sender_role === "customer"
                  ? "ml-auto border-bpPink/30 bg-bpPink/10 text-bpBlack"
                  : "border-black/10 bg-white text-bpGraphite/85"
              }`}
            >
              <p className="whitespace-pre-line">{message.message}</p>
              <p className="mt-2 text-[11px] text-bpGraphite/60">{formatDateTimePtBr(message.created_at)}</p>
            </article>
          ))}
        </div>

        <form onSubmit={handleSend} className="mt-4 space-y-3">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Escreva sua mensagem"
            className="min-h-[110px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-full border border-bpPink/50 bg-bpPink px-5 py-2 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
          {notice ? <p className="text-sm text-bpPink">{notice}</p> : null}
        </form>
      </section>
    </div>
  );
}
