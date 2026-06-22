import type { Metadata } from "next";

import { LuxuryStaticFooter } from "@/components/layout/LuxuryStaticFooter";
import { FaqSearch } from "@/components/contato/FaqSearch";
import { belapopContact, buildBelapopMailto } from "@/lib/brand/contact";

export const metadata: Metadata = {
  title: "Contato e Ajuda",
  description:
    "Tire suas dúvidas sobre compras, entrega, pagamento, trocas, PopClub e Skin Scan. Atendimento claro e ágil.",
};

const faqSections = [
  {
    title: "Compra e sellers",
    items: [
      {
        question: "Os produtos são vendidos pela BelaPop?",
        answer:
          "Sim. A BelaPop atua como plataforma e vendedora principal. Em algumas seleções, podem haver parceiros sellers identificados antes da compra. O seller responsável é sempre informado na jornada de compra antes de você finalizar."
      },
      {
        question: "Como sei quem está vendendo o produto?",
        answer:
          "O nome do seller aparece na página do produto e no resumo do pedido, antes do pagamento. Se for um parceiro, você verá a identificação dele com nome, CNPJ e condições específicas."
      },
      {
        question: "Posso comprar mais de um produto no mesmo pedido?",
        answer:
          "Sim, sem limite de itens. Produtos de sellers diferentes podem estar no mesmo pedido — o envio pode ser feito separadamente, com rastreios individuais."
      }
    ]
  },
  {
    title: "Entrega e frete",
    items: [
      {
        question: "Como funciona o frete?",
        answer:
          "O frete é calculado no carrinho com base no CEP de entrega. Oferecemos PAC e SEDEX pelos Correios. Frete grátis para compras acima de R$ 350."
      },
      {
        question: "Qual é o prazo de entrega?",
        answer:
          "Após a confirmação do pagamento, o prazo de postagem é de até 48h úteis. A entrega pelo Correios varia por região: capitais 3–7 dias úteis, interior 5–15 dias úteis após postagem."
      },
      {
        question: "Vou receber código de rastreio?",
        answer:
          "Sim. Assim que o pedido for postado, você recebe o código de rastreio por email e pode acompanhar em /rastreio ou diretamente nos Correios."
      }
    ]
  },
  {
    title: "Pagamento",
    items: [
      {
        question: "Quais formas de pagamento são aceitas?",
        answer:
          "Cartão de crédito (até 6x sem juros nos principais bandeiras), PIX (com desconto de 5%) e boleto bancário (vencimento em 3 dias úteis)."
      },
      {
        question: "É seguro comprar na BelaPop?",
        answer:
          "Sim. O checkout usa criptografia SSL e o processamento de pagamento é feito por gateway certificado PCI-DSS. Seus dados de cartão não ficam armazenados na BelaPop."
      },
      {
        question: "O pagamento pode passar por validação?",
        answer:
          "Em alguns casos, o sistema de antifraude pode solicitar validação adicional. Se isso acontecer, você será notificado por email com as próximas etapas. O prazo de validação é de até 24h."
      }
    ]
  },
  {
    title: "Trocas e devoluções",
    items: [
      {
        question: "Posso trocar ou devolver um produto?",
        answer:
          "Sim. Você tem 7 dias corridos após o recebimento para solicitar devolução por arrependimento, conforme o Código de Defesa do Consumidor. Inicie o processo em /política-de-trocas-e-devoluções ou via WhatsApp Concierge."
      },
      {
        question: "Em quanto tempo recebo o reembolso?",
        answer:
          "Após a aprovação da devolução: PIX e boleto em até 5 dias úteis. Cartão de crédito em até 2 faturas (prazo da operadora)."
      },
      {
        question: "Como solicito troca?",
        answer:
          "Acesse /conta/pedidos, selecione o pedido e clique em 'Solicitar troca/devolução'. Você receberá um protocolo e instruções por email em até 24h."
      }
    ]
  },
  {
    title: "PopClub",
    items: [
      {
        question: "O PopClub é gratuito?",
        answer:
          "Sim, completamente gratuito para todos os clientes BelaPop. Você entra automaticamente no nível Essencial na primeira compra."
      },
      {
        question: "Como acumulo pontos?",
        answer:
          "1 ponto por R$ 1 gasto em compras elegíveis no nível Essencial, 1,25 ponto no Premium e 1,5 ponto no Luxo. Kits e produtos da curadoria principal são elegíveis."
      },
      {
        question: "O que muda quando subo de nível?",
        answer:
          "A janela de acesso antecipado aumenta (24h → 48h → 72h), o multiplicador de pontos melhora, entram créditos reais (R$ 50 / R$ 120) e você ganha prioridade máxima no concierge."
      }
    ]
  },
  {
    title: "Skin Scan",
    items: [
      {
        question: "O Skin Scan é gratuito?",
        answer:
          "Sim, o Skin Scan é gratuito e ilimitado para todos os usuários. Você pode fazer quantas análises quiser."
      },
      {
        question: "Preciso me cadastrar para fazer o Skin Scan?",
        answer:
          "Não é obrigatório para fazer a análise. Mas para salvar o resultado e acompanhar sua evolução ao longo do tempo, é necessário criar uma conta gratuita."
      },
      {
        question: "O Skin Scan substitui dermatologista?",
        answer:
          "Não. O Skin Scan é uma experiência de orientação cosmética baseada em sinais visuais. Para diagnóstico de condições de pele, consulte sempre um dermatologista."
      }
    ]
  },
  {
    title: "Suporte",
    items: [
      {
        question: "Qual é o prazo de resposta do atendimento?",
        answer:
          "Email: até 24h úteis. WhatsApp Concierge: até 2h em horário comercial (seg–sex, 9h–18h). Instagram: até 48h."
      },
      {
        question: "Onde acompanho meu pedido?",
        answer:
          "Em /conta/pedidos (logado) ou em /rastreio com seu email e número de pedido, sem precisar de login."
      }
    ]
  }
] as const;

export default function ContatoPage() {
  const supportHref = buildBelapopMailto(
    belapopContact.supportEmail,
    "Atendimento BelaPop",
    "Olá, BelaPop. Preciso de atendimento sobre:"
  );

  const instagramHref = `https://instagram.com/${belapopContact.instagramHandle.replace("@", "")}`;

  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#1B1A18]">
      <main className="overflow-hidden">
        {/* Header */}
        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-xs uppercase tracking-[0.45em] text-[#C88FA3]">Contato</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] md:text-6xl">
              Fale com a BelaPop
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5F5A55] md:text-base">
              Atendimento claro, elegante e próximo.
            </p>
          </div>
        </section>

        {/* WhatsApp em destaque */}
        <section className="border-b border-[#DDD3CA] px-6 py-8 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col gap-5 rounded-2xl border border-[#1B1A18]/15 bg-[#1B1A18] px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between md:px-8 md:py-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#C88FA3]">
                  Resposta em até 2h
                </p>
                <h2 className="mt-2 font-serif text-2xl font-medium">WhatsApp Concierge</h2>
                <p className="mt-1 text-sm text-white/65">
                  Seg–Sex, 9h–18h · Pedidos, trocas, Skin Scan e dúvidas sobre rotina
                </p>
              </div>
              <a
                href="https://wa.me/5534980470367?text=Olá%2C+BelaPop.+Preciso+de+atendimento."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#1B1A18] transition hover:bg-[#F6F1EB]"
              >
                Abrir WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Canais de contato */}
        <section className="border-b border-[#DDD3CA] px-6 py-10 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <a
                href={supportHref}
                className="group rounded-2xl border border-[#DDD3CA] bg-white/80 px-5 py-5 transition hover:border-[#C88FA3]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C88FA3]">Email</p>
                <p className="mt-2 text-sm font-medium text-[#1B1A18]">{belapopContact.supportEmail}</p>
                <p className="mt-1 text-xs text-[#5F5A55]">Resposta em até 24h úteis</p>
              </a>
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-[#DDD3CA] bg-white/80 px-5 py-5 transition hover:border-[#C88FA3]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C88FA3]">Instagram</p>
                <p className="mt-2 text-sm font-medium text-[#1B1A18]">{belapopContact.instagramHandle}</p>
                <p className="mt-1 text-xs text-[#5F5A55]">Resposta em até 48h</p>
              </a>
              <a
                href="/rastreio"
                className="group rounded-2xl border border-[#DDD3CA] bg-white/80 px-5 py-5 transition hover:border-[#C88FA3]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C88FA3]">Rastreio</p>
                <p className="mt-2 text-sm font-medium text-[#1B1A18]">Acompanhe seu pedido</p>
                <p className="mt-1 text-xs text-[#5F5A55]">Sem precisar de login</p>
              </a>
            </div>
          </div>
        </section>

        {/* FAQ com busca */}
        <section className="px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px]">
            <div className="rounded-[32px] border border-[#DDD3CA] bg-[#F2E3E8] p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.35em] text-[#C88FA3]">Perguntas frequentes</p>
              <h2 className="mt-3 font-serif text-3xl text-[#1B1A18]">
                Tudo o que você precisa saber
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#5F5A55]">
                Respostas objetivas sobre compras, entrega, pagamento, trocas, PopClub e Skin Scan.
              </p>
              <div className="mt-8">
                <FaqSearch sections={faqSections as unknown as { title: string; items: { question: string; answer: string }[] }[]} />
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-6 pb-14 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px] rounded-[32px] border border-[#DDD3CA] bg-white/80 p-8">
            <h2 className="font-serif text-2xl text-[#1B1A18]">Não encontrou o que precisava?</h2>
            <p className="mt-3 text-sm leading-7 text-[#5F5A55]">
              Nossa equipe responde em até 24h úteis. Para agilizar, inclua o número do pedido ou email da compra.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="rounded-full bg-[#1B1A18] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[#3d3530]"
                href={supportHref}
              >
                Enviar e-mail
              </a>
              <a
                className="rounded-full border border-[#DDD3CA] px-6 py-3 text-xs uppercase tracking-[0.25em] text-[#1B1A18] transition hover:border-[#C88FA3]"
                href="/politica-de-trocas-e-devolucoes"
              >
                Ver trocas e devoluções
              </a>
              <a
                className="rounded-full border border-[#DDD3CA] px-6 py-3 text-xs uppercase tracking-[0.25em] text-[#1B1A18] transition hover:border-[#C88FA3]"
                href="/conta/pedidos"
              >
                Meus pedidos
              </a>
            </div>
          </div>
        </section>
      </main>
      <LuxuryStaticFooter />
    </div>
  );
}
