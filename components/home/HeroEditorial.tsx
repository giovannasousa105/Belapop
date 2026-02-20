import { Button } from "@/components/ui/Button";

export function HeroEditorial() {
  return (
    <section className="bg-bpBlack text-bpOffWhite">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-20 md:px-8 md:py-28">
        <p className="text-sm uppercase tracking-[0.2em] text-bpPinkSoft">
          Curadoria Editorial
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          A pausa que desperta.
        </h1>
        <p className="mt-4 max-w-xl text-base text-bpPinkSoft/90 md:text-lg">
          Curadoria editorial de beleza e autocuidado — para quem escolhe presença.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/catalogo" variant="primary" className="bg-bpOffWhite text-bpBlack hover:bg-bpPinkSoft">
            Explorar curadoria
          </Button>
          <Button
            href="/diario"
            variant="secondary"
            className="border-bpPinkSoft/40 text-bpOffWhite hover:bg-bpBlackSoft"
          >
            Ler o Diario
          </Button>
        </div>
      </div>
    </section>
  );
}
