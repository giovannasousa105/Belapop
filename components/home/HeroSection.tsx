import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { getPublicAsset } from "@/lib/publicEnv";

type HeroSectionProps = {
  imageUrl?: string | null;
};

const routineSuggestions = [
  "Cleanser calmante",
  "Serum reparador",
  "Moisturizer restaurador",
  "Fotoprotecao diaria"
];

export function HeroSection({ imageUrl }: HeroSectionProps) {
  const resolvedImage =
    typeof imageUrl === "string" && imageUrl.trim().length > 0 ? imageUrl : "/logo-dark.svg";
  const brandLogoUrl = getPublicAsset(process.env.NEXT_PUBLIC_LOGO_URL, "/logo-dark.svg");
  const heroIsSvg = resolvedImage.toLowerCase().includes(".svg");
  const logoIsSvg = brandLogoUrl.toLowerCase().includes(".svg");

  return (
    <section className="bg-[linear-gradient(180deg,#F6E8EA_0%,#FBF7F4_74%,#FBF7F4_100%)] pb-16 pt-10 text-[#1E1E1E] md:pb-20 md:pt-14">
      <div className="mx-auto w-full max-w-[1240px] overflow-x-clip px-4 md:px-8">
        <div className="relative overflow-hidden rounded-[40px] border border-[#ead7da] bg-[linear-gradient(135deg,rgba(255,255,255,0.68),rgba(246,232,234,0.9)_54%,rgba(251,247,244,0.98))] shadow-[0_32px_90px_rgba(91,49,56,0.10)]">
          <div className="pointer-events-none absolute left-[-48px] top-[-72px] h-56 w-56 rounded-full bg-[#eed5da] blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-64px] right-[-32px] h-56 w-56 rounded-full bg-[#e7c6cd]/80 blur-3xl" />

          <div className="grid gap-0 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="px-5 py-10 sm:px-7 sm:py-12 md:px-12 md:py-16">
              <div className="inline-flex items-center gap-4 rounded-[24px] border border-[#d7b9bf] bg-white/96 px-3 py-3 shadow-[0_16px_34px_rgba(91,49,56,0.1)] backdrop-blur">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[#d8a0ac]/40 bg-[linear-gradient(180deg,#f9e3e8_0%,#f3d0d8_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <Image
                    src={brandLogoUrl}
                    alt="BelaPop"
                    width={84}
                    height={84}
                    className="h-10 w-10 object-contain"
                    priority
                    unoptimized={logoIsSvg}
                  />
                </div>
                <div className="min-w-0 pr-2">
                  <p className="font-display text-[1.18rem] leading-none tracking-[-0.02em] text-[#5B3138]">
                    BelaPop
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.26em] text-[#1E1E1E]/82 sm:text-[11px]">
                    Beauty Intelligence Platform
                  </p>
                </div>
              </div>

              <p className="mt-8 text-[11px] uppercase tracking-[0.34em] text-[#5B3138]/82">
                BelaPop - Beauty Intelligence Platform
              </p>
              <h1 className="mt-5 max-w-3xl text-balance font-display text-[1.98rem] font-semibold leading-[0.98] tracking-[-0.03em] text-[#1E1E1E] sm:text-5xl md:text-7xl">
                A inteligencia de beleza que entende a sua pele.
              </h1>
              <p className="mt-5 max-w-2xl text-[0.96rem] leading-7 tracking-[-0.01em] text-[#1E1E1E]/86 md:mt-6 md:text-lg">
                Leitura da pele, curadoria de rotina e beleza guiada por inteligencia clinica.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["BelaCode", "SkinBela", "Literatura clinica"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#dfc9cd] bg-white/74 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#5B3138]/82"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
                <Button
                  href="/conta/skincare"
                  variant="accent"
                  className="text-[0.95rem] font-semibold tracking-[0.04em]"
                >
                  Descobrir minha leitura
                </Button>
                <Button
                  href="/belacode#como-funciona"
                  variant="secondary"
                  className="border-[#D8A0AC]/50 bg-white/80 text-[0.95rem] font-semibold tracking-[0.04em] text-[#1E1E1E] shadow-none hover:bg-white"
                >
                  Como funciona
                </Button>
              </div>

              <p className="mt-7 max-w-3xl text-[11px] leading-6 text-[#5B3138]/72 sm:mt-8 sm:text-xs">
                BelaCode e SkinBela apoiam triagem cosmetica, leitura de rotina e orientacao de
                autocuidado com base em literatura clinica. Nao substituem avaliacao dermatologica
                presencial.
              </p>
            </div>

            <div className="relative min-h-0 border-t border-[#ead7da] px-4 py-5 sm:min-h-[420px] sm:px-6 sm:py-7 lg:min-h-[560px] lg:border-l lg:border-t-0 lg:px-8 lg:py-8">
              <div className="absolute right-8 top-10 h-28 w-28 rounded-full bg-[#D8A0AC]/30 blur-3xl" />
              <div className="absolute bottom-10 left-8 h-28 w-28 rounded-full bg-white/60 blur-3xl" />

              <div className="relative z-10 h-full overflow-hidden rounded-[30px] border border-white/70 bg-white/52 p-4 shadow-[0_24px_80px_rgba(91,49,56,0.10)] backdrop-blur-md sm:rounded-[34px] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#5B3138]/72">
                      BelaCode Editorial Scan
                    </p>
                    <p className="mt-3 max-w-[13ch] text-balance font-display text-[1.28rem] font-semibold leading-[1.08] tracking-[-0.02em] text-[#1E1E1E] sm:max-w-[14ch] sm:text-[2rem]">
                      Leitura silenciosa e proprietaria
                    </p>
                  </div>
                  <div className="flex h-[84px] w-[84px] shrink-0 flex-col items-center justify-center self-start rounded-full border border-[#E2C8CE] bg-white/82 text-center shadow-[0_10px_24px_rgba(91,49,56,0.06)] sm:h-[92px] sm:w-[92px]">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#5B3138]/62">
                      Score
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[#1E1E1E] sm:text-2xl">76</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:mt-6 xl:grid-cols-[0.94fr_1.06fr]">
                  <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.98),rgba(246,232,234,0.62)_48%,rgba(216,160,172,0.18)_100%)] p-4 sm:rounded-[30px] sm:p-5">
                    <div className="absolute inset-x-[24%] top-[12%] h-[74%] rounded-[48%] bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.98),rgba(255,255,255,0.42)_58%,rgba(246,232,234,0.18)_100%)]" />
                    <div className="absolute left-[39%] top-[17%] h-14 w-14 rounded-full bg-[radial-gradient(circle,rgba(216,160,172,0.42),transparent_74%)] blur-sm" />
                    <div className="absolute left-[28%] top-[40%] h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(91,49,56,0.18),transparent_74%)] blur-sm" />
                    <div className="absolute right-[26%] top-[38%] h-14 w-14 rounded-full bg-[radial-gradient(circle,rgba(216,160,172,0.28),transparent_74%)] blur-sm" />
                    <div className="absolute left-[39%] bottom-[19%] h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(216,160,172,0.44),transparent_74%)] blur-sm" />
                    <div className="absolute bottom-3 left-3 right-3 rounded-[22px] border border-white/75 bg-white/74 px-3 py-3 backdrop-blur sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-[24px] sm:px-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-[#5B3138]/68">
                        Insight
                      </p>
                      <p className="mt-2 text-[0.92rem] leading-6 tracking-[-0.01em] text-[#1E1E1E] sm:text-sm sm:leading-relaxed">
                        Barreira sensibilizada e textura irregular.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[24px] border border-white/75 bg-white/68 px-4 py-4 sm:rounded-[26px] sm:px-5 sm:py-5">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-[#5B3138]/68">
                        Rotina sugerida
                      </p>
                      <div className="mt-4 space-y-3">
                        {routineSuggestions.map((item, index) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-full border border-[#EDD9DE] bg-[#FCF5F6] px-4 py-3"
                          >
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D8A0AC]/40 bg-white text-[10px] font-semibold leading-none text-[#5B3138]">
                              {index + 1}
                            </span>
                            <span className="min-w-0 break-words text-[0.94rem] text-[#1E1E1E] sm:text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[20px] border border-white/75 bg-white/62 px-4 py-4 sm:rounded-[22px]">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-[#5B3138]/62">
                          Motor
                        </p>
                        <p className="mt-2 break-words text-[0.92rem] font-medium text-[#1E1E1E] sm:text-sm">SkinBela Intelligence</p>
                      </div>
                      <div className="rounded-[20px] border border-white/75 bg-white/62 px-4 py-4 sm:rounded-[22px]">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-[#5B3138]/62">
                          Leitura
                        </p>
                        <p className="mt-2 break-words text-[0.92rem] font-medium text-[#1E1E1E] sm:text-sm">Editorial e personalizada</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] border border-white/75 bg-white/62 px-4 py-4 sm:rounded-[24px]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[18px] border border-[#E2C8CE] bg-[#F6E8EA]">
                      <Image
                        src={resolvedImage}
                        alt="Curadoria inteligente BelaPop"
                        fill
                        sizes="64px"
                        className="object-cover opacity-88"
                        unoptimized={heroIsSvg}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-[#5B3138]/62">
                        Leitura baseada em sinais visuais e literatura clinica.
                      </p>
                      <p className="mt-2 text-[0.92rem] leading-6 text-[#1E1E1E]/78 sm:text-sm sm:leading-relaxed">
                        Luxo editorial, respiro visual e tecnologia proprietaria sem aparencia de dashboard frio.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
