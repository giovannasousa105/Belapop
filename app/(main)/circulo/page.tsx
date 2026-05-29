import type { Metadata } from "next";
import Link from "next/link";

import { CirculoForm } from "@/components/circulo/CirculoForm";
import { StickyMobileCTA } from "@/components/circulo/StickyMobileCTA";

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

// ── Hero ───────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-center sm:space-y-6 sm:py-20">
      {/* Badge de status — mobile first */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-bpPink/20 bg-bpPink/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-bpPink">
          <span className="h-1.5 w-1.5 rounded-full bg-bpPink animate-pulse" />
          Vagas abertas agora
        </span>
      </div>

      <h1
        style={{ fontFamily: "var(--font-playfair, serif)" }}
        className="text-[2rem] leading-tight text-bpBlack sm:text-5xl"
      >
        Um espaço fechado para quem trata a pele como decisão.
      </h1>

      <p className="mx-auto max-w-sm text-sm leading-relaxed text-bpGraphite/70 sm:max-w-xl">
        Drops quinzenais de skincare coreano. Lote rastreado, quantidade
        limitada, curadoria por tipo de pele. Acesso exclusivo pelo WhatsApp.
      </p>

      {/* CTA visível no hero — mobile proeminente */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href="#inscrever"
          className="w-full rounded-full bg-bpBlack px-8 py-4 text-sm font-semibold tracking-wider text-white transition-colors hover:bg-neutral-700 sm:w-auto sm:py-3.5"
        >
          Quero entrar no Círculo
        </a>
        <p className="text-[11px] text-bpGraphite/40 sm:hidden">
          Gratuito · Sem mensalidade
        </p>
      </div>

      {/* Prova social mínima — mobile */}
      <p className="text-[11px] text-bpGraphite/40 sm:hidden">
        Confirmação imediata por WhatsApp e e-mail.
      </p>
    </section>
  );
}

// ── Como funciona ──────────────────────────────────────────────────────────────

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
    <section className="border-t border-neutral-100 py-14 sm:py-16">
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

// ── Garantias ──────────────────────────────────────────────────────────────────

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

// ── Etiqueta ───────────────────────────────────────────────────────────────────

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
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bpGraphite/40">
          Etiqueta do grupo
        </p>
        <ol className="space-y-3">
          {regras.map((regra, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-0.5 shrink-0 text-[11px] font-semibold tabular-nums text-bpPink/60">
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

// ── FAQ ────────────────────────────────────────────────────────────────────────

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
      a: "30 dias a contar da entrega, desde que o produto esteja lacrado e sem uso. Reembolso integral via Stripe.",
    },
    {
      q: "Como meus dados são tratados?",
      a: "Seus dados são usados exclusivamente para comunicações do Círculo BelaPop, conforme a LGPD. Você pode cancelar a qualquer momento pelo link no e-mail de boas-vindas.",
    },
  ];

  return (
    <section className="border-t border-neutral-100 py-16">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bpGraphite/40">
          Perguntas frequentes
        </p>
        <div className="space-y-1">
          {perguntas.map((item, i) => (
            <details key={i} className="group border-b border-neutral-100 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-bpBlack">
                {item.q}
                <span className="shrink-0 text-bpGraphite/40 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-bpGraphite/70">{item.a}</p>
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

// ── Formulário — layout imersivo no mobile ─────────────────────────────────────

function FormSection({ id }: { id?: string }) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-t border-neutral-100 sm:border-t"
    >
      {/* Mobile: fundo escuro imersivo */}
      <div className="bg-bpBlack px-4 py-12 sm:hidden">
        <div className="mx-auto max-w-md space-y-6">
          {/* Cabeçalho mobile dentro do escuro */}
          <div className="space-y-2 text-center">
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-bpPink">
              <span className="h-1.5 w-1.5 rounded-full bg-bpPink animate-pulse" />
              Inscrição aberta
            </span>
            <h2
              style={{ fontFamily: "var(--font-playfair, serif)" }}
              className="text-2xl leading-tight text-white"
            >
              Entre para o Círculo BelaPop
            </h2>
            <p className="text-xs leading-relaxed text-white/50">
              Confirmação imediata por WhatsApp e e-mail.
              Sem mensalidade. Cancele quando quiser.
            </p>
          </div>

          {/* Prova social mínima */}
          <div className="flex items-center justify-center gap-6 text-center">
            {[
              { valor: "48h", label: "janela de compra" },
              { valor: "0", label: "mensalidade" },
              { valor: "100%", label: "curadoria clínica" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-lg font-semibold text-white">{item.valor}</p>
                <p className="text-[9px] uppercase tracking-wider text-white/40">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Formulário escuro */}
          <CirculoForm tone="dark" source="circulo_page_mobile" />

          <p className="text-center text-[10px] text-white/25">
            Ao se inscrever, você concorda com nossa{" "}
            <Link href="/aviso-de-privacidade" className="underline">
              Política de Privacidade
            </Link>
            . Seus dados não são vendidos ou compartilhados.
          </p>
        </div>
      </div>

      {/* Desktop: layout claro original */}
      <div className="hidden py-16 sm:block">
        <div className="mx-auto max-w-2xl space-y-6 px-4">
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
      </div>
    </section>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function CirculoPage() {
  return (
    <>
      <StickyMobileCTA />
      <main>
        <HeroSection />
        <ComoFuncionaSection />
        <GarantiasSection />
        <EtiquetaSection />
        <FaqSection />
        <FormSection id="inscrever" />
      </main>
    </>
  );
}
