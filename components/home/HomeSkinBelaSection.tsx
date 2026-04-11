import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

const steps = [
  {
    index: "01",
    title: "Escaneie com orientacao simples",
    body: "A captura organiza luz, enquadramento e expressao para transformar o scan em uma experiencia clara e premium."
  },
  {
    index: "02",
    title: "Receba a leitura da pele",
    body: "O SkinBela traduz textura, conforto, luminosidade e sensibilidade sem jargao tecnico desnecessario."
  },
  {
    index: "03",
    title: "Compre com mais precisao",
    body: "A rotina e os produtos aparecem em ordem de uso, prioridade e compatibilidade com o seu momento de pele."
  }
];

export function HomeSkinBelaSection() {
  return (
    <Section id="skinbela" className="bg-bpOffWhite pt-0">
      <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-bpRoseGold">SkinBela</p>
          <h2 className="mt-4 font-display text-3xl leading-[1.04] text-bpBlack md:text-5xl">
            A leitura da pele precisa parecer sofisticada e facil de entender.
          </h2>
          <p className="mt-5 text-base leading-8 text-bpGraphite/84 md:text-lg">
            O SkinBela organiza o scan, a interpretacao e a recomendacao em uma jornada curta.
            O visitante entende rapidamente que a BelaPop nao e uma loja comum. Ela usa
            inteligencia de beleza para orientar escolha, rotina e compra.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              href="/conta/skincare"
              variant="accent"
              className="rounded-full border-0 bg-bpPinkCta text-white shadow-[0_18px_42px_rgba(213,30,113,0.18)]"
            >
              Fazer analise de pele
            </Button>
            <Button
              href="/belacode"
              variant="secondary"
              className="rounded-full border border-bpPink/26 bg-white/80 text-bpBlack shadow-none hover:bg-bpPinkLux/68"
            >
              Entender a tecnologia
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.index}
              className="rounded-[28px] border border-bpPink/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,232,234,0.72))] p-5 shadow-[0_20px_56px_rgba(91,49,56,0.06)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bpPinkCta text-sm font-semibold tracking-[0.2em] text-white">
                {step.index}
              </div>
              <h3 className="mt-5 font-display text-[1.5rem] leading-[1.02] text-bpBlack">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-bpGraphite/82">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
