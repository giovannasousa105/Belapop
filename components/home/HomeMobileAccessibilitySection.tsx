import { Section } from "@/components/ui/Section";

const comfortItems = [
  "Botoes grandes e areas de toque generosas.",
  "Contraste alto para leitura em ambiente real.",
  "Cards mais limpos, com menos ruido visual.",
  "Fluxo curto para analise, rotina e compra."
];

const focusItems = [
  "Tipografia legivel em mobile e desktop",
  "Leitura confortavel para vitrines longas",
  "CTAs visiveis sem poluir o layout",
  "Navegacao clara para descoberta e conversao"
];

export function HomeMobileAccessibilitySection() {
  return (
    <Section className="bg-bpOffWhite pt-0">
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[32px] border border-bpPink/16 bg-[linear-gradient(180deg,rgba(232,184,203,0.18),rgba(255,255,255,0.78))] p-6 shadow-[0_22px_56px_rgba(91,49,56,0.06)] md:p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-bpRoseGold">Mobile e acessibilidade</p>
          <h2 className="mt-4 font-display text-3xl leading-[1.02] text-bpBlack md:text-5xl">
            No celular, a compra precisa ser linda, clara e confortavel.
          </h2>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-bpGraphite/84 md:text-base">
            {comfortItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-bpPinkCta" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[32px] border border-bpPink/16 bg-white/82 p-6 shadow-[0_22px_56px_rgba(91,49,56,0.05)] md:p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-bpRoseGold">Principios da interface</p>
          <div className="mt-6 grid gap-3">
            {focusItems.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-bpPink/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,232,234,0.52))] px-4 py-4 text-sm leading-6 text-bpBlack"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
