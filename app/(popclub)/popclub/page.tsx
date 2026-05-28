"use client";

import Link from "next/link";

import { useAuth } from "@/lib/AuthContext";
import { usePopClubStatus } from "@/hooks/usePopClubStatus";

const LEVELS = [
  {
    id: "essencial",
    name: "Essencial",
    emoji: "✦",
    threshold: 0,
    color: "bg-neutral-900",
    textColor: "text-neutral-200",
    accentColor: "border-neutral-600",
    benefits: [
      "Pontos em toda compra acima de R$ 150",
      "Acesso ao catálogo curado BelaPop",
      "Histórico de pedidos e rastreio",
      "Suporte humano no pós-compra",
      "Skin Scan — diagnóstico gratuito de pele",
    ],
    pointsRate: "R$ 1 gasto = 1 ponto",
    highlight: false,
  },
  {
    id: "premium",
    name: "Premium",
    emoji: "◈",
    threshold: 1500,
    color: "bg-[#2C1810]",
    textColor: "text-amber-200",
    accentColor: "border-amber-700",
    benefits: [
      "Tudo do Essencial, mais:",
      "Amostras premium em pedidos elegíveis",
      "Acesso antecipado a novos lotes curados",
      "Créditos de R$ 30 a cada 500 pontos",
      "Frete prioritário em pedidos acima de R$ 250",
      "Rotina personalizada mensal por e-mail",
    ],
    pointsRate: "R$ 1 gasto = 1,5 pontos",
    highlight: true,
  },
  {
    id: "luxo",
    name: "Luxo",
    emoji: "❋",
    threshold: 5000,
    color: "bg-black",
    textColor: "text-rose-200",
    accentColor: "border-rose-900",
    benefits: [
      "Tudo do Premium, mais:",
      "WhatsApp concierge exclusivo",
      "Skin Scan com relatório PDF personalizado",
      "Amostras de lançamentos antes do público",
      "Créditos de R$ 100 a cada 1.000 pontos",
      "Frete grátis em todos os pedidos",
      "Kit surpresa trimestral curado pela BelaPop",
    ],
    pointsRate: "R$ 1 gasto = 2 pontos",
    highlight: false,
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Faça sua primeira compra",
    desc: "Qualquer pedido acima de R$ 150 ativa automaticamente o seu acesso ao PopClub Essencial.",
  },
  {
    step: "02",
    title: "Acumule pontos",
    desc: "Cada real gasto vira ponto. Compre, indique amigas e complete o Skin Scan para bônus extras.",
  },
  {
    step: "03",
    title: "Suba de nível",
    desc: "Com 1.500 pontos você vira Premium. Com 5.000, é Luxo — com benefícios e créditos exclusivos.",
  },
  {
    step: "04",
    title: "Troque por créditos",
    desc: "Use seus créditos como desconto em qualquer pedido. Sem prazo de validade para resgatar.",
  },
];

const BONUS_ACTIONS = [
  { action: "Primeira compra", points: "+200 pts bônus", icon: "🛍️" },
  { action: "Completar Skin Scan", points: "+50 pts", icon: "✨" },
  { action: "Indicar uma amiga", points: "+100 pts", icon: "👯" },
  { action: "Deixar avaliação", points: "+25 pts por produto", icon: "⭐" },
  { action: "Aniversário", points: "+100 pts", icon: "🎂" },
  { action: "Compra recorrente (3x)", points: "+150 pts bônus", icon: "🔄" },
];

const TIER_EMOJI: Record<string, string> = {
  ESSENCIAL: "✦",
  PREMIUM: "◈",
  LUXO: "❋",
};

const TIER_LABEL: Record<string, string> = {
  ESSENCIAL: "Essencial",
  PREMIUM: "Premium",
  LUXO: "Luxo",
};

function MemberBanner() {
  const { user, ready } = useAuth();
  const { membro, tier, pontos_disponiveis, isLoading } = usePopClubStatus();

  if (!ready || !user) return null;
  if (isLoading) {
    return (
      <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">✦</span>
          <div className="space-y-1">
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest">PopClub</p>
            <div className="h-3 w-24 rounded bg-neutral-700 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!membro || !tier) {
    return (
      <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">✦</span>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest">PopClub</p>
            <p className="text-sm font-medium">Você ainda não é membro</p>
          </div>
        </div>
        <Link href="/catalogo" className="text-xs text-neutral-400 hover:text-white underline transition-colors">
          Ativar →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-lg">{TIER_EMOJI[tier] ?? "✦"}</span>
        <div>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
            PopClub {TIER_LABEL[tier] ?? tier}
          </p>
          <p className="text-sm font-medium">{pontos_disponiveis.toLocaleString("pt-BR")} pontos ativos</p>
        </div>
      </div>
      <Link href="/conta" className="text-xs text-neutral-400 hover:text-white underline transition-colors">
        Ver painel →
      </Link>
    </div>
  );
}

export default function PopClubPage() {
  return (
    <main className="min-h-screen pb-24">

      {/* Banner de membro (só aparece se logada) */}
      <MemberBanner />

      {/* HERO */}
      <section className="bg-black text-white px-4 pt-10 pb-16 text-center space-y-4">
        <p className="text-xs tracking-[0.3em] text-neutral-400 uppercase">PopClub</p>
        <h1 className="font-serif text-4xl leading-tight">
          Sua entrada no clube<br />é automática.
        </h1>
        <p className="text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
          Primeira compra acima de R$ 150 ativa o PopClub — pontos,
          créditos e acesso antecipado a lotes curados.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/catalogo"
            className="px-6 py-3 bg-white text-black text-xs tracking-widest rounded-xl hover:bg-neutral-100 transition-colors"
          >
            IR PARA O CATÁLOGO →
          </Link>
          <Link
            href="/conta"
            className="px-6 py-3 border border-neutral-700 text-white text-xs tracking-widest rounded-xl hover:border-neutral-400 transition-colors"
          >
            VER MEUS PONTOS
          </Link>
        </div>

        {/* Indicador de níveis */}
        <div className="flex items-center justify-center gap-2 pt-6">
          {LEVELS.map((level, i) => (
            <div key={level.id} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">{level.emoji}</span>
                <span className="text-[10px] tracking-widest text-neutral-400">{level.name.toUpperCase()}</span>
              </div>
              {i < LEVELS.length - 1 && (
                <div className="w-12 h-px bg-neutral-700 mx-1" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-4 py-10 max-w-2xl mx-auto space-y-6">
        <p className="text-xs tracking-widest text-neutral-500 uppercase text-center">Como funciona</p>
        <div className="space-y-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="flex gap-4 items-start">
              <span className="w-8 h-8 bg-black text-white text-xs font-medium rounded-full flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NÍVEIS — cards completos */}
      <section className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        <p className="text-xs tracking-widest text-neutral-500 uppercase text-center">Níveis do clube</p>
        {LEVELS.map((level) => (
          <div
            key={level.id}
            id={level.id}
            className={`${level.color} ${level.textColor} rounded-2xl p-6 space-y-4 border ${level.accentColor} ${
              level.highlight ? "ring-1 ring-amber-600" : ""
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{level.emoji}</span>
                <div>
                  <p className="font-serif text-lg">{level.name}</p>
                  <p className="text-[10px] opacity-60 uppercase tracking-widest">
                    {level.threshold === 0
                      ? "A partir do 1º pedido"
                      : `A partir de ${level.threshold.toLocaleString("pt-BR")} pontos`}
                  </p>
                </div>
              </div>
              {level.highlight && (
                <span className="px-2 py-0.5 bg-amber-600 text-white text-[9px] tracking-wider rounded-full">
                  MAIS POPULAR
                </span>
              )}
            </div>

            {/* Taxa de pontos */}
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <p className="text-xs opacity-80">{level.pointsRate}</p>
            </div>

            {/* Benefícios */}
            <ul className="space-y-2">
              {level.benefits.map((benefit, i) => (
                <li key={i} className="flex gap-2 text-xs opacity-90">
                  <span className="shrink-0 mt-0.5">
                    {i === 0 && level.id !== "essencial" ? "→" : "✓"}
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* AÇÕES BÔNUS */}
      <section className="px-4 py-10 max-w-2xl mx-auto space-y-4">
        <p className="text-xs tracking-widest text-neutral-500 uppercase text-center">Ganhe pontos extras</p>
        <div className="grid grid-cols-2 gap-3">
          {BONUS_ACTIONS.map((item) => (
            <div
              key={item.action}
              className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 space-y-2"
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="text-xs font-medium">{item.action}</p>
              <p className="text-xs text-neutral-500">{item.points}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ RÁPIDO */}
      <section className="px-4 py-4 max-w-2xl mx-auto space-y-3">
        <p className="text-xs tracking-widest text-neutral-500 uppercase">Perguntas frequentes</p>
        {[
          { q: "Os pontos expiram?", a: "Não. Seus pontos ficam ativos enquanto sua conta estiver ativa." },
          { q: "Como resgato meus créditos?", a: "Os créditos aparecem automaticamente no checkout como desconto disponível." },
          { q: "Posso indicar amigas?", a: "Sim. Compartilhe seu link de indicação na aba PopClub da sua conta e ganhe 100 pontos por cada nova cliente que fizer o primeiro pedido." },
          { q: "O nível pode diminuir?", a: "Não retroage. Uma vez que você atinge Premium ou Luxo, mantém o nível por pelo menos 12 meses." },
        ].map(({ q, a }) => (
          <details key={q} className="border border-neutral-100 rounded-xl">
            <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-neutral-50 rounded-xl">
              {q}
            </summary>
            <p className="px-4 pb-4 text-xs text-neutral-500 leading-relaxed">{a}</p>
          </details>
        ))}
      </section>

      {/* CTA FINAL */}
      <section className="px-4 py-10 max-w-2xl mx-auto">
        <div className="bg-black text-white rounded-2xl p-8 text-center space-y-4">
          <p className="font-serif text-2xl">Pronta para entrar?</p>
          <p className="text-xs text-neutral-400">
            Faça seu primeiro pedido acima de R$ 150 e o clube ativa automaticamente.
          </p>
          <Link
            href="/catalogo"
            className="inline-block px-8 py-3.5 bg-white text-black text-xs tracking-widest rounded-xl hover:bg-neutral-100 transition-colors"
          >
            EXPLORAR CATÁLOGO →
          </Link>
        </div>
      </section>

    </main>
  );
}
