import { LuxuryStaticFooter } from "@/components/layout/LuxuryStaticFooter";
import { LuxuryStaticHeader } from "@/components/layout/LuxuryStaticHeader";

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
          "A BelaPop reune produtos e selecoes dentro da plataforma. Em alguns casos, a venda pode ser realizada por parceiros participantes, conforme as informacoes da jornada de compra."
      },
      {
        question: "Como sei quem esta vendendo o produto?",
        answer:
          "As informacoes da compra sao apresentadas ao longo da jornada, incluindo detalhes relevantes sobre o pedido, o envio e as condicoes aplicaveis."
      },
      {
        question: "Os produtos seguem o mesmo padrao dentro da plataforma?",
        answer:
          "A BelaPop organiza a experiencia de descoberta e compra com foco em clareza, curadoria e confianca dentro da plataforma."
      },
      {
        question: "Posso comprar mais de um produto no mesmo pedido?",
        answer:
          "Sim. A composicao do pedido depende dos produtos selecionados e das condicoes aplicaveis no momento da compra."
      }
    ]
  },
  {
    title: "Entrega, frete e rastreio",
    items: [
      {
        question: "Como funciona o frete?",
        answer:
          "O frete e calculado com base nos produtos selecionados, no endereco informado e nas condicoes aplicaveis ao pedido."
      },
      {
        question: "O prazo de entrega e o mesmo para todos os produtos?",
        answer:
          "O prazo pode variar de acordo com o produto, a disponibilidade, o endereco de entrega e as condicoes do pedido."
      },
      {
        question: "Vou receber codigo de rastreio?",
        answer:
          "Quando disponivel, as informacoes de rastreio sao compartilhadas ao longo da jornada do pedido."
      },
      {
        question: "Meu pedido pode ter entregas separadas?",
        answer:
          "Dependendo da composicao do pedido, pode haver diferencas de prazo, envio e acompanhamento entre os itens."
      }
    ]
  },
  {
    title: "Pagamento e seguranca",
    items: [
      {
        question: "Quais formas de pagamento sao aceitas?",
        answer:
          "As formas de pagamento disponiveis sao apresentadas no momento da compra, conforme as condicoes ativas na plataforma."
      },
      {
        question: "E seguro comprar na BelaPop?",
        answer:
          "A plataforma adota medidas de seguranca para proteger a jornada de compra, incluindo tratamento seguro de dados e suporte a meios de pagamento adequados a operacao."
      },
      {
        question: "Meus dados de pagamento ficam salvos?",
        answer:
          "O tratamento dos dados segue as regras de privacidade e seguranca informadas pela plataforma e pelos parceiros envolvidos no processamento do pagamento."
      },
      {
        question: "O pagamento pode passar por validacao?",
        answer:
          "Sim. Algumas compras podem passar por etapas de validacao para reforcar seguranca e integridade da transacao."
      }
    ]
  },
  {
    title: "Skin Scan e personalizacao",
    items: [
      {
        question: "O que e o Skin Scan?",
        answer:
          "O Skin Scan e uma experiencia de leitura visual da pele que ajuda a orientar recomendacoes cosmeticas com mais clareza."
      },
      {
        question: "O Skin Scan faz diagnostico?",
        answer:
          "Nao. O Skin Scan apoia escolhas cosmeticas e nao substitui avaliacao profissional."
      },
      {
        question: "Preciso fazer Skin Scan para comprar?",
        answer:
          "Nao. O Skin Scan e uma experiencia complementar para ajudar na organizacao da rotina e na escolha de produtos."
      },
      {
        question: "Como a personalizacao funciona?",
        answer:
          "A plataforma pode organizar sugestoes com base nas informacoes compartilhadas ao longo da jornada, como preferencias, interacoes e experiencias utilizadas dentro do ecossistema BelaPop, quando aplicavel."
      },
      {
        question: "Como minha imagem e usada no Skin Scan?",
        answer:
          "A imagem e usada dentro da experiencia do Skin Scan para gerar a leitura visual da pele, conforme as regras de privacidade e seguranca da plataforma."
      }
    ]
  },
  {
    title: "Trocas, devolucoes e cancelamento",
    items: [
      {
        question: "Posso trocar ou devolver um produto?",
        answer:
          "As condicoes de troca, devolucao e arrependimento seguem as regras informadas pela plataforma e pela legislacao aplicavel."
      },
      {
        question: "Em quanto tempo posso solicitar devolucao?",
        answer:
          "Os prazos e condicoes da solicitacao sao informados na politica aplicavel a compra."
      },
      {
        question: "Como faco para pedir ajuda com meu pedido?",
        answer:
          "Voce pode usar os canais de atendimento e suporte indicados pela plataforma para acompanhar sua solicitacao."
      },
      {
        question: "Quando recebo o reembolso?",
        answer:
          "O prazo de reembolso depende da forma de pagamento utilizada e das etapas de validacao e processamento da solicitacao."
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
          "O programa pode reunir beneficios, sugestoes e condicoes especiais, conforme disponibilidade, elegibilidade e regras apresentadas no momento da adesao."
      },
      {
        question: "Preciso fazer Skin Scan para participar?",
        answer:
          "Quando aplicavel, informacoes da sua jornada podem ajudar a organizar sugestoes e beneficios. A participacao segue as condicoes apresentadas no programa."
      },
      {
        question: "Posso cancelar minha participacao?",
        answer:
          "As condicoes de cancelamento e gestao da participacao sao informadas no momento da adesao ao programa."
      }
    ]
  },
  {
    title: "Suporte e contato",
    items: [
      {
        question: "Como entro em contato com a BelaPop?",
        answer:
          "Os canais oficiais de atendimento estao disponiveis na plataforma para suporte, duvidas e acompanhamento de solicitacoes."
      },
      {
        question: "Onde acompanho meu pedido?",
        answer:
          "As informacoes do pedido e do andamento da compra sao disponibilizadas ao longo da jornada da plataforma."
      },
      {
        question: "Onde vejo politicas e informacoes legais?",
        answer:
          "Voce pode consultar as paginas de privacidade, seguranca, termos e demais informacoes institucionais diretamente na plataforma."
      }
    ]
  }
];

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#1B1A18]">
      <LuxuryStaticHeader />
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
            {[
              ["Email", "contato@belapopoficial.com.br"],
              ["WhatsApp / Concierge", "Atendimento premium"],
              ["Instagram", "@belapopoficial"]
            ].map(([title, value]) => (
              <div key={title} className="rounded-[28px] border border-[#DDD3CA] bg-white/80 p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-[#C88FA3]">{title}</p>
                <p className="mt-3 text-sm text-[#5F5A55]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-2">
            {[
              "Entrega e frete",
              "Trocas e devolucoes",
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
            <p className="text-xs uppercase tracking-[0.35em] text-[#C88FA3]">Formulario</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="rounded-[16px] border border-[#DDD3CA] bg-white px-4 py-3 text-sm" placeholder="Nome" />
              <input className="rounded-[16px] border border-[#DDD3CA] bg-white px-4 py-3 text-sm" placeholder="Email" />
              <input className="rounded-[16px] border border-[#DDD3CA] bg-white px-4 py-3 text-sm md:col-span-2" placeholder="Assunto" />
              <textarea className="min-h-[140px] rounded-[16px] border border-[#DDD3CA] bg-white px-4 py-3 text-sm md:col-span-2" placeholder="Mensagem" />
            </div>
            <button className="mt-6 rounded-full bg-[#1B1A18] px-6 py-3 text-xs uppercase tracking-[0.25em] text-white">
              Enviar
            </button>
          </div>
        </section>
      </main>
      <LuxuryStaticFooter />
    </div>
  );
}
