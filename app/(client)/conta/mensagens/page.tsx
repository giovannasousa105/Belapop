"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/AuthContext";
import { formatDateTimePtBr, statusClassName, statusLabel, statusMessage } from "@/lib/customer/portal";
import {
  getCustomerSupportTicketMessages,
  getCustomerSupportTickets,
  mapTicketSummaryToLegacy,
  postCustomerSupportTicketMessage
} from "@/lib/customer/api";

type TicketRow = {
  id: string;
  status: string;
  subject: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  sender_role: string;
  message: string;
  created_at: string;
};

export default function ContaMensagensPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const ticketRows = await getCustomerSupportTickets({ page: 1, page_size: 20 });
        const localTickets = ticketRows.items.map(mapTicketSummaryToLegacy);
        const firstTicketId = localTickets[0]?.id ?? "";

        let messageRows: MessageRow[] = [];
        if (firstTicketId) {
          const ticketMessages = await getCustomerSupportTicketMessages(firstTicketId, 100);
          messageRows = ticketMessages.items.map((row) => ({
            id: row.message_id,
            ticket_id: firstTicketId,
            sender_role: row.sender_type.toLowerCase(),
            message: row.text,
            created_at: row.sent_at
          }));
        }

        if (!active) return;
        setTickets(localTickets);
        setMessages(messageRows);
        setSelectedTicketId((prev) => prev || firstTicketId);
      } catch (error) {
        if (active) {
          setNotice(error instanceof Error ? error.message : "Falha ao carregar mensagens.");
          setTickets([]);
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
  }, [user]);

  useEffect(() => {
    if (!selectedTicketId) return;
    let active = true;
    const loadMessages = async () => {
      try {
        const ticketMessages = await getCustomerSupportTicketMessages(selectedTicketId, 100);
        if (!active) return;
        setMessages(
          ticketMessages.items.map((row) => ({
            id: row.message_id,
            ticket_id: selectedTicketId,
            sender_role: row.sender_type.toLowerCase(),
            message: row.text,
            created_at: row.sent_at
          }))
        );
      } catch (error) {
        if (active) {
          setNotice(error instanceof Error ? error.message : "Falha ao carregar conversa.");
        }
      }
    };
    void loadMessages();
    return () => {
      active = false;
    };
  }, [selectedTicketId]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets]
  );

  const selectedMessages = useMemo(
    () => messages.filter((message) => message.ticket_id === selectedTicketId),
    [messages, selectedTicketId]
  );

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTicketId || !newMessage.trim()) {
      setNotice("Selecione um protocolo e escreva sua mensagem.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const data = await postCustomerSupportTicketMessage(selectedTicketId, {
        text: newMessage.trim()
      });
      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id,
          ticket_id: selectedTicketId,
          sender_role: data.sender_type.toLowerCase(),
          message: data.text,
          created_at: data.sent_at
        }
      ]);
      setNewMessage("");
      setNotice("Mensagem enviada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Nao foi possivel enviar mensagem.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Mensagens</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Central unificada</h1>
        <p className="mt-3 text-sm text-bpGraphite/75">
          Atualizacoes de suporte e comunicacoes operacionais em um unico inbox.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="px-2 text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Protocolos</p>
          <div className="mt-3 space-y-2">
            {loading ? (
              <p className="px-2 py-4 text-sm text-bpGraphite/70">Carregando...</p>
            ) : tickets.length === 0 ? (
              <p className="px-2 py-4 text-sm text-bpGraphite/70">Sem protocolos no momento.</p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    selectedTicketId === ticket.id
                      ? "border-bpPink/45 bg-bpPink/10"
                      : "border-black/10 hover:border-black/20"
                  }`}
                >
                  <p className="text-sm font-semibold text-bpBlackSoft">{ticket.subject}</p>
                  <p className="mt-1 text-xs text-bpGraphite/70">{formatDateTimePtBr(ticket.created_at)}</p>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${statusClassName(
                      ticket.status,
                      "ticket"
                    )}`}
                  >
                    {statusLabel(ticket.status, "ticket")}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          {selectedTicket ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-semibold text-bpBlack">{selectedTicket.subject}</p>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${statusClassName(
                    selectedTicket.status,
                    "ticket"
                  )}`}
                >
                  {statusLabel(selectedTicket.status, "ticket")}
                </span>
              </div>
              <p className="mt-3 text-sm text-bpGraphite/75">{statusMessage(selectedTicket.status, "ticket")}</p>

              <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto rounded-2xl border border-black/10 bg-bpOffWhite/60 p-4">
                {selectedMessages.length ? (
                  selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm ${
                        message.sender_role === "customer"
                          ? "ml-auto border-bpPink/30 bg-bpPink/10 text-bpBlack"
                          : "border-black/10 bg-white text-bpGraphite/85"
                      }`}
                    >
                      <p className="whitespace-pre-line">{message.message}</p>
                      <p className="mt-2 text-[11px] text-bpGraphite/60">{formatDateTimePtBr(message.created_at)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-bpGraphite/70">Sem mensagens neste protocolo.</p>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Digite sua mensagem para o time de suporte"
                  className="min-h-[100px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full border border-bpPink/50 bg-bpPink px-5 py-2 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
                  >
                    {saving ? "Enviando..." : "Enviar mensagem"}
                  </button>
                  {notice ? <p className="text-sm text-bpPink">{notice}</p> : null}
                </div>
              </form>
            </>
          ) : (
            <p className="text-sm text-bpGraphite/70">Selecione um protocolo para ver as mensagens.</p>
          )}
        </article>
      </section>
    </div>
  );
}
