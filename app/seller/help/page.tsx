import Link from "next/link";

const playbooks = [
  {
    title: "Playbook de SLA",
    description: "Como separar, embalar e despachar dentro do prazo sem aumentar custo.",
    href: "/seller/orders"
  },
  {
    title: "Playbook de ruptura",
    description: "Processo para reposicao e pausa automatica de anuncios criticos.",
    href: "/seller/inventory"
  },
  {
    title: "Playbook de margem",
    description: "Checklist para ajustar preco, taxa e campanha mantendo rentabilidade.",
    href: "/seller/finance"
  }
];

const roadmap = [
  {
    phase: "Fase 1 (Semanas 1-3)",
    title: "Pedidos + SLA + excecoes",
    items: [
      "3 camadas de status (comercial, operacional, SLA)",
      "Centro de guerra de excecoes",
      "SLA inteligente configuravel por lojista",
      "Tracking e comprovante no fluxo de pedido"
    ]
  },
  {
    phase: "Fase 2 (Semanas 4-6)",
    title: "Transportadoras + metricas + score logistico",
    items: [
      "Cadastro de transportadoras (Correios, Jadlog, Melhor Envio, Total, manual)",
      "Painel por transportadora (prazo, atraso, devolucao, extravio, NPS)",
      "Score logistico 0-100 com impacto em ranking"
    ]
  },
  {
    phase: "Fase 3 (Semanas 7-10)",
    title: "Automacoes (alertas + pausas + bloqueios)",
    items: [
      "Pedido pago sem movimentacao > 20h",
      "Sem tracking 12h apos envio",
      "Tracking parado > 4 dias",
      "Pausa de anuncios em ruptura"
    ]
  },
  {
    phase: "Fase 4 (Semanas 11-16)",
    title: "Ranking logistico e hardening enterprise",
    items: [
      "Ranking de busca sensivel ao desempenho logistico",
      "Auditoria imutavel de alteracoes",
      "Politica publica de performance para lojistas",
      "Disputas financeiras e relatarios auditaveis"
    ]
  }
];

export default function SellerHelpPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Central do vendedor</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Ajuda e playbooks</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Guias de operacao para executar com padrao premium e previsibilidade.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {playbooks.map((item) => (
          <article key={item.title} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-bpBlackSoft">{item.title}</h2>
            <p className="mt-2 text-sm text-bpGraphite/80">{item.description}</p>
            <Link href={item.href} className="mt-4 inline-flex rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-bpBlackSoft">
              Abrir modulo
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Roadmap 60-120 dias</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {roadmap.map((phase) => (
            <article key={phase.phase} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">{phase.phase}</p>
              <h3 className="mt-2 text-lg font-semibold text-bpBlackSoft">{phase.title}</h3>
              <ul className="mt-2 space-y-1 text-sm text-bpGraphite/80">
                {phase.items.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Ponto estrategico</h2>
        <p className="mt-3 text-sm text-bpGraphite/85">
          Como cada lojista envia, a reputacao do marketplace depende de monitoramento de SLA, regras claras, logs auditaveis e politica publica de desempenho.
        </p>
      </section>
    </div>
  );
}
