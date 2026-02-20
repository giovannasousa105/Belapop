import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trabalhe Conosco | BelaPop",
  description:
    "Carreiras BelaPop: cultura editorial, curadoria com propósito e experiência premium."
};

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-[#F7BFD1]/40 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[#F7BFD1]">
    {children}
  </span>
);

const SectionTitle = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h2 id={id} className="mt-14 font-display text-2xl text-white md:text-3xl">
    {children}
  </h2>
);

const SectionLead = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 text-sm leading-relaxed text-bpPinkSoft/80 md:text-base">
    {children}
  </p>
);

export default function CarreirasPage() {
  return (
    <div className="min-h-screen bg-bpBlack text-bpOffWhite">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="rounded-[36px] border border-[#B80F5A]/45 bg-gradient-to-br from-[#0b0b10] via-[#151018] to-[#1d0a16] p-10 shadow-[0_35px_90px_rgba(184,15,90,0.25)] md:p-14">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#F7BFD1]">
            Trabalhe Conosco
          </p>
          <h1 className="mt-6 font-display text-4xl leading-[1.1] text-white md:text-6xl">
            Oferecer uma{" "}
            <span className="text-[#F7BFD1]">experiência de beleza completa</span>,
            uma curadoria especial de marcas, inovação e prestígio, dando às pessoas
            a liberdade de explorar sua{" "}
            <span className="text-[#F7BFD1]">beleza única</span> e conhecer a melhor{" "}
            <span className="text-[#F7BFD1]">versão de si</span>.
          </h1>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-bpPinkSoft/80 md:text-base">
            A BelaPop existe para transformar o cuidado pessoal em um ritual de significado —
            aquele momento de pausa que desperta sensações, cheiros, emoções e memórias afetivas.
            Aqui, trabalho não é rotina: é oportunidade de construir momentos memoráveis.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:giovannasousa105@gmail.com?subject=Vaga%20—%20Seu%20Nome"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#B80F5A] to-[#D11469] px-7 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-[0_15px_45px_rgba(184,15,90,0.35)]"
            >
              Enviar currículo
            </a>
            <a
              href="#processo"
              className="inline-flex items-center justify-center rounded-full border border-[#F7BFD1]/50 px-7 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#F7BFD1]"
            >
              Nosso processo
            </a>
          </div>
        </div>

        <SectionTitle>Quem somos</SectionTitle>
        <SectionLead>
          Não vendemos apenas produtos: oferecemos experiências que tocam, que convidam cada pessoa
          a se encontrar e celebrar seu tempo consigo mesma. Nossa curadoria é escolhida para
          refletir esse ethos — beleza que respeita e acolhe, luxo que se sente e autocuidado que inspira.
        </SectionLead>

        <SectionTitle>Nossa visão de experiência premium</SectionTitle>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Curadoria com propósito",
              text:
                "Cada produto é escolhido com carinho, pensando nas histórias que ele pode inspirar."
            },
            {
              title: "Sofisticação sensorial",
              text:
                "Fragrâncias, texturas e narrativas que elevam o cuidado a um momento de luxo pessoal."
            },
            {
              title: "Atendimento que acolhe",
              text:
                "Ouvir com atenção, orientar com empatia e criar uma jornada que faça sentido."
            },
            {
              title: "Consistência e confiança",
              text:
                "Qualidade em cada ponto de contato, da escolha à entrega."
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#B80F5A]/35 bg-[#0f0b12] p-6 shadow-[0_12px_40px_rgba(184,15,90,0.12)]"
            >
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#F7BFD1]">
                {item.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-bpPinkSoft/80">{item.text}</p>
            </div>
          ))}
        </div>

        <SectionTitle>Cultura e valores</SectionTitle>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Autocuidado como prática de vida",
              text:
                "Cuidar de si é um ato de amor — e o mesmo se aplica ao trabalho."
            },
            {
              title: "Inclusão que se vive",
              text:
                "A diversidade é parte da nossa identidade. Todas as histórias são bem-vindas."
            },
            {
              title: "Respeito e gentileza",
              text:
                "Nos relacionamos com empatia — com clientes, colegas e parceiros."
            },
            {
              title: "Excelência gentil",
              text:
                "Altos padrões com leveza. A perfeição está nos detalhes e na intenção."
            },
            {
              title: "Crescimento consciente",
              text:
                "Aprendizado contínuo, experimentação e evolução com apoio real."
            }
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0c0a10] p-6">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#F7BFD1]">
                {item.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-bpPinkSoft/75">{item.text}</p>
            </div>
          ))}
        </div>

        <SectionTitle>Áreas que inspiram nossa equipe</SectionTitle>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "Curadoria & Produto",
            "Conteúdo & Comunidade",
            "Experiência do Cliente",
            "Marketplace & Parcerias",
            "Operações & Logística",
            "Tech & Produto Digital"
          ].map((item) => (
            <Pill key={item}>{item}</Pill>
          ))}
        </div>

        <SectionTitle id="processo">Nosso processo de seleção</SectionTitle>
        <div className="mt-6 grid gap-3">
          {[
            {
              title: "Candidatura sincera",
              text:
                "Conte quem você é e por que a BelaPop faz sentido para você."
            },
            {
              title: "Conversa leve",
              text:
                "Falamos sobre valores, expectativas e seu momento."
            },
            {
              title: "Proposta de alinhamento",
              text:
                "Quando necessário, uma atividade prática para entender seu estilo."
            },
            {
              title: "Alinhamento final",
              text:
                "Expectativas claras, espaço para perguntas e próximos passos."
            }
          ].map((item, index) => (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-2xl border border-[#B80F5A]/25 bg-[#0f0b12] px-6 py-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F7BFD1]/50 text-xs font-semibold text-[#F7BFD1]">
                0{index + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-bpPinkSoft/75">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <SectionTitle>Venha criar experiências memoráveis</SectionTitle>
        <SectionLead>
          Se você vibra com pausas que viram memórias e trabalha com cuidado e beleza com propósito,
          queremos te conhecer.
        </SectionLead>
        <div className="mt-6 rounded-2xl border border-[#B80F5A]/40 bg-[#120b12] p-6">
          <p className="text-sm text-bpPinkSoft/80">
            Envie seu currículo e carta de motivação para:
          </p>
          <a
            href="mailto:giovannasousa105@gmail.com?subject=Vaga%20—%20Seu%20Nome"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#F7BFD1] underline decoration-[#F7BFD1]/60 underline-offset-4"
          >
            giovannasousa105@gmail.com
          </a>
          <p className="mt-4 text-sm text-bpPinkSoft/70">Assunto: Vaga — Seu Nome</p>
          <p className="mt-2 text-sm text-bpPinkSoft/70">
            No corpo da mensagem, conte: quem você é, suas paixões profissionais e como você imagina
            contribuir para as pausas inesquecíveis da BelaPop.
          </p>
        </div>
      </div>
    </div>
  );
}
