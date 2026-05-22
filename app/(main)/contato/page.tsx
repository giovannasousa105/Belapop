import { LuxuryStaticFooter } from "@/components/layout/LuxuryStaticFooter";
import { belapopContact, buildBelapopMailto } from "@/lib/brand/contact";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSection = {
  title: string;
  items: FaqItem[];
};

const faqSections: FaqSection[] = [
  {
    title: "Compra e sellers parceiros",
    items: [
      {
        question: "Os produtos sao vendidos pela BelaPop?",
        answer:
          "A BelaPop reune produtos e seleções dentro da plataforma. Em alguns casos, a venda pode ser realizada por parceiros participantes, conforme as informações da jornada de compra."
      },
      {
        question: "Como sei quem esta vendendo o produto?",
        answer:
          "As informações da compra sao apresentadas ao longo da jornada, incluindo detalhes relevantes sobre o pedido, o envio e as condições aplicaveis."
      },
      {
        question: "Os produtos seguem o mesmo padrao dentro da plataforma?",
        answer:
          "A BelaPop organiza a experiência de descoberta e compra com foco em clareza, curadoria e confianca dentro da plataforma."
      },
      {
        question: "Posso comprar mais de um produto no mesmo pedido?",
        answer:
          "Sim. A composição do pedido depende dos produtos selecionados e das condições aplicaveis no momento da compra."
      }
    ]
  },
  {
    title: "Entrega, frete e rastreio",
    items: [
      {
        question: "Como funciona o frete?",
        answer:
          "O frete e calculado com base nos produtos selecionados, no endereco informado e nas condições aplicaveis ao pedido."
      },
      {
        question: "O prazo de entrega e o mesmo para todos os produtos?",
        answer:
          "O prazo pode variar de acordo com o produto, a disponibilidade, o endereco de entrega e as condições do pedido."
      },
      {
        question: "Vou receber codigo de rastreio?",
        answer:
          "Quando disponivel, as informações de rastreio sao compartilhadas ao longo da jornada do pedido."
      },
      {
        question: "Meu pedido pode ter entregas separadas?",
        answer:
          "Dependendo da composição do pedido, pode haver diferencas de prazo, envio e acompanhamento entre os itens."
      }
    ]
  },
  {
    title: "Pagamento e seguranca",
    items: [
      {
        question: "Quais formas de pagamento sao aceitas?",
        answer:
          "As formas de pagamento disponiveis sao apresentadas no momento da compra, conforme as condições ativas na plataforma."
      },
      {
        question: "E seguro comprar na BelaPop?",
        answer:
          "A plataforma adota medidas de seguranca para proteger a jornada de compra, incluindo tratamento seguro de dados e suporte a meios de pagamento adequados a operação."
      },
      {
        question: "Meus dados de pagamento ficam salvos?",
        answer:
          "O tratamento dos dados segue as regras de privacidade e seguranca informadas pela plataforma e pelos parceiros envolvidos no processamento do pagamento."
      },
      {
        question: "O pagamento pode passar por validação?",
        answer:
          "Sim. Algumas compras podem passar por etapas de validação para reforçar segurança e integridade da transação."
      }
    ]
  },
  {
    title: "Skin Scan e personalizacao",
    items: [
      {
        question: "O que e o Skin Scan?",
        answer:
          "O Skin Scan e uma experiência de leitura visual da pele que ajuda a orientar recomendações cosméticas com mais clareza."
      },
      {
        question: "O Skin Scan faz recomendação cosmética?",
        answer:
          "Nao. O Skin Scan apoia escolhas cosméticas e não substitui avaliação profissional."
      },
      {
        question: "Preciso fazer Skin Scan para comprar?",
        answer:
          "Nao. O Skin Scan e uma experiência complementar para ajudar na organizacao da rotina e na escolha de produtos."
      },
      {
        question: "Como a personalizacao funciona?",
        answer:
          "A plataforma pode organizar sugestoes com base nas informações compartilhadas ao longo da jornada, como preferencias, interacoes e experiencias utilizadas dentro do ecossistema BelaPop, quando aplicavel."
      },
      {
        question: "Como minha imagem e usada no Skin Scan?",
        answer:
          "A imagem e usada dentro da experiência do Skin Scan para gerar a leitura visual da pele, conforme as regras de privacidade e seguranca da plataforma."
      }
    ]
  },
  {
    title: "Trocas, devoluções e cancelamento",
    items: [
      {
        question: "Posso trocar ou devolver um produto?",
        answer:
          "As condições de troca, devolucao e arrependimento seguem as regras informadas pela plataforma e pela legislacao aplicavel."
      },
      {
        question: "Em quanto tempo posso solicitar devolucao?",
        answer:
          "Os prazos e condições da solicitação sao informados na política aplicavel a compra."
      },
      {
        question: "Como faco para pedir ajuda com meu pedido?",
        answer:
          "Você pode usar os canais de atendimento e suporte indicados pela plataforma para acompanhar sua solicitação."
      },
      {
        question: "Quando recebo o reembolso?",
        answer:
          "O prazo de reembolso depende da forma de pagamento utilizada e das etapas de validação e processamento da solicitação."
      }
    ]
  },
  {
    title: "PopClub",
    items: [
      {
        question: "O que e o PopClub?",
        answer:
          "O PopClub e o programa de beneficios da BelaPop para quem quer mais continuidade na rotina e vantagens visiveis ao longo da jornada."
      },
      {
        question: "O que esta incluido no PopClub?",
        answer:
          "O programa pode reunir beneficios, sugestoes e condições especiais, conforme disponibilidade, elegibilidade e regras apresentadas no momento da adesao."
      },
      {
        question: "Preciso fazer Skin Scan para participar?",
        answer:
          "Quando aplicavel, informações da sua jornada podem ajudar a organizar sugestoes e beneficios. A participação segue as condições apresentadas no programa."
      },
      {
        question: "Posso cancelar minha participação?",
        answer:
          "As condições de cancelamento e gestao da participação sao informadas no momento da adesao ao programa."
      }
    ]
  },
  {
    title: "Suporte e contato",
    items: [
      {
        question: "Como entro em contato com a BelaPop?",
        answer:
          "Os canais oficiais de atendimento estao disponiveis na plataforma para suporte, dúvidas e acompanhamento de solicitacoes."
      },
      {
        question: "Onde acompanho meu pedido?",
        answer:
          "As informações do pedido e do andamento da compra sao disponibilizadas ao longo da jornada da plataforma."
      },
      {
        question: "Onde vejo políticas e informações legais?",
        answer:
          "Você pode consultar as paginas de privacidade, seguranca, termos e demais informações institucionais diretamente na plataforma."
      }
    ]
  }
];

export default function ContatoPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Ola, BelaPop. Preciso de atendimento.")}`
    : null;
  const instagramHref =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/belapop.oficial";
  const supportHref = buildBelapopMailto(
    belapopContact.supportEmail,
    "Atendimento BelaPop",
    "Ola, BelaPop. Preciso de atendimento sobre:"
  );
  const contactCards = [
    {
      title: "Email",
      value: belapopContact.supportEmail,
      href: supportHref
    },
    {
      title: "WhatsApp / Concierge",
      value: whatsappHref ? "Atendimento premium" : "Atendimento pelo e-mail institucional",
      href: whatsappHref
    },
    {
      title: "Instagram",
      value: belapopContact.instagramHandle,
      href: instagramHref
    }
  ] as const;

  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#1B1A18]">
      <main className="overflow-hidden">
        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-xs uppercase tracking-[0.45em] text-[#C88FA3]">Contato</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] md:text-6xl">
              Fale com a BelaPop
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5F5A55] md:text-base">
              Atendimento claro, elegante e proximo.
            </p>
          </div>
        </section>

        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-3">
            {contactCards.map(({ title, value, href }) => {
              const content = (
                <>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#C88FA3]">{title}</p>
                  <p className="mt-3 text-sm text-[#5F5A55]">{value}</p>
                </>
              );

              return href ? (
                <a
                  key={title}
                  className="rounded-[28px] border border-[#DDD3CA] bg-white/80 p-6 transition hover:border-[#C88FA3]"
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {content}
                </a>
              ) : (
                <div key={title} className="rounded-[28px] border border-[#DDD3CA] bg-white/80 p-6">
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-2">
            {[
              "Entrega e frete",
              "Trocas e devoluções",
              "Pagamento",
              "Suporte ao pedido"
            ].map((item) => (
              <div key={item} className="rounded-[28px] border border-[#DDD3CA] bg-white/80 p-6 text-sm text-[#5F5A55]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px] rounded-[32px] border border-[#DDD3CA] bg-[#F2E3E8] p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[#C88FA3]">Perguntas frequentes</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5F5A55]">
              Tudo o que voce precisa saber para comprar com mais clareza e seguranca.
            </p>
            <div className="mt-8 space-y-8">
              {faqSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs uppercase tracking-[0.28em] text-[#C88FA3]">
                    {section.title}
                  </h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {section.items.map((item) => (
                      <div
                        key={item.question}
                        className="rounded-[20px] border border-[#E3CBD3] bg-white/70 px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-[#1B1A18]">{item.question}</p>
                        <p className="mt-2 text-sm leading-6 text-[#5F5A55]">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px] rounded-[32px] border border-[#DDD3CA] bg-white/80 p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[#C88FA3]">Atendimento</p>
            <h2 className="mt-4 font-serif text-3xl text-[#1B1A18]">Como podemos ajudar?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5F5A55]">
              Para pedidos, entrega, pagamento, troca, devolucao ou privacidade, envie uma mensagem
              pelo canal institucional. Inclua numero do pedido, CPF ou e-mail da compra quando
              estiver solicitando suporte de pos-venda.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="rounded-full bg-[#1B1A18] px-6 py-3 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-[#3d3530]"
                href={supportHref}
              >
                Enviar e-mail
              </a>
              <a
                className="rounded-full border border-[#DDD3CA] px-6 py-3 text-xs uppercase tracking-[0.25em] text-[#1B1A18] transition hover:border-[#C88FA3]"
                href="/politica-de-envio"
              >
                Ver envio
              </a>
              <a
                className="rounded-full border border-[#DDD3CA] px-6 py-3 text-xs uppercase tracking-[0.25em] text-[#1B1A18] transition hover:border-[#C88FA3]"
                href="/trocas-e-devolucoes"
              >
                Ver trocas
              </a>
            </div>
          </div>
        </section>
      </main>
      <LuxuryStaticFooter />
    </div>
  );
}
