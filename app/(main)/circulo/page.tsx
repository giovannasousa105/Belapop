import type { Metadata } from "next";
import Link from "next/link";

import { CirculoForm } from "@/components/circulo/CirculoForm";

export const metadata: Metadata = {
  title: "O Círculo BelaPop — Acesso a drops curados de skincare coreano",
  description:
    "Um espaço fechado para quem trata a pele como decisão. Drops quinzenais com lote rastreado, curadoria clínica e atendimento humano.",
  openGraph: {
    title: "O Círculo BelaPop",
    description: "Drops quinzenais de skincare coreano, curadoria por tipo de pele e acesso antecipado ao app.",
    url: "https://belapopoficial.com.br/circulo",
    siteName: "BelaPop",
    images: [{ url: "/og-circulo.jpg", width: 1200, height: 630, alt: "O Círculo BelaPop" }],
    locale: "pt_BR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

// ── Componentes de seção ──────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 py-20 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bpGraphite/50">
        Círculo BelaPop
      </p>
      <h1
        style={{ fontFamily: "var(--font-playfair, serif)" }}
        className="text-4xl leading-tight text-bpBlack sm:text-5xl"
      >
        Um espaço fechado para quem trata a pele como decisão.
      </h1>
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-bpGraphite/70">
        Drops quinzenais de skincare coreano. Lote rastreado, quantidade limitada,
        curadoria por tipo de pele. Acesso exclusivo pelo WhatsApp.
      </p>
      <a
        href="#inscrever"
        className="inline-block rounded-full bg-bpBlack px-8 py-3.5 text-sm font-semibold tracking-wider text-white transition-colors hover:bg-neutral-700"
      >
        Quero entrar
      </a>
    </section>
  );
}

function ComoFuncionaSection() {
  const cards = [
    {
      numero: "01",
      titulo: "Drops quinzenais",
      descricao:
        "SKUs raros do mercado coreano em pré-venda fechada. Cada drop tem lote rastreado, quantidade máxima definida e janela de compra de 48h. Sem reposição.",
    },
    {
      numero: "02",
      titulo: "Curadoria por tipo de pele",
      descricao:
        "Cada drop traz indicações segmentadas pela sua principal preocupação — acne, manchas, barreira, firmeza. Você recebe o que é relevante para você.",
    },
    {
      numero: "03",
      titulo: "Acesso antecipado ao app",
      descricao:
        "Membros do Círculo recebem o Skin Scan e o Skin Copilot antes do lançamento público. Sua rotina evoluindo com a plataforma, não depois dela.",
    },
  ];

  return (
    <section className="border-t border-neutral-100 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <p className="mb-10 text-[11px] font-semibold uppercase tracking-[0.22em] text-bpGraphite/40">
          Como funciona
        </p>
        <div className="grid gap-8 sm:grid-cols-3">
          {cards.map((card) => (
            <div key={card.numero} className="space-y-3">
              <span className="text-2xl font-light text-bpPink">{card.numero}</span>
              <h3 className="text-sm font-semibold text-bpBlack">{card.titulo}</h3>
              <p className="text-xs leading-relaxed text-bpGraphite/70">{card.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GarantiasSection() {
  const selos = [
    { icon: "◆", texto: "Autenticidade garantida com lote rastreado" },
    { icon: "◇", texto: "Pagamento processado via Stripe" },
    { icon: "○", texto: "Envio com rastreio em todas as entregas" },
    { icon: "◎", texto: "Troca ou devolução em até 30 dias" },
    { icon: "✦", texto: "Atendimento humano pelo WhatsApp" },
  ];

  return (
    <section className="bg-bpOffWhite py-14">
      <div className="mx-auto max-w-4xl px-4">
        <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-bpGraphite/40">
          Garantias
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selos.map((selo) => (
            <div
              key={selo.texto}
              className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5"
            >
              <span className="mt-0.5 shrink-0 text-bpPink">{selo.icon}</span>
              <span className="text-xs leading-relaxed text-bpGraphite/80">{selo.texto}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EtiquetaSection() {
  const regras = [
    "Este é um espaço de curadoria, não de vendas. Não comercialize produtos adquiridos nos drops.",
    "Sem encaminhamentos de mensagens de outros grupos ou canais.",
    "Respeito mútuo é a única regra inegociável. Qualquer comportamento desrespeitoso resulta em remoção.",
    "Perguntas técnicas sobre produtos são bem-vindas. Diagnósticos médicos, não.",
    "Os drops têm quantidade limitada. Não haverá exceções ao prazo de compra.",
    "Ao entrar no grupo, você confirma que leu e concorda com estas regras.",
  ];

  return (
    <section className="border-t border-neutral-100 py-16">
      <div className="mx-auto max-w-3xl px-4 space-y-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bpGraphite/40">
          Etiqueta do grupo
        </p>
        <ol className="space-y-3">
          {regras.map((regra, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 text-[11px] font-semibold text-bpPink/60 tabular-nums mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-xs leading-relaxed text-bpGraphite/80">{regra}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FaqSection() {
  const perguntas = [
    {
      q: "Com que frequência chegam os drops?",
      a: "A cada 15 dias, sempre com 48h de janela de compra. Você será avisada pelo WhatsApp antes da abertura.",
    },
    {
      q: "Qual o ticket médio esperado por drop?",
      a: "Entre R$ 80 e R$ 350 por item, dependendo da categoria e marca. Cada drop tem SKUs em faixas diferentes para diferentes momentos de investimento.",
    },
    {
      q: "Quais são as formas de pagamento?",
      a: "Cartão de crédito, débito e Pix, processados via Stripe. Parcelamento em até 3x sem juros para compras acima de R$ 200.",
    },
    {
      q: "Posso cancelar minha participação?",
      a: "Sim. O Círculo não tem mensalidade — você compra apenas quando quiser. Para sair do grupo do WhatsApp, basta solicitar via atendimento ou pelo link de cancelamento no e-mail.",
    },
    {
      q: "Qual a política de devolução?",
      a: "30 dias a contar da entrega, desde que o produto esteja lacrado e sem uso. Reembolso integral via Stripe. Saiba mais em nossa política de trocas e devoluções.",
    },
    {
      q: "Como meus dados são tratados?",
      a: "Seus dados são usados exclusivamente para comunicações do Círculo BelaPop, conforme a LGPD. Você pode cancelar a qualquer momento pelo link no e-mail de boas-vindas ou solicitando via atendimento.",
    },
  ];

  return (
    <section className="border-t border-neutral-100 py-16">
      <div className="mx-auto max-w-3xl px-4 space-y-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bpGraphite/40">
          Perguntas frequentes
        </p>
        <div className="space-y-1">
          {perguntas.map((item, i) => (
            <details
              key={i}
              className="group border-b border-neutral-100 py-4"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-bpBlack list-none">
                {item.q}
                <span className="shrink-0 text-bpGraphite/40 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-bpGraphite/70">
                {item.a}
              </p>
            </details>
          ))}
        </div>
        <p className="text-[11px] text-bpGraphite/40">
          Dúvidas não respondidas aqui?{" "}
          <Link href="/contato" className="underline hover:text-bpPink">
            Fale com o atendimento.
          </Link>
        </p>
      </div>
    </section>
  );
}

function FormSection({ id }: { id?: string }) {
  return (
    <section id={id} className="border-t border-neutral-100 py-16 scroll-mt-20">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bpGraphite/40">
            Inscrição
          </p>
          <p className="text-sm leading-relaxed text-bpGraphite/60">
            Preencha os dados abaixo. Você receberá uma confirmação por e-mail
            e WhatsApp em até 5 minutos.
          </p>
        </div>
        <CirculoForm tone="light" source="circulo_page" />
        <p className="text-center text-[10px] text-bpGraphite/40">
          Ao se inscrever, você concorda com nossa{" "}
          <Link href="/aviso-de-privacidade" className="underline">
            Política de Privacidade
          </Link>
          . Seus dados não são vendidos ou compartilhados com terceiros.
        </p>
      </div>
    </section>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CirculoPage() {
  return (
    <main>
      <HeroSection />
      <ComoFuncionaSection />
      <GarantiasSection />
      <EtiquetaSection />
      <FaqSection />
      <FormSection id="inscrever" />
    </main>
  );
}
