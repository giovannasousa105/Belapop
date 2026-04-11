"use client";

import { useMemo, useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";
import { useAuth } from "@/lib/AuthContext";

export default function SellerSupportPage() {
  const { user } = useAuth();
  const sellerId = user?.sellerProfile?.sellerId;
  const [selectedTemplate, setSelectedTemplate] = useState("delay");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const templates = {
    delay:
      "Oi! Seu pedido esta em separacao e sera despachado dentro do prazo informado. Enviaremos o codigo de rastreio em seguida.",
    exchange:
      "Oi! Podemos seguir com troca ou reembolso, conforme sua preferencia. Me confirme o numero do pedido para abrir o protocolo.",
    usage:
      "Oi! Para melhor resultado, use o produto conforme modo de uso na embalagem. Se quiser, te envio uma rotina sugerida.",
    sensitivity:
      "Oi! Sentimos pelo ocorrido. Suspenda o uso imediatamente e nos envie fotos/lote para tratativa prioritaria e seguranca."
  };

  const tickets = useMemo(
    () => [
      {
        id: "msg-1",
        orderId: "BP-9031",
        customer: "Cliente BelaPop",
        subject: "Onde esta meu pedido?",
        reason: "atraso",
        status: "pendente",
        firstResponseMin: 64,
        waitingHours: 1,
        lastMessage: "Pagamento aprovado, aguardando despacho."
      },
      {
        id: "msg-2",
        orderId: "BP-9032",
        customer: "Cliente BelaPop",
        subject: "Troca de produto com vazamento",
        reason: "troca",
        status: "em analise",
        firstResponseMin: 21,
        waitingHours: 6,
        lastMessage: "Coleta reversa solicitada."
      },
      {
        id: "msg-3",
        orderId: "BP-9034",
        customer: "Cliente BelaPop",
        subject: "Ardeu a pele apos uso",
        reason: "alergia",
        status: "urgente",
        firstResponseMin: 17,
        waitingHours: 0.4,
        lastMessage: "Cliente reporta irritacao e pede orientacao."
      },
      {
        id: "msg-4",
        orderId: "BP-9039",
        customer: "Cliente BelaPop",
        subject: "Duvida de modo de uso",
        reason: "duvida_uso",
        status: "respondido",
        firstResponseMin: 12,
        waitingHours: 0,
        lastMessage: "Template de uso enviado."
      }
    ],
    []
  );

  const metrics = useMemo(() => {
    const firstResponse = tickets.length
      ? tickets.reduce((sum, item) => sum + item.firstResponseMin, 0) / tickets.length
      : 0;
    const resolved = tickets.filter((item) => item.status === "respondido").length;
    const open = tickets.filter((item) => item.status !== "respondido").length;
    const urgent = tickets.filter((item) => item.reason === "alergia").length;
    const reasonCount = tickets.reduce<Record<string, number>>((acc, item) => {
      acc[item.reason] = (acc[item.reason] ?? 0) + 1;
      return acc;
    }, {});
    const topReasons = Object.entries(reasonCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return {
      firstResponse,
      resolutionRate: tickets.length > 0 ? (resolved / tickets.length) * 100 : 0,
      open,
      urgent,
      topReasons
    };
  }, [tickets]);

  const selectedTicket = tickets.find((item) => item.id === selectedTicketId) ?? tickets[0] ?? null;
  const isLinked = Boolean(sellerId);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Atendimento</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Inbox por pedido</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          SLA de resposta, templates prontos e tratativa sensivel para alergia/irritacao.
        </p>
        {!isLinked ? (
          <p className="mt-3 text-xs text-bpGraphite/70">
            Sua conta ainda nao esta vinculada a um seller ativo.
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Tempo 1a resposta</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{metrics.firstResponse.toFixed(0)} min</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Taxa de resolucao</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{metrics.resolutionRate.toFixed(1)}%</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Tickets abertos</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{metrics.open}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Sensivel (alergia)</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{metrics.urgent}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Impacto em reputacao</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">
            {metrics.urgent > 0 ? "Atencao" : "Estavel"}
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Templates de resposta</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: "delay", label: "Atraso" },
            { id: "exchange", label: "Troca" },
            { id: "usage", label: "Uso do produto" },
            { id: "sensitivity", label: "Alergia/irritacao" }
          ].map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelectedTemplate(template.id)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                selectedTemplate === template.id
                  ? "border-bpPink/50 bg-[#FFF4F8] text-bpBlackSoft"
                  : "border-black/20 text-bpGraphite/80"
              }`}
            >
              {template.label}
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
          <p className="text-sm text-bpGraphite/90">{templates[selectedTemplate as keyof typeof templates]}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Fila atual</h2>
        <div className="mt-4 space-y-3">
          {tickets.map((item) => (
            <article key={item.id} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-bpBlackSoft">
                  {item.subject} <span className="text-xs text-bpGraphite/70">({item.orderId})</span>
                </h3>
                <div className="flex gap-2">
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700">
                    vence em {item.waitingHours.toFixed(1)}h
                  </span>
                  {item.reason === "alergia" ? (
                    <span className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs text-rose-700">
                      sensivel
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-sm text-bpGraphite/80">{item.customer}</p>
              <p className="mt-1 text-xs text-bpGraphite/70">{item.lastMessage}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                {item.reason} | {item.status}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTicketId(item.id);
                    trackSellerEvent("respond_review", { ticket_id: item.id });
                  }}
                  className="rounded-full bg-bpBlack px-3 py-1 text-xs uppercase tracking-[0.2em] text-white"
                >
                  Responder
                </button>
                <button
                  type="button"
                  onClick={() => trackSellerEvent("alert_resolve", { ticket_id: item.id, template: selectedTemplate })}
                  className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                >
                  Resolver
                </button>
                <button
                  type="button"
                  onClick={() => trackSellerEvent("alert_snooze", { ticket_id: item.id })}
                  className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                >
                  Adiar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Ticket selecionado</h2>
          {selectedTicket ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-[#FAFAFB] p-4 text-sm text-bpGraphite/80">
              <p className="font-semibold text-bpBlackSoft">{selectedTicket.subject}</p>
              <p className="mt-1">Pedido: {selectedTicket.orderId}</p>
              <p className="mt-1">Cliente: {selectedTicket.customer}</p>
              <p className="mt-1">Ultima mensagem: {selectedTicket.lastMessage}</p>
              <p className="mt-1">Template ativo:</p>
              <p className="mt-1 rounded-xl border border-black/10 bg-white p-3">
                {templates[selectedTemplate as keyof typeof templates]}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-bpGraphite/80">Selecione um ticket para detalhar.</p>
          )}
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Principais motivos</h2>
          <div className="mt-4 space-y-2">
            {metrics.topReasons.map(([reason, count]) => (
              <div key={reason} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3 text-sm">
                <p className="font-semibold text-bpBlackSoft">{reason}</p>
                <p className="mt-1 text-xs text-bpGraphite/70">{count} tickets no periodo</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
