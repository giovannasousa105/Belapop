"use client";

import type { ReactNode } from "react";
import {
  BadgeCheck,
  CreditCard,
  Headset,
  RotateCcw,
  Truck
} from "lucide-react";

type PromiseVariant = "home" | "product" | "checkout";

type PromiseItem = {
  title: string;
  body: string;
  icon: ReactNode;
};

const HOME_ITEMS: PromiseItem[] = [
  {
    title: "Frete calculado antes do pagamento",
    body: "Cotacao server-side por seller, com prazo consolidado antes de iniciar o checkout.",
    icon: <Truck className="h-4 w-4" aria-hidden="true" />
  },
  {
    title: "Troca e devolucao com protocolo",
    body: "Cada pedido pode abrir fluxo com protocolo, trilha de atendimento e janela clara por subpedido.",
    icon: <RotateCcw className="h-4 w-4" aria-hidden="true" />
  },
  {
    title: "Suporte com SLA visivel",
    body: "Atendimento com historico in-app, atualizacao por protocolo e escalonamento operacional.",
    icon: <Headset className="h-4 w-4" aria-hidden="true" />
  },
  {
    title: "Pagamentos mostrados conforme disponibilidade real",
    body: "A oferta de pagamento segue os metodos ativos da conta conectada e a validacao do backend.",
    icon: <CreditCard className="h-4 w-4" aria-hidden="true" />
  }
];

const PRODUCT_ITEMS: PromiseItem[] = [
  {
    title: "Frete por origem do lojista",
    body: "Prazo e servico entram no checkout a partir da origem real de cada seller.",
    icon: <Truck className="h-4 w-4" aria-hidden="true" />
  },
  {
    title: "Troca e devolucao rastreaveis",
    body: "Abertura por protocolo e acompanhamento do fluxo de pos-venda no painel do cliente.",
    icon: <RotateCcw className="h-4 w-4" aria-hidden="true" />
  },
  {
    title: "Suporte acompanhado",
    body: "Historico do atendimento e SLA ficam visiveis durante o pedido e no detalhe do protocolo.",
    icon: <Headset className="h-4 w-4" aria-hidden="true" />
  },
  {
    title: "Pagamento protegido",
    body: "Meios exibidos conforme disponibilidade da conta ativa e validacao do backend.",
    icon: <BadgeCheck className="h-4 w-4" aria-hidden="true" />
  }
];

const CHECKOUT_ITEMS: PromiseItem[] = [
  {
    title: "Frete consolidado antes do pagamento",
    body: "O checkout so avanca depois que a cotacao server-side fecha o total por seller e entrega um prazo observavel.",
    icon: <Truck className="h-4 w-4" aria-hidden="true" />
  },
  {
    title: "Pedido pendente antes de cobrar",
    body: "A BelaPop cria draft, subpedidos e snapshot operacional no backend antes de abrir a sessao de pagamento.",
    icon: <BadgeCheck className="h-4 w-4" aria-hidden="true" />
  },
  {
    title: "Suporte e pos-venda com protocolo",
    body: "Troca, devolucao e atendimento seguem trilha rastreavel por pedido e subpedido depois da compra.",
    icon: <Headset className="h-4 w-4" aria-hidden="true" />
  },
  {
    title: "Pagamento exibido conforme disponibilidade real",
    body: "Cartao, Pix e boleto aparecem apenas quando a sessao do Stripe confirma esses meios para este pedido.",
    icon: <CreditCard className="h-4 w-4" aria-hidden="true" />
  }
];

type OperationalPromiseBarProps = {
  variant?: PromiseVariant;
};

export function OperationalPromiseBar({ variant = "home" }: OperationalPromiseBarProps) {
  const isProduct = variant === "product";
  const isCheckout = variant === "checkout";
  const items = isProduct ? PRODUCT_ITEMS : isCheckout ? CHECKOUT_ITEMS : HOME_ITEMS;

  return (
    <div
      className={`rounded-[28px] border border-[rgba(216,160,172,0.18)] ${
        isProduct
          ? "bg-white p-5 shadow-[0_14px_34px_rgba(91,49,56,0.05)] sm:p-6"
          : isCheckout
            ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,232,234,0.62)_100%)] p-5 shadow-[0_16px_40px_rgba(91,49,56,0.06)] sm:p-7"
          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,232,234,0.52)_100%)] p-6 shadow-[0_18px_44px_rgba(91,49,56,0.05)] sm:p-8"
      }`}
    >
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-bpBlackSoft">
          {isProduct
            ? "Promessa operacional BelaPop"
            : isCheckout
              ? "Confianca operacional antes da cobranca"
              : "Entrega, troca, suporte e pagamentos"}
        </p>
        <h2
          className={`mt-3 font-display text-bpBlack ${
            isProduct
              ? "text-2xl leading-tight sm:text-3xl"
              : isCheckout
                ? "text-[2rem] leading-[1.04] sm:text-[2.5rem]"
                : "text-3xl leading-[1.02] sm:text-4xl"
          }`}
        >
          {isProduct
            ? "O que sustenta a experiencia depois da curadoria."
            : isCheckout
              ? "O checkout deixa claro o que esta garantido antes de cobrar."
              : "Promessas visiveis antes da compra. Execucao observavel depois do pedido."}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-bpGraphite/82 sm:text-base">
          {isProduct
            ? "A pagina do produto deixa claro como frete, pos-venda, suporte e pagamentos funcionam antes da decisao de compra."
            : isCheckout
              ? "Antes de abrir a sessao do Stripe, a BelaPop consolida frete, cria o pedido pendente e expõe como pagamento e pos-venda funcionam na operacao real."
              : "A BelaPop nao promete so curadoria. Ela deixa explicito como frete, troca, suporte e pagamentos se comportam na operacao real."}
        </p>
      </div>

      <div
        className={`mt-6 grid gap-3 ${
          isProduct || isCheckout ? "sm:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-[22px] border border-[rgba(216,160,172,0.16)] bg-white/90 p-4 shadow-[0_8px_20px_rgba(91,49,56,0.03)]"
          >
            <div className="flex items-center gap-3 text-bpPink">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-bpPink/25 bg-bpPinkLux/60 text-bpBlack">
                {item.icon}
              </div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-bpBlackSoft">BelaPop Ops</p>
            </div>
            <h3 className="mt-4 text-base font-semibold leading-snug text-bpBlack">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-bpGraphite/80">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
