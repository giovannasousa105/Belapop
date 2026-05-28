import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { ExternalLink, Mail, MessageSquare, Repeat2, Star } from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { AdminTable } from "@/components/adm/AdminTable";
import {
  CRMTemplateEditor,
  LifecycleRuleCard,
  PostPurchaseMessagePreview,
  RebuyReminderCard,
} from "@/components/lifecycle";
import {
  dailyLifecycleProcessor,
  getComplementaryRecommendations,
  mockLifecycleCustomers,
  mockLifecycleOrders,
  mockLifecycleRules,
  mockLifecycleTemplates,
  mockPostPurchaseMessages,
  mockRecommendationCatalog,
  mockRebuyReminders,
  mockReviewRequests,
} from "@/lib/lifecycle/postPurchase";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

type KpiCell = {
  label: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
};

function CrmKpiCell({ label, value, desc, icon }: KpiCell) {
  return (
    <div className="flex flex-col gap-1 bg-white p-5">
      <span className="mb-1 text-[20px]" aria-hidden="true">{icon}</span>
      <p
        className={`${cormorant.className} text-[32px] font-medium leading-none tracking-[-0.02em] text-[#1A1714]`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
      <p className="text-[12px] font-semibold text-[#1A1714]">{label}</p>
      <p className="text-[11px] leading-snug text-[#9E9589]">{desc}</p>
    </div>
  );
}

const touchpoints = [
  { day: "D+0", type: "transacional", title: "Guia de uso após pedido confirmado", channels: ["email"] },
  { day: "D+0", type: "transacional", title: "Reforço de uso quando pedido é enviado", channels: ["email", "whatsapp"] },
  { day: "D+2", type: "transacional", title: "Check-in 2 dias após entrega", channels: ["email", "whatsapp"] },
  { day: "D+7", type: "marketing", title: "Recomendação complementar", channels: ["email", "whatsapp"] },
  { day: "D+21", type: "marketing", title: "Convite para avaliação real", channels: ["email", "whatsapp"] },
  { day: "D+30", type: "marketing", title: "Lembrete de recompra por categoria", channels: ["email", "whatsapp"] },
  { day: "D+60", type: "marketing", title: "Cliente sem recompra", channels: ["email", "whatsapp"] },
];

function ChannelChip({ channel }: { channel: string }) {
  if (channel === "email") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
        <Mail className="h-2.5 w-2.5" strokeWidth={2} />
        Email
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
      <MessageSquare className="h-2.5 w-2.5" strokeWidth={2} />
      WhatsApp
    </span>
  );
}

export function PostPurchaseCrmPage() {
  const processor = dailyLifecycleProcessor();
  const allMessages = [...mockPostPurchaseMessages, ...processor.messages];
  const deliveredWithoutFollowUp = mockLifecycleOrders.filter(
    (order) =>
      order.status === "delivered" &&
      !allMessages.some(
        (msg) => msg.orderId === order.id && msg.messageType === "delivery_follow_up"
      )
  );
  const customersEligibleForRebuy = mockRebuyReminders.filter(
    (r) => new Date(r.remindAt) <= new Date("2026-05-08T12:00:00.000Z")
  );
  const pendingReviews = mockReviewRequests.filter((r) => r.status === "pending");
  const customersWithoutRebuy = mockLifecycleCustomers.filter((c) => {
    if (!c.lastPurchaseAt) return false;
    return (
      Math.floor(
        (Date.parse("2026-05-08T12:00:00.000Z") - Date.parse(c.lastPurchaseAt)) / 86_400_000
      ) >= 60
    );
  });
  const generatedRecommendations = mockLifecycleOrders.flatMap((order) => {
    const customer = mockLifecycleCustomers.find((c) => c.id === order.customerId);
    return getComplementaryRecommendations(order, customer?.skinProfile, mockRecommendationCatalog).map((p) => ({
      ...p,
      orderId: order.id,
      customerName: customer?.name ?? "Cliente BelaPop",
    }));
  });

  const kpis: KpiCell[] = [
    {
      label: "Mensagens Criadas",
      value: String(processor.messagesCreated),
      desc: "Geradas pelo processor diário",
      icon: <Mail className="h-5 w-5 text-[#8B5E3C]" strokeWidth={1.8} />,
    },
    {
      label: "Elegíveis Recompra",
      value: String(customersEligibleForRebuy.length),
      desc: "Janela 30/45/60 dias",
      icon: <Repeat2 className="h-5 w-5 text-[#10B981]" strokeWidth={1.8} />,
    },
    {
      label: "Avaliações Pendentes",
      value: String(pendingReviews.length),
      desc: "Convites sem resposta",
      icon: <Star className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.8} />,
    },
    {
      label: "Recomendações",
      value: String(generatedRecommendations.length),
      desc: "Por Skin Scan e bundle",
      icon: <span className="text-[18px]">✦</span>,
    },
    {
      label: "Sem Recompra",
      value: String(customersWithoutRebuy.length),
      desc: "Acima da janela de recompra",
      icon: <span className="text-[18px]">⚠</span>,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <FinanceSidebar activeHref="/adm/relacionamento/pos-compra" />

      <main className="pl-[220px]">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/90 px-10 py-5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
                Módulo Relacionamento
              </p>
              <h1 className={`${cormorant.className} text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#1A1714]`}>
                CRM Pós-compra
              </h1>
            </div>
            <Link
              href="/api/internal/jobs/process-customer-lifecycle"
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(139,94,60,0.20)] bg-white px-4 py-2 text-[11px] font-semibold text-[#8B5E3C] transition-colors hover:bg-[rgba(139,94,60,0.04)]"
            >
              Ver job interno
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </header>

        <div className="px-10 py-8 space-y-7">
          {/* Hero editorial */}
          <section className="relative overflow-hidden rounded-2xl bg-[#1A1714] px-10 py-10">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 80% 50%, rgba(201,149,106,0.14) 0%, transparent 60%)",
              }}
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
              CRM, recompra e cuidado continuado
            </p>
            <h2
              className={`${cormorant.className} relative mt-4 max-w-2xl text-[32px] font-medium leading-snug tracking-[-0.01em] text-[#F0EBE3]`}
            >
              A experiência não termina no checkout. Ela vira rotina, acompanhamento e recompra com critério.
            </h2>
            <p className="relative mt-4 max-w-xl text-[13px] leading-7 text-white/55">
              Este painel prepara email, WhatsApp e push/in-app para fluxos transacionais e de marketing,
              respeitando consentimento e evitando duplicidade por messageId.
            </p>
            <div className="relative mt-6 flex gap-3">
              <span className="rounded-xl border border-white/12 bg-white/8 px-4 py-2.5 text-[12px] text-white/70">
                Transacional: guia de uso e acompanhamento de entrega.
              </span>
              <span className="rounded-xl border border-white/12 bg-white/8 px-4 py-2.5 text-[12px] text-white/70">
                Marketing: complemento, recompra e avaliação real com opt-out.
              </span>
            </div>
          </section>

          {/* KPI Strip */}
          <section
            className="overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] shadow-[0_4px_16px_rgba(28,26,24,0.04)]"
            style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1px", background: "rgba(139,94,60,0.08)" }}
          >
            {kpis.map((kpi) => (
              <CrmKpiCell key={kpi.label} {...kpi} />
            ))}
          </section>

          {/* Lifecycle Timeline */}
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
              Régua de Lifecycle
            </p>
            <h2 className={`${cormorant.className} mb-5 text-[22px] font-medium text-[#1A1714]`}>
              Touchpoints D+0 a D+60
            </h2>
            <div className="space-y-2">
              {touchpoints.map((tp, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl border border-[rgba(139,94,60,0.10)] bg-white px-5 py-3.5"
                >
                  {/* Day marker */}
                  <span
                    className={`${cormorant.className} w-10 shrink-0 text-[18px] font-semibold text-[#8B5E3C]`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {tp.day}
                  </span>
                  {/* Type badge */}
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
                      tp.type === "transacional"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-[rgba(139,94,60,0.10)] text-[#8B5E3C]"
                    }`}
                  >
                    {tp.type}
                  </span>
                  {/* Title */}
                  <p className="flex-1 text-[13px] font-medium text-[#1A1714]">{tp.title}</p>
                  {/* Channels */}
                  <div className="flex shrink-0 gap-1.5">
                    {tp.channels.map((ch) => (
                      <ChannelChip key={ch} channel={ch} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Template Editor + Preview */}
          <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <CRMTemplateEditor templates={mockLifecycleTemplates} />
            <div className="space-y-4">
              {mockLifecycleTemplates.slice(0, 2).map((template) => (
                <PostPurchaseMessagePreview key={template.id} item={template} />
              ))}
            </div>
          </section>

          {/* Lifecycle Rule Cards */}
          <section>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
              Regras Ativas
            </p>
            <div className="grid gap-4 xl:grid-cols-5">
              {mockLifecycleRules.map((rule) => (
                <LifecycleRuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          </section>

          {/* Communication history */}
          <section>
            <div className="mb-5 flex items-end justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
                  Histórico de Comunicações
                </p>
                <h2 className={`${cormorant.className} mt-1 text-[22px] font-medium text-[#1A1714]`}>
                  Mensagens enviadas e agendadas
                </h2>
              </div>
              <Link
                href="/adm/relacionamento/clientes"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B5E3C] underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                Ver clientes
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
              <AdminTable
                rows={allMessages.slice(0, 8)}
                rowKey={(msg) => msg.id}
                columns={[
                  {
                    id: "mensagem",
                    label: "Mensagem",
                    render: (msg) => (
                      <div>
                        <p className="font-semibold text-[#1A1714]">{msg.subject ?? msg.templateId}</p>
                        <p className="mt-0.5 text-[11px] text-[#9E9589]">
                          {msg.messageType} · {msg.channel}
                        </p>
                      </div>
                    ),
                  },
                  {
                    id: "cliente",
                    label: "Cliente",
                    render: (msg) =>
                      mockLifecycleCustomers.find((c) => c.id === msg.customerId)?.name ??
                      msg.customerId,
                  },
                  {
                    id: "status",
                    label: "Status",
                    render: (msg) => (
                      <span className="rounded-full border border-[rgba(139,94,60,0.14)] bg-[#F4F1EE] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B5E54]">
                        {msg.status}
                      </span>
                    ),
                  },
                  {
                    id: "agendamento",
                    label: "Agendamento",
                    render: (msg) => formatDate(msg.sentAt ?? msg.scheduledAt),
                  },
                ]}
              />
            </div>
          </section>

          {/* Rebuy + Fila operacional */}
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              {customersEligibleForRebuy.slice(0, 2).map((reminder) => (
                <RebuyReminderCard key={reminder.id} reminder={reminder} />
              ))}
            </div>

            <div className="rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-6 shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
                Fila Operacional
              </p>
              <h2 className={`${cormorant.className} mt-1 text-[22px] font-medium text-[#1A1714]`}>
                Pontos de atenção do dia
              </h2>
              <div className="mt-5 space-y-3">
                <p className="rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
                  {deliveredWithoutFollowUp.length} pedido(s) entregues sem acompanhamento de 2 dias.
                </p>
                <p className="rounded-xl border border-[rgba(139,94,60,0.14)] bg-[#F4F1EE] px-4 py-3 text-[13px] text-[#1A1714]">
                  {pendingReviews.length} produto(s) aguardam convite de avaliação real.
                </p>
                <p className="rounded-xl border border-[rgba(139,94,60,0.14)] bg-[#F4F1EE] px-4 py-3 text-[13px] text-[#9E9589]">
                  WhatsApp respeita opt-in; marketing por email respeita consentimento e descadastro.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
