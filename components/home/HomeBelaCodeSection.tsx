import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

const compatibilitySignals = [
  { label: "Barreira cutanea", value: 88 },
  { label: "Luminosidade", value: 74 },
  { label: "Textura", value: 81 },
  { label: "Sensibilidade", value: 69 }
];

const pillars = [
  {
    title: "SkinBela",
    text: "Analise inteligente da pele para transformar cuidado em decisao precisa."
  },
  {
    title: "BelaCode",
    text: "Um perfil de beleza unico que conecta o rosto, a rotina e a evolucao do cuidado."
  },
  {
    title: "Curadoria BelaPop",
    text: "Produtos escolhidos por performance, sensorialidade, formula e desejo."
  }
];

export function HomeBelaCodeSection() {
  return (
    <Section id="belacode" className="bg-bpBlack text-bpOffWhite">
      <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-stretch">
        <div className="rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)] md:p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-bpPinkSoft">BelaCode</p>
          <h2 className="mt-4 font-display text-3xl leading-[1.02] text-white md:text-5xl">
            O codigo da pele vira a inteligencia da compra.
          </h2>
          <p className="mt-5 text-base leading-8 text-white/72 md:text-lg">
            O BelaCode organiza sinais da pele, preferencias e compatibilidade em um perfil
            proprietario. Isso deixa a plataforma mais precisa, mais aspiracional e mais
            coerente com uma experiencia premium de skincare.
          </p>
          <div className="mt-8">
            <Button
              href="/belacode"
              variant="accent"
              className="rounded-full border-0 bg-bpPinkCta text-white shadow-[0_18px_38px_rgba(213,30,113,0.18)]"
            >
              Ver o BelaCode
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[32px] border border-bpPink/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-bpPinkSoft">Mapa de compatibilidade</p>
                <h3 className="mt-2 font-display text-2xl text-white">Perfil ativo e legivel</h3>
              </div>
              <span className="rounded-full border border-bpPink/30 bg-bpPink/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-bpPinkSoft">
                Atualizado
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {compatibilitySignals.map((signal) => (
                <div key={signal.label}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="text-white">{signal.label}</span>
                    <span className="text-bpPinkSoft">{signal.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-bpPink" style={{ width: `${signal.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-white/10 bg-white/5 p-5"
              >
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
