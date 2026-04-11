import Link from "next/link";

import { BelaCodeEditorialFeature } from "@/components/home/BelaCodeEditorialFeature";
import { BelaCodeOrbShowcase } from "@/components/home/BelaCodeOrbShowcase";
import { Section } from "@/components/ui/Section";
import {
  getSkinBelaEvidenceHref,
  skinBelaEvidenceSectionId,
  skinBelaPublicEvidenceSources
} from "@/lib/skingpt/publicEvidenceLinks";

type BelaCodeLandingContentProps = {
  scanHref: string;
  scanCtaLabel: string;
};

const evidenceGroups = [
  {
    title: "Nivel 1 priorizado",
    body: "Meta-analises, revisoes sistematicas, ensaios controlados randomizados e diretrizes entram primeiro na hierarquia clinica da experiencia."
  },
  {
    title: "Dermatologia aplicada",
    body: "JAAD, JAMA Dermatology, BJD, ABD, DermNet, Cochrane e PubMed ajudam a traduzir ciencia em linguagem simples para o autocuidado."
  },
  {
    title: "Leitura progressiva",
    body: "BelaCode une captura guiada, heatmap, Skin Twin e simulacao 30/60/90 dias para orientar a rotina com mais clareza."
  }
];

const captureFlow = [
  "Expressao neutra e rosto centralizado",
  "Piscada para validacao de liveness",
  "Sorriso para linhas dinamicas",
  "Testa franzida para rugas de expressao",
  "Giro leve da cabeca para consistencia do scan"
];

const resultPanels = [
  {
    label: "Leitura inicial",
    title: "Sinais que pedem conforto e reparo",
    score: "76",
    notes: ["Barreira sensibilizada", "Textura irregular", "Luminosidade reduzida"]
  },
  {
    label: "30 dias de rotina",
    title: "Pele mais uniforme, calma e luminosa",
    score: "84",
    notes: ["Mais conforto", "Melhor textura", "Luminosidade recuperada"]
  }
];

const trustPoints = [
  "Tecnologia proprietaria para leitura de pele com linguagem estetica.",
  "Curadoria premium orientada por literatura clinica e contexto cosmetico.",
  "Experiencia pensada para parecer luxo editorial, nao teste generico."
];

const socialProof = [
  {
    quote:
      "A leitura ficou sofisticada, clara e objetiva. Parece tecnologia de marca global, mas traduzida para rotina real.",
    author: "Cliente BelaPop",
    role: "Skincare premium"
  },
  {
    quote:
      "O grande diferencial e unir desejo, repertorio cosmetico e criterio clinico sem parecer consultorio frio.",
    author: "Curadoria BelaPop",
    role: "Editorial commerce"
  },
  {
    quote:
      "A experiencia passa confianca porque mostra leitura, processo e curadoria no mesmo fluxo, com linguagem simples.",
    author: "Rotina personalizada",
    role: "Beauty intelligence"
  }
];

const evidenceByConcern = [
  {
    key: "acne",
    label: "Acne",
    body: "Quando a leitura aponta acne, oleosidade e textura inflamatoria, a curadoria sobe diretrizes fortes e revisoes sistematicas.",
    sources: ["Cochrane", "AAD / JAAD", "JAMA Dermatology / PubMed"]
  },
  {
    key: "manchas",
    label: "Manchas",
    body: "Para pigmentacao e marcas, a base prioriza revisoes sobre hiperpigmentacao, fotoprotecao e contexto de pele real.",
    sources: ["PubMed", "JAMA Dermatology / JAAD", "ABD / LILACS / SciELO"]
  },
  {
    key: "rosacea",
    label: "Rosacea",
    body: "Quando o mapa le vermelhidao e sensibilidade vascular, a SkinBela prioriza rosacea, inflamacao e pele sensibilizada.",
    sources: ["PubMed", "JAMA Dermatology", "DermNet"]
  },
  {
    key: "barreira",
    label: "Barreira",
    body: "Leituras de desconforto, ressecamento e perda de equilibrio pedem literatura de barreira cutanea, ceramidas e pele sensivel.",
    sources: ["PubMed", "DermNet", "ABD / LILACS / SciELO"]
  },
  {
    key: "linhas",
    label: "Linhas",
    body: "Quando o foco e fotoenvelhecimento e linhas finas, a plataforma sobe retinoides, fotoenvelhecimento e fotoprotecao diaria.",
    sources: ["JAMA Dermatology", "PubMed", "DermNet"]
  }
];

export function BelaCodeLandingContent({
  scanHref,
  scanCtaLabel
}: BelaCodeLandingContentProps) {
  return (
    <div className="bg-bpOffWhite text-bpGraphite">
      <BelaCodeEditorialFeature
        primaryHref={scanHref}
        primaryLabel={scanCtaLabel}
        secondaryHref="#como-funciona"
      />
      <BelaCodeOrbShowcase primaryHref={scanHref} primaryLabel={scanCtaLabel} />

      <Section className="bg-bpOffWhite/90">
        <div className="grid gap-6 lg:grid-cols-2">
          {resultPanels.map((panel, index) => (
            <div
              key={panel.label}
              className="rounded-[24px] border border-[#ddcbcd] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,232,234,0.45)_100%)] px-4 py-5 shadow-bpSoft md:rounded-[32px] md:px-8 md:py-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-bpRoseGold">{panel.label}</p>
                  <h2 className="mt-3 text-balance font-display text-[1.26rem] leading-[1.12] tracking-[-0.02em] text-bpBlack sm:text-[1.9rem] md:text-4xl">{panel.title}</h2>
                </div>
                <div className="self-start rounded-[18px] border border-[rgba(216,160,172,0.22)] bg-white/80 px-4 py-3 text-left sm:rounded-full sm:text-right">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-bpGraphite/62">Skin Reading</p>
                  <p className="mt-1 text-2xl font-semibold text-bpBlack">{panel.score}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[22px] border border-[rgba(216,160,172,0.18)] bg-white/70 p-4 md:rounded-[28px] md:p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {panel.notes.map((item) => (
                    <div
                      key={item}
                      className="w-full min-w-0 rounded-[18px] border border-[rgba(216,160,172,0.14)] bg-[#FCF7F8] px-4 py-4 text-sm text-bpBlack md:rounded-[22px]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[0.92rem] leading-6 text-bpGraphite/92 sm:text-sm sm:leading-7">
                  {index === 0
                    ? "Antes da rotina, a leitura destaca pontos de conforto, textura e equilibrio da barreira cutanea."
                    : "Depois de consistencia de uso, a mesma leitura passa a mostrar um panorama mais estavel e elegante da pele."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-bpOffWhite" id="como-funciona">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[24px] border border-[#ddcbcd] bg-white px-4 py-6 shadow-bpSoft md:rounded-[32px] md:px-8 md:py-9">
            <p className="text-[11px] uppercase tracking-[0.28em] text-bpPink">Como funciona</p>
              <h1 className="mt-3 text-balance font-display text-[1.46rem] leading-[1.1] tracking-[-0.02em] text-bpBlack sm:text-[2.3rem] md:text-5xl">
                Um ritual tecnologico com leitura editorial da sua pele.
              </h1>
            <p className="mt-5 max-w-xl text-[0.92rem] leading-6 text-bpGraphite/92 md:text-base md:leading-7">
              A experiencia foi desenhada para parecer luxo silencioso, mas operar com uma disciplina
              de triagem cosmetica baseada em evidencia. O resultado precisa ser claro para a usuaria
              e coerente para uma plataforma proprietaria.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={scanHref}
                className="inline-flex items-center justify-center rounded-bpMd bg-bpBlackSoft px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-bpMicro transition hover:bg-bpBlack"
              >
                {scanCtaLabel}
              </Link>
              <Link
                href="/diario"
                className="inline-flex items-center justify-center rounded-bpMd border border-[#ccb6b8] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-bpBlack transition hover:border-bpPink/30 hover:text-bpPink"
              >
                Ler o diario
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {evidenceGroups.map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-[#ddcbcd] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,247,244,0.92))] px-4 py-5 shadow-bpMicro md:rounded-[28px] md:px-6 md:py-6"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-bpPink">{item.title}</p>
                <p className="mt-3 text-[0.92rem] leading-6 text-bpGraphite/92 md:text-base md:leading-7">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-[#f7ecee]/45" id={skinBelaEvidenceSectionId}>
        <div className="rounded-[24px] border border-[#ddcbcd] bg-white px-4 py-6 shadow-bpSoft md:rounded-[32px] md:px-8 md:py-9">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-bpPink">Curadoria de evidencia SkinBela</p>
              <h2 className="mt-2 text-balance font-display text-[1.34rem] leading-[1.1] tracking-[-0.02em] text-bpBlack sm:text-[2.2rem] md:text-4xl">
                As fontes que sustentam a leitura do heatmap e da rotina.
              </h2>
            </div>
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/55">
              mesmas referencias usadas para contextualizar o scan
            </span>
          </div>

          <p className="mt-5 max-w-4xl text-[0.92rem] leading-6 text-bpGraphite/90 md:text-base md:leading-7">
            Quando o heatmap fala de acne, manchas, vermelhidao, textura, barreira ou linhas, a SkinBela
            aponta para uma hierarquia publica de fontes. O objetivo e deixar visivel o que sustenta a
            interpretacao estetica, sem transformar a experiencia em painel medico.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {evidenceByConcern.map((item) => (
              <article
                key={item.key}
                className="rounded-[22px] border border-[#ddcbcd] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,232,234,0.42)_100%)] px-4 py-5 shadow-bpMicro md:rounded-[28px] md:px-5 md:py-6"
              >
                <span className="rounded-full border border-[rgba(216,160,172,0.22)] bg-bpPinkLux px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-bpBlackSoft">
                  {item.label}
                </span>
                <p className="mt-4 text-[0.92rem] leading-6 text-bpGraphite/90">{item.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.sources.map((source) => (
                    <Link
                      key={`${item.key}-${source}`}
                      href={getSkinBelaEvidenceHref(source)}
                      className="inline-flex items-center rounded-full border border-[rgba(216,160,172,0.18)] bg-white px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/82 transition hover:border-bpPink/35 hover:text-bpBlack"
                    >
                      {source}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skinBelaPublicEvidenceSources.map((item) => (
              <article
                key={item.key}
                id={`${skinBelaEvidenceSectionId}-${item.key}`}
                className="scroll-mt-28 rounded-[22px] border border-[#ddcbcd] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,232,234,0.42)_100%)] px-4 py-5 shadow-bpMicro md:rounded-[28px] md:px-5 md:py-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgba(216,160,172,0.22)] bg-bpPinkLux px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-bpBlackSoft">
                    {item.label}
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/82">
                    {item.priority}
                  </span>
                </div>
                <p className="mt-4 text-[0.94rem] leading-6 text-bpGraphite/90 md:text-sm md:leading-7">
                  {item.description}
                </p>
                <div className="mt-5 border-t border-[rgba(216,160,172,0.14)] pt-4">
                  <Link
                    href={scanHref}
                    className="text-xs uppercase tracking-[0.22em] text-bpPink transition hover:text-bpBlack"
                  >
                    Ver isso em uma leitura real
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-[#f7ecee]/55">
        <div className="rounded-[24px] border border-[#ddcbcd] bg-white px-4 py-6 shadow-bpSoft md:rounded-[32px] md:px-8 md:py-9">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-bpPink">Quality gate</p>
              <h2 className="mt-2 text-balance font-display text-[1.34rem] leading-[1.1] tracking-[-0.02em] text-bpBlack sm:text-[2.2rem] md:text-4xl">
                A captura so vale quando a leitura respeita o protocolo.
              </h2>
            </div>
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/55">
              baseado na experiencia real do BelaCode
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {captureFlow.map((item, index) => (
              <div
                key={item}
                className="rounded-[20px] border border-[#e2d4d5] bg-[#fdfafb] px-4 py-5 md:rounded-[24px]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d7bdc1] bg-[#fbf3f4] text-xs font-semibold text-bpBlackSoft">
                  {index + 1}
                </span>
                <p className="mt-4 text-[0.92rem] leading-6 text-bpGraphite/90 sm:text-sm sm:leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-bpOffWhite">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[24px] border border-[#ddcbcd] bg-white px-4 py-6 shadow-bpSoft md:rounded-[32px] md:px-8 md:py-8">
            <p className="text-[11px] uppercase tracking-[0.28em] text-bpPink">Prova de confianca</p>
              <h2 className="mt-3 text-balance font-display text-[1.46rem] leading-[1.1] tracking-[-0.02em] text-bpBlack sm:text-[2.3rem] md:text-5xl">
                Luxo, leitura e rotina em uma mesma experiencia.
              </h2>
            <div className="mt-6 space-y-3">
              {trustPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-[rgba(216,160,172,0.16)] bg-[#FCF7F8] px-4 py-4 text-sm leading-7 text-bpGraphite/88 md:rounded-[24px]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {socialProof.map((item) => (
              <div
                key={item.author + item.role}
                className="rounded-[22px] border border-[#ddcbcd] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,232,234,0.44)_100%)] px-4 py-5 shadow-bpMicro md:rounded-[28px] md:px-5 md:py-6"
              >
                <p className="font-display text-3xl leading-none text-bpRoseGold">&ldquo;</p>
                  <p className="mt-3 text-[0.92rem] leading-6 text-bpGraphite/92 sm:text-sm sm:leading-7">{item.quote}</p>
                <div className="mt-6 border-t border-[rgba(216,160,172,0.14)] pt-4">
                  <p className="text-sm font-medium text-bpBlack">{item.author}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">
                    {item.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-bpOffWhite">
        <div className="rounded-[22px] border border-[#ddcbcd] bg-white px-4 py-5 shadow-bpMicro md:rounded-[30px] md:px-8 md:py-8">
          <p className="text-[11px] uppercase tracking-[0.26em] text-bpPink">Aviso importante</p>
          <p className="mt-4 max-w-4xl text-[0.92rem] leading-6 text-bpGraphite/92 md:text-base md:leading-7">
            BelaCode e SkinBela apoiam triagem cosmetica, educacao da rotina e leitura de progresso
            com base em literatura clinica. Eles nao substituem consulta, exame fisico, dermatoscopia,
            biopsia ou decisao medica dermatologica quando houver lesoes novas, mudancas suspeitas,
            sangramento, dor, crescimento rapido ou outros sinais de alerta.
          </p>
        </div>
      </Section>
    </div>
  );
}
