import type { LucideIcon } from "lucide-react";
import { ChevronRight, CreditCard, Headset, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const flowSteps = [
  { id: "bag", eyebrow: "Passo 01", title: "Sacola" },
  { id: "identification", eyebrow: "Passo 02", title: "Identificacao" },
  { id: "payment", eyebrow: "Passo 03", title: "Pagamento" }
] as const;

const assuranceItems = [
  {
    icon: ShieldCheck,
    title: "Pagamento seguro",
    body: "Compra sujeita a validacoes de pagamento e antifraude."
  },
  {
    icon: Truck,
    title: "Envio com rastreio",
    body: "Prazo estimado informado apos aprovacao do pedido."
  },
  {
    icon: RotateCcw,
    title: "Troca e reembolso",
    body: "Regras visiveis antes da compra e no pos-venda."
  },
  {
    icon: CreditCard,
    title: "Seller identificado",
    body: "A BelaPop aparece como vendedora salvo aviso expresso."
  },
  {
    icon: Headset,
    title: "Suporte ao cliente",
    body: "Atendimento para pedido, entrega, reembolso e privacidade."
  }
] as const;

type FlowStepId = (typeof flowSteps)[number]["id"];

export function CommerceFlowIndicator({
  activeStep,
  className = ""
}: {
  activeStep: FlowStepId;
  className?: string;
}) {
  const activeIndex = flowSteps.findIndex((step) => step.id === activeStep);

  return (
    <nav
      aria-label="Fluxo da compra"
      className={`rounded-[28px] border border-black/8 bg-white/90 px-4 py-4 shadow-[0_18px_44px_rgba(36,31,32,0.04)] sm:px-5 ${className}`}
    >
      <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {flowSteps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <div key={step.id} className="flex min-w-fit items-center gap-3">
              <div
                className={`min-w-[156px] rounded-full border px-4 py-3 transition-colors sm:min-w-[172px] sm:px-5 sm:py-4 ${
                  isActive
                    ? "border-[#e9cfd6] bg-[#fbf1f3]"
                    : isComplete
                      ? "border-black/10 bg-[#faf7f4]"
                      : "border-black/8 bg-white"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#7e6f72]">
                  {step.eyebrow}
                </p>
                <p className="mt-1 text-sm font-medium text-[#1c1b1b] sm:text-[15px]">
                  {step.title}
                </p>
              </div>

              {index < flowSteps.length - 1 ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-black/22" aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function CommerceAssuranceStrip({
  title = "Informacoes essenciais antes de concluir",
  description = "A BelaPop deixa visivel o que sustenta seller, pagamento, entrega, pos-venda e suporte.",
  className = ""
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section
      aria-label="Sinais de confianca"
      className={`rounded-[32px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,241,242,0.74)_100%)] p-6 sm:p-8 ${className}`}
    >
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8c5d66]">
          Sinais de confianca
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight text-bpBlack sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-bpGraphite sm:text-base">{description}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {assuranceItems.map((item) => (
          <AssuranceCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

function AssuranceCard({
  body,
  icon: Icon,
  title
}: {
  body: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <article className="rounded-[24px] border border-[#ebe1e2] bg-white/92 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ecd8dc] bg-[#fcf4f5] text-[#8c5d66]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#1c1b1b]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5b5051]">{body}</p>
    </article>
  );
}
