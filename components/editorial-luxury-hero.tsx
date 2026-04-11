import Link from "next/link";

const modelImage = "/hero-bela.jpg";

type EditorialLuxuryHeroProps = {
  primaryHref?: string;
  secondaryHref?: string;
};

export default function EditorialLuxuryHero({
  primaryHref = "/skin-scan",
  secondaryHref = "/vitrine"
}: EditorialLuxuryHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#F7F2EE]">
      <div className="mx-auto grid min-h-[84vh] max-w-[1680px] grid-cols-1 lg:grid-cols-[0.93fr_1.07fr]">
        <div className="relative z-20 flex items-center px-8 py-16 sm:px-12 md:px-16 lg:px-20 xl:px-24">
          <div className="max-w-[470px]">
            <h1 className="max-w-[410px] font-editorial text-[48px] leading-[0.94] tracking-[-0.05em] text-[#111111] sm:text-[60px] lg:text-[72px] xl:text-[80px]">
              Sua beleza,
              <br />
              guiada por
              <br />
              inteligência
            </h1>

            <p className="mt-8 max-w-[410px] font-editorial text-[17px] leading-[1.6] text-[#2A2725]/86 sm:text-[19px]">
              Curadoria premium. Tecnologia invisível.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={primaryHref}
                className="inline-flex min-w-[16rem] justify-center rounded-[11px] border border-[#2C2926] bg-transparent px-8 py-[15px] font-editorial text-[17px] leading-none text-[#171513] transition hover:bg-[#171513] hover:text-white"
              >
                Começar análise
              </Link>

              <Link href={secondaryHref} className="hidden">
                Explorar vitrine
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[520px] lg:min-h-[84vh]">
          <img
            src={modelImage}
            alt="Modelo em ritual de skincare com brilho e textura luminosa"
            className="absolute inset-0 h-full w-full object-cover object-[75%_center] lg:object-[73%_center]"
          />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#F7F2EE_0%,rgba(247,242,238,0.985)_18%,rgba(247,242,238,0.94)_29%,rgba(247,242,238,0.78)_40%,rgba(247,242,238,0.48)_50%,rgba(247,242,238,0.14)_60%,rgba(247,242,238,0)_70%)]" />
          <div className="pointer-events-none absolute inset-y-[-10%] left-[-6%] w-[30%] rounded-full bg-white/82 blur-[110px]" />
          <div className="pointer-events-none absolute inset-y-[6%] left-[20%] w-[14%] rounded-full bg-white/68 blur-[82px]" />
        </div>
      </div>
    </section>
  );
}
