import { Button } from "@/components/ui/Button";

type BelaCodeEditorialFeatureProps = {
  primaryHref?: string;
  secondaryHref?: string;
  primaryLabel?: string;
  variant?: "hero" | "process";
};

const routineItems = [
  "Cleanser calmante",
  "Serum reparador",
  "Moisturizer restaurador",
  "Fotoprotecao diaria"
];

const processSteps = [
  {
    index: "01",
    title: "Leitura visual guiada",
    body: "A captura observa sinais de textura, conforto e luminosidade em uma experiencia simples e silenciosa."
  },
  {
    index: "02",
    title: "Interpretacao da pele",
    body: "A leitura traduz o que aparece no rosto em contexto cosmetico, sem jargao tecnico desnecessario."
  },
  {
    index: "03",
    title: "Curadoria da rotina",
    body: "A plataforma organiza produtos, ordem de uso e prioridades para o momento real da pele."
  }
];

const evidencePillars = [
  "Cochrane",
  "JAAD",
  "JAMA Dermatology",
  "PubMed",
  "ABD",
  "DermNet"
];

const signalCopy = [
  "Barreira sensibilizada,",
  "textura irregular,",
  "perda sutil de luminosidade."
];

function ScanCapsuleVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "relative mx-auto flex w-full items-center justify-center",
        compact ? "h-[248px] max-w-[226px] sm:h-[284px] sm:max-w-[252px]" : "h-[300px] max-w-[274px] sm:h-[356px] sm:max-w-[310px] lg:h-[408px] lg:max-w-[344px]"
      ].join(" ")}
    >
      <div className="absolute inset-x-[9%] inset-y-[11%] rounded-[40px] border border-white/42 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.15))] shadow-[inset_0_1px_0_rgba(255,255,255,0.66),0_24px_64px_rgba(184,142,142,0.09)] backdrop-blur-[10px]" />
      <div className="absolute inset-x-[18%] inset-y-[8%] rounded-full bg-[radial-gradient(circle,rgba(244,218,223,0.62)_0%,rgba(235,194,203,0.22)_38%,rgba(255,255,255,0)_76%)] blur-3xl" />
      <div className="absolute inset-x-[22%] inset-y-[16%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.1)_48%,rgba(255,255,255,0)_82%)] blur-2xl" />
      <div className="absolute left-[49%] top-[13%] h-[73%] w-[16%] -translate-x-1/2 rounded-full border border-white/62 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.08)_18%,rgba(255,255,255,0.22)_44%,rgba(255,255,255,0.08)_72%,rgba(255,255,255,0.82)_100%)] shadow-[inset_0_0_30px_rgba(255,255,255,0.82),0_0_34px_rgba(255,238,241,0.7),0_14px_36px_rgba(184,142,142,0.1)] sm:w-[14%]" />
      <div className="absolute left-[49%] top-[16%] h-[67%] w-[8%] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.72)_28%,rgba(255,255,255,0.18)_56%,rgba(255,255,255,0.78)_100%)] blur-[4px]" />
      <div className="absolute left-[51%] top-[18%] h-[62%] w-[28%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,243,245,0.68)_0%,rgba(255,237,241,0.18)_48%,rgba(255,255,255,0)_76%)] blur-2xl" />
      <div className="absolute left-[51%] top-[36%] h-24 w-24 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.62)_0%,rgba(250,226,230,0.18)_48%,rgba(255,255,255,0)_75%)] blur-2xl sm:h-28 sm:w-28" />
      <div className="absolute left-[42%] top-[26%] h-1.5 w-1.5 rounded-full bg-white/95 shadow-[0_0_18px_rgba(255,255,255,0.95)]" />
      <div className="absolute left-[60%] top-[31%] h-2 w-2 rounded-full bg-white/85 shadow-[0_0_24px_rgba(255,241,244,0.95)]" />
      <div className="absolute left-[38%] top-[53%] h-1.5 w-1.5 rounded-full bg-white/85 shadow-[0_0_18px_rgba(255,255,255,0.9)]" />
      <div className="absolute left-[63%] top-[62%] h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,248,250,0.9)]" />
      <div className="absolute bottom-[12%] left-[16%] right-[16%] h-9 rounded-full bg-[radial-gradient(circle,rgba(250,228,232,0.56)_0%,rgba(250,228,232,0.14)_60%,rgba(255,255,255,0)_82%)] blur-2xl" />
    </div>
  );
}

function HeroVariant({
  primaryHref,
  secondaryHref,
  primaryLabel
}: Required<Pick<BelaCodeEditorialFeatureProps, "primaryHref" | "secondaryHref" | "primaryLabel">>) {
  return (
    <section className="bg-bpOffWhite pb-16 pt-5 text-bpBlack md:pb-20 md:pt-8">
      <div className="mx-auto w-full max-w-[1320px] px-4 md:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-[#ecdde0] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82)_0%,rgba(247,236,238,0.94)_42%,rgba(251,247,244,1)_100%)] shadow-[0_26px_72px_rgba(184,142,142,0.07)] md:rounded-[42px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(255,255,255,0.78),transparent_34%),radial-gradient(circle_at_69%_28%,rgba(244,218,223,0.62),transparent_22%),radial-gradient(circle_at_78%_62%,rgba(255,255,255,0.64),transparent_20%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(91,49,56,0.06)_0.7px,transparent_0.7px)] [background-position:0_0] [background-size:14px_14px]" />

          <div className="relative grid gap-10 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(470px,0.9fr)] lg:items-center lg:gap-8 lg:px-12 lg:py-14 xl:px-16 xl:py-16">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/78 sm:text-xs sm:tracking-[0.14em]">
                BelaCode / Precision Beauty System
              </p>
              <h2 className="mt-5 max-w-[11ch] text-balance font-display text-[2.55rem] leading-[0.97] tracking-[-0.035em] text-bpBlack sm:text-[3.9rem] lg:text-[4.7rem] xl:text-[5rem]">
                Sua pele, lida com precisao silenciosa.
              </h2>
              <p className="mt-6 max-w-[22ch] text-balance text-[1rem] leading-8 text-bpGraphite/88 sm:text-[1.12rem] lg:max-w-[28ch] lg:text-[1.24rem] lg:leading-9">
                Uma leitura visual sofisticada que traduz sinais da pele em curadoria de rotina, orientacao de autocuidado e inteligencia cosmetica.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
                <Button
                  href={primaryHref}
                  variant="accent"
                  className="min-w-[190px] rounded-full border-0 bg-[#cfaab0] text-white shadow-[0_18px_38px_rgba(184,142,142,0.22)] hover:bg-[#c39aa2]"
                >
                  {primaryLabel}
                </Button>
                <Button
                  href={secondaryHref}
                  variant="secondary"
                  className="min-w-[190px] rounded-full border border-[#dbcacc] bg-white/34 text-bpGraphite shadow-none backdrop-blur hover:border-[#ceb7ba] hover:bg-white/56 hover:text-bpBlack"
                >
                  Entender a tecnologia
                </Button>
              </div>
            </div>

            <div className="min-w-0">
              <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_312px] xl:grid-cols-[minmax(0,1fr)_332px]">
                <ScanCapsuleVisual />

                <div className="relative mx-auto w-full max-w-[344px] rounded-[28px] border border-[#e8d7da] bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.34))] p-5 shadow-[0_15px_40px_rgba(184,142,142,0.07),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[14px] sm:p-6">
                  <p className="font-display text-[1.55rem] leading-none tracking-[-0.03em] text-bpBlackSoft sm:text-[1.75rem]">
                    BelaCode Editorial Scan
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#ecdcde] bg-white/56 px-4 py-2 text-sm text-bpGraphite/86">
                    <span>Analise em andamento</span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#ead1d5]" />
                      <span className="h-2 w-2 rounded-full bg-[#e3c2c9]" />
                      <span className="h-2 w-2 rounded-full bg-[#ddb4bc]" />
                    </span>
                  </div>

                  <div className="mt-7 border-b border-[#eadadd] pb-6">
                    <p className="font-display text-[4.5rem] leading-none tracking-[-0.05em] text-bpBlack sm:text-[5.1rem]">76</p>
                    <div className="mt-4 space-y-1.5 font-display text-[1.08rem] leading-[1.45] tracking-[-0.02em] text-bpBlackSoft sm:text-[1.22rem]">
                      {signalCopy.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <p className="font-display text-[1.55rem] leading-none tracking-[-0.03em] text-bpBlackSoft sm:text-[1.72rem]">
                      Curadoria orientada
                    </p>
                    <ul className="mt-4 space-y-3 text-[1.02rem] leading-7 text-bpGraphite/92 sm:text-[1.08rem]">
                      {routineItems.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-2 h-3 w-3 shrink-0 rounded-full border border-[#b88e8e] bg-transparent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-7 border-t border-[#eadadd] pt-5 text-[0.95rem] leading-7 text-bpGraphite/84">
                    Leitura baseada em sinais visuais e literatura clinica.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative border-t border-[#ede1e3] px-5 py-4 sm:px-8 lg:px-16">
            <p className="text-[0.72rem] leading-6 text-bpGraphite/66 sm:text-[0.76rem]">
              BelaCode e SkinBela apoiam triagem cosmetica, leitura de rotina e orientacao de autocuidado com base em literatura clinica. Nao substituem avaliacao medica dermatologica, dermatoscopia, biopsia ou decisao clinica presencial quando houver lesoes novas, mudancas suspeitas ou sinais de alerta.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessVariant({
  primaryHref,
  primaryLabel
}: Required<Pick<BelaCodeEditorialFeatureProps, "primaryHref" | "secondaryHref" | "primaryLabel">>) {
  return (
    <section className="bg-bpOffWhite pb-16 pt-2 text-bpBlack md:pb-20 md:pt-4">
      <div className="mx-auto w-full max-w-[1320px] px-4 md:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-[#eadbdd] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,238,240,0.72))] shadow-[0_22px_60px_rgba(184,142,142,0.08)] md:rounded-[40px]">
          <div className="pointer-events-none absolute right-[-10%] top-[6%] h-56 w-56 rounded-full bg-[#f0dde0] blur-3xl" />
          <div className="pointer-events-none absolute left-[-8%] bottom-[-20%] h-48 w-48 rounded-full bg-white/80 blur-3xl" />

          <div className="relative grid gap-8 px-5 py-7 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10 lg:px-12 lg:py-10">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.26em] text-bpRoseGold">Como a experiencia funciona</p>
              <h2 className="mt-4 max-w-[12ch] text-balance font-display text-[2rem] leading-[1] tracking-[-0.03em] text-bpBlack sm:text-[2.8rem] lg:text-[3.25rem]">
                Tres passos. Uma leitura mais clara.
              </h2>
              <p className="mt-5 max-w-[32rem] text-[0.98rem] leading-7 text-bpGraphite/86 sm:text-[1.05rem] sm:leading-8">
                O BelaCode observa a pele, o SkinBela organiza a leitura e a plataforma devolve uma rotina simples de seguir.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  href={primaryHref}
                  variant="accent"
                  className="min-w-[180px] rounded-full border-0 bg-[#cfaab0] text-white shadow-[0_18px_38px_rgba(184,142,142,0.20)] hover:bg-[#c39aa2]"
                >
                  {primaryLabel}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {processSteps.map((step) => (
                  <div
                    key={step.index}
                    className="rounded-[24px] border border-[#eadadd] bg-white/76 px-4 py-5 shadow-[0_12px_30px_rgba(184,142,142,0.05)] backdrop-blur"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dcc5c8] bg-[#fcf4f5] text-[11px] font-semibold tracking-[0.2em] text-bpBlackSoft">
                      {step.index}
                    </span>
                    <p className="mt-4 font-display text-[1.22rem] leading-tight tracking-[-0.02em] text-bpBlackSoft">
                      {step.title}
                    </p>
                    <p className="mt-2 text-[0.92rem] leading-6 text-bpGraphite/86">{step.body}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-[#eadadd] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,238,240,0.68))] px-5 py-5 shadow-[0_16px_38px_rgba(184,142,142,0.05)]">
                <p className="text-[10px] uppercase tracking-[0.24em] text-bpRoseGold">Base cientifica</p>
                <p className="mt-3 max-w-[42rem] text-[0.94rem] leading-7 text-bpGraphite/86">
                  A leitura estetica conversa com literatura clinica de alto nivel, mas a experiencia entrega isso em orientacao de rotina clara e utilizavel.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {evidencePillars.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-[#e4d3d6] bg-white/82 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/78"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BelaCodeEditorialFeature({
  primaryHref = "/conta/skincare",
  secondaryHref = "/belacode",
  primaryLabel = "Iniciar leitura",
  variant = "hero"
}: BelaCodeEditorialFeatureProps) {
  if (variant === "process") {
    return (
      <ProcessVariant
        primaryHref={primaryHref}
        secondaryHref={secondaryHref}
        primaryLabel={primaryLabel}
      />
    );
  }

  return (
    <HeroVariant
      primaryHref={primaryHref}
      secondaryHref={secondaryHref}
      primaryLabel={primaryLabel}
    />
  );
}

export { BelaCodeEditorialFeature as FaceShieldEditorialFeature };
