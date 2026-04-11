"use client";

import { useMemo, useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";

type Severity = "critico" | "alto" | "medio";
type AlertRule = {
  id: string;
  name: string;
  severity: Severity;
  condition: string;
  window: string;
  threshold: string;
  recommendation: string;
  autoAction: string;
  escalation: string;
};

const severityClass = (severity: Severity) => {
  if (severity === "critico") return "border-rose-300 bg-rose-50 text-rose-700";
  if (severity === "alto") return "border-amber-300 bg-amber-50 text-amber-700";
  return "border-black/10 bg-white text-bpGraphite/80";
};

const initialRules: AlertRule[] = [
  {
    id: "rule-paid-stalled",
    name: "Pedido pago sem movimentacao",
    severity: "critico",
    condition: "Pedido pago sem etapa operacional",
    window: "20h",
    threshold: ">= 1 pedido",
    recommendation: "Priorizar despacho",
    autoAction: "Notificar operacao",
    escalation: "in-app + email"
  },
  {
    id: "rule-no-tracking",
    name: "Sem tracking apos envio",
    severity: "alto",
    condition: "Pedido marcado como enviado sem rastreio",
    window: "12h",
    threshold: ">= 1 pedido",
    recommendation: "Inserir tracking",
    autoAction: "Avisar time de expedicao",
    escalation: "in-app + WhatsApp"
  },
  {
    id: "rule-tracking-stalled",
    name: "Tracking parado",
    severity: "alto",
    condition: "Sem atualizacao de rastreio",
    window: "96h",
    threshold: "> 4 dias",
    recommendation: "Abrir tratativa com transportadora",
    autoAction: "Escalonar para suporte logistico",
    escalation: "in-app + email + WhatsApp"
  }
];

const recentAlerts = [
  { id: "a1", type: "Operacao", title: "8 pedidos pagos ha 20h sem movimentacao", severity: "critico", eta: "agora" },
  { id: "a2", type: "Tracking", title: "12 pedidos enviados sem codigo de rastreio", severity: "alto", eta: "12h" },
  { id: "a3", type: "Transportadora", title: "Tracking parado > 4 dias em 6 pedidos", severity: "critico", eta: "agora" },
  { id: "a4", type: "Estoque", title: "Pico de cancelamento por ruptura nas ultimas 24h", severity: "alto", eta: "agora" },
  { id: "a5", type: "Qualidade", title: "Devolucao por atraso acima da media do canal", severity: "alto", eta: "agora" }
] as const;

const alertTaxonomy = [
  { type: "Operacao", examples: "Pagamento sem movimentacao, SLA vencendo, aguardando confirmacao" },
  { type: "Tracking", examples: "Sem tracking apos envio, tracking parado > 3 dias" },
  { type: "Transportadora", examples: "Atraso acima da media, extravio, tentativa frustrada" },
  { type: "Estoque", examples: "Ruptura, cancelamento por falta de estoque, cobertura critica" },
  { type: "Devolucao", examples: "Devolucao por atraso, qualidade ou endereco invalido" },
  { type: "Financeiro", examples: "Reembolso por atraso, chargeback, divergencia de repasse" }
];

export default function SellerAlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [form, setForm] = useState<AlertRule>({
    id: "",
    name: "",
    severity: "medio",
    condition: "",
    window: "24h",
    threshold: "",
    recommendation: "",
    autoAction: "",
    escalation: "in-app"
  });

  const severities = useMemo(() => {
    return {
      critico: rules.filter((rule) => rule.severity === "critico").length,
      alto: rules.filter((rule) => rule.severity === "alto").length,
      medio: rules.filter((rule) => rule.severity === "medio").length
    };
  }, [rules]);

  const createRule = () => {
    if (!form.name || !form.condition || !form.threshold) return;
    const next: AlertRule = {
      ...form,
      id: `rule-${Date.now().toString(36)}`
    };
    setRules((current) => [next, ...current]);
    trackSellerEvent("alert_rule_create", { rule_name: form.name, severity: form.severity });
    setForm({
      id: "",
      name: "",
      severity: "medio",
      condition: "",
      window: "24h",
      threshold: "",
      recommendation: "",
      autoAction: "",
      escalation: "in-app"
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Centro de alertas</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Alertas configuraveis e auditaveis</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Condicao + janela + threshold + escalonamento, com trilha de acao no painel.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Critico</p>
          <p className="mt-2 text-2xl font-semibold text-rose-700">{severities.critico}</p>
        </article>
        <article className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Alto</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{severities.alto}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Medio</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{severities.medio}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Alertas ativos</h2>
          <div className="mt-4 space-y-2">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-bpBlackSoft">{alert.title}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${severityClass(alert.severity as Severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-bpGraphite/70">
                  {alert.type} | janela: {alert.eta}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => trackSellerEvent("alert_resolve", { alert_id: alert.id })}
                    className="rounded-full bg-bpBlack px-3 py-1 text-xs uppercase tracking-[0.2em] text-white"
                  >
                    Resolver
                  </button>
                  <button
                    type="button"
                    onClick={() => trackSellerEvent("alert_snooze", { alert_id: alert.id })}
                    className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                  >
                    Adiar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Criar regra</h2>
          <div className="mt-4 grid gap-2">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome da regra" className="rounded-2xl border border-black/10 px-3 py-2 text-sm" />
            <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value as Severity })} className="rounded-2xl border border-black/10 px-3 py-2 text-sm">
              <option value="critico">Critico</option>
              <option value="alto">Alto</option>
              <option value="medio">Medio</option>
            </select>
            <input value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })} placeholder="Condicao" className="rounded-2xl border border-black/10 px-3 py-2 text-sm" />
            <input value={form.window} onChange={(event) => setForm({ ...form, window: event.target.value })} placeholder="Janela (24h, 7d)" className="rounded-2xl border border-black/10 px-3 py-2 text-sm" />
            <input value={form.threshold} onChange={(event) => setForm({ ...form, threshold: event.target.value })} placeholder="Threshold (< 7 dias, > 20%)" className="rounded-2xl border border-black/10 px-3 py-2 text-sm" />
            <input value={form.recommendation} onChange={(event) => setForm({ ...form, recommendation: event.target.value })} placeholder="Acao recomendada" className="rounded-2xl border border-black/10 px-3 py-2 text-sm" />
            <input value={form.autoAction} onChange={(event) => setForm({ ...form, autoAction: event.target.value })} placeholder="Acao automatica (opcional)" className="rounded-2xl border border-black/10 px-3 py-2 text-sm" />
            <input value={form.escalation} onChange={(event) => setForm({ ...form, escalation: event.target.value })} placeholder="Escalonamento (email/whatsapp/in-app)" className="rounded-2xl border border-black/10 px-3 py-2 text-sm" />
            <button type="button" onClick={createRule} className="rounded-2xl bg-bpBlack px-4 py-2 text-xs uppercase tracking-[0.2em] text-white">
              Criar regra
            </button>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Tipos de alerta (severidade)</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {alertTaxonomy.map((row) => (
            <article key={row.type} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
              <h3 className="text-lg font-semibold text-bpBlackSoft">{row.type}</h3>
              <p className="mt-2 text-sm text-bpGraphite/80">{row.examples}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Regras cadastradas</h2>
        <div className="mt-4 space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-bpBlackSoft">{rule.name}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${severityClass(rule.severity)}`}>
                  {rule.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-bpGraphite/70">
                {rule.condition} | janela {rule.window} | threshold {rule.threshold}
              </p>
              <p className="mt-1 text-xs text-bpGraphite/70">
                recomendacao: {rule.recommendation || "-"} | autoacao: {rule.autoAction || "-"} | escalonamento: {rule.escalation}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
