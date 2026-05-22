import Link from "next/link";

import { AlertBanner } from "@/components/adm/AlertBanner";
import { AdminTable } from "@/components/adm/AdminTable";
import {
  CRMTemplateEditor,
  LifecycleRuleCard,
  PostPurchaseMessagePreview,
  RebuyReminderCard
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
  mockReviewRequests
} from "@/lib/lifecycle/postPurchase";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[8px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">{label}</p>
      <p className="mt-4 font-editorial text-4xl leading-none text-[var(--adm-text)]">{value}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--adm-text-soft)]">{detail}</p>
    </article>
  );
}

export function PostPurchaseCrmPage() {
  const processor = dailyLifecycleProcessor();
  const allMessages = [...mockPostPurchaseMessages, ...processor.messages];
  const deliveredWithoutFollowUp = mockLifecycleOrders.filter(
    (order) =>
      order.status === "delivered" &&
      !allMessages.some((message) => message.orderId === order.id && message.messageType === "delivery_follow_up")
  );
  const customersEligibleForRebuy = mockRebuyReminders.filter((reminder) => new Date(reminder.remindAt) <= new Date("2026-05-08T12:00:00.000Z"));
  const pendingReviews = mockReviewRequests.filter((request) => request.status === "pending");
  const customersWithoutRebuy = mockLifecycleCustomers.filter((customer) => {
    if (!customer.lastPurchaseAt) return false;
    const daysSinceLastPurchase = Math.floor(
      (Date.parse("2026-05-08T12:00:00.000Z") - Date.parse(customer.lastPurchaseAt)) / 86_400_000
    );
    return daysSinceLastPurchase >= 60;
  });
  const generatedRecommendations = mockLifecycleOrders.flatMap((order) => {
    const customer = mockLifecycleCustomers.find((item) => item.id === order.customerId);
    return getComplementaryRecommendations(order, customer?.skinProfile, mockRecommendationCatalog).map((product) => ({
      ...product,
      orderId: order.id,
      customerName: customer?.name ?? "Cliente BelaPop"
    }));
  });

  return (
    <div className="space-y-7">
      <AlertBanner
        tone="normal"
        title="Lifecycle pos-compra BelaPop"
        description="Regua automatizada para orientar uso, acompanhar entrega, recomendar complementos, lembrar recompra e coletar avaliações reais."
        actionLabel="Ver job interno"
        actionHref="/api/internal/jobs/process-customer-lifecycle"
      />

      <section className="rounded-[8px] border border-[#2f2a25] bg-[#211d1a] p-6 text-white shadow-[var(--adm-shadow-micro)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">CRM, recompra e cuidado continuado</p>
            <h1 className="mt-3 max-w-4xl font-editorial text-4xl leading-tight md:text-5xl">
              A experiencia nao termina no checkout. Ela vira rotina, acompanhamento e recompra com criterio.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68">
              Este painel prepara email, WhatsApp, SMS futuro e push/in-app para fluxos transacionais e de marketing, respeitando consentimento e evitando duplicidade por messageId.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/70">
            <p className="rounded-[8px] border border-white/12 bg-white/8 p-3">Transacional: guia de uso e acompanhamento de entrega.</p>
            <p className="rounded-[8px] border border-white/12 bg-white/8 p-3">Marketing: complemento, recompra e avaliacao real com opt-out respeitado.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Mensagens criadas" value={String(processor.messagesCreated)} detail="Geradas pelo mock processor diario, sem duplicar mensagens ja enviadas." />
        <MetricCard label="Elegiveis para recompra" value={String(customersEligibleForRebuy.length)} detail="Produtos dentro da janela 30/45/60+ dias conforme categoria." />
        <MetricCard label="Avaliacoes pendentes" value={String(pendingReviews.length)} detail="Pedidos entregues com convite para opiniao real, sem incentivo indevido." />
        <MetricCard label="Recomendacoes geradas" value={String(generatedRecommendations.length)} detail="Complementos por categoria, necessidade, bundle e Skin Scan." />
        <MetricCard label="Clientes sem recompra" value={String(customersWithoutRebuy.length)} detail="Clientes acima da janela de recompra, tratados apenas se houver consentimento." />
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {mockLifecycleRules.map((rule) => (
          <LifecycleRuleCard key={rule.id} rule={rule} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <CRMTemplateEditor templates={mockLifecycleTemplates} />
        <div className="space-y-4">
          {mockLifecycleTemplates.slice(0, 2).map((template) => (
            <PostPurchaseMessagePreview key={template.id} item={template} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">Historico de comunicacoes</p>
            <h2 className="mt-2 font-editorial text-3xl text-[var(--adm-text)]">Mensagens enviadas e agendadas</h2>
          </div>
          <Link href="/adm/relacionamento/clientes" className="text-xs font-semibold uppercase tracking-[0.16em] underline underline-offset-4">
            Ver clientes
          </Link>
        </div>
        <AdminTable
          rows={allMessages.slice(0, 8)}
          rowKey={(message) => message.id}
          columns={[
            {
              id: "mensagem",
              label: "Mensagem",
              render: (message) => (
                <div>
                  <p className="font-semibold">{message.subject ?? message.templateId}</p>
                  <p className="mt-1 text-xs text-[#6f675e]">{message.messageType} · {message.channel}</p>
                </div>
              )
            },
            {
              id: "cliente",
              label: "Cliente",
              render: (message) => mockLifecycleCustomers.find((customer) => customer.id === message.customerId)?.name ?? message.customerId
            },
            {
              id: "status",
              label: "Status",
              render: (message) => (
                <span className="rounded-full border border-black/10 bg-[#fbfaf7] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#3a342f]">
                  {message.status}
                </span>
              )
            },
            {
              id: "agendamento",
              label: "Agendamento",
              render: (message) => formatDate(message.sentAt ?? message.scheduledAt)
            }
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          {customersEligibleForRebuy.slice(0, 2).map((reminder) => (
            <RebuyReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>

        <section className="rounded-[8px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">Fila operacional</p>
          <h2 className="mt-2 font-editorial text-3xl text-[var(--adm-text)]">Pontos de atencao do dia</h2>
          <div className="mt-5 grid gap-3">
            <p className="rounded-[8px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {deliveredWithoutFollowUp.length} pedido(s) entregues sem acompanhamento de 2 dias.
            </p>
            <p className="rounded-[8px] border border-[#ded8cf] bg-[#fbfaf7] px-4 py-3 text-sm text-[#3a342f]">
              {pendingReviews.length} produto(s) aguardam convite de avaliacao real.
            </p>
            <p className="rounded-[8px] border border-[#ded8cf] bg-[#fbfaf7] px-4 py-3 text-sm text-[#3a342f]">
              WhatsApp respeita opt-in; marketing por email respeita consentimento e descadastro.
            </p>
          </div>
        </section>
      </section>
    </div>
  );
}
