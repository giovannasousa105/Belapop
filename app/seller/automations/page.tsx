"use client";

import { useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";

type Automation = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  guardrail: string;
};

const initialAutomations: Automation[] = [
  {
    id: "stock-guard",
    name: "Estoque: cobertura < 7 dias",
    description: "Dispara recomendacao de reposicao e alerta de risco de ruptura.",
    enabled: true,
    guardrail: "Nao aplica alteracao de preco automatica"
  },
  {
    id: "pause-ads-stockout",
    name: "Pausar ads em ruptura",
    description: "Quando estoque zerar, pausar campanhas ligadas ao SKU.",
    enabled: true,
    guardrail: "Mantem campanhas de branding"
  },
  {
    id: "expiry-burn",
    name: "Validade < 60 dias",
    description: "Sugerir queima inteligente com cupom e destaque.",
    enabled: true,
    guardrail: "Precisa confirmacao humana"
  },
  {
    id: "roas-optimizer",
    name: "ROAS baixo por 3 dias",
    description: "Sugere pausar campanha e realocar verba.",
    enabled: false,
    guardrail: "Nao desliga campanha manual bloqueada"
  },
  {
    id: "price-recommendation",
    name: "Preco recomendado",
    description: "Sugere ajuste por elasticidade, cobertura e concorrencia interna.",
    enabled: false,
    guardrail: "Nunca abaixo do custo informado"
  }
];

export default function SellerAutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations);

  const toggle = (id: string) => {
    setAutomations((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = !item.enabled;
        trackSellerEvent(next ? "campaign_create" : "pause", {
          automation_id: id,
          enabled: next
        });
        return { ...item, enabled: next };
      })
    );
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Automacoes</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Guardrails de operacao e crescimento</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          IA operacional sem complicar: sugestoes automaticas com limites de seguranca.
        </p>
      </section>

      <section className="grid gap-3">
        {automations.map((automation) => (
          <article key={automation.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-bpBlackSoft">{automation.name}</h2>
                <p className="mt-1 text-sm text-bpGraphite/80">{automation.description}</p>
                <p className="mt-1 text-xs text-bpGraphite/70">Guardrail: {automation.guardrail}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(automation.id)}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                  automation.enabled
                    ? "bg-emerald-100 text-emerald-700"
                    : "border border-black/20 text-bpGraphite/80"
                }`}
              >
                {automation.enabled ? "Ativa" : "Desativada"}
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Fluxos enterprise (60-120 dias)</h2>
        <ul className="mt-4 space-y-2 text-sm text-bpGraphite/80">
          <li>- Se cobertura &lt; 7 dias e venda acelera: alerta + reposicao sugerida.</li>
          <li>- Se lote &lt; 30 dias: cupom + destaque com confirmacao obrigatoria.</li>
          <li>- Se ROAS baixo 3 dias: sugerir pausa e replanejamento de verba.</li>
          <li>- Se margem pos-ads negativa: bloquear aumento automatico.</li>
          <li>- Preco recomendado com limite semanal e piso de custo.</li>
        </ul>
      </section>
    </div>
  );
}


