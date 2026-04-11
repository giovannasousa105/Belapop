"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Flame, Menu, Sparkles, Star } from "lucide-react";
import { useState } from "react";

import { ImmersiveBottomNav } from "@/components/popclub/shared/ImmersiveBottomNav";
import { ImmersiveMenuDrawer } from "@/components/popclub/shared/ImmersiveMenuDrawer";
import { homeBottomNavItems, homeMenuLinks } from "@/lib/popclub/navigation";

const selectedProducts = [
  {
    brand: "La Mer",
    title: "Hidratacao essencial",
    price: "R$ 2.450",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAmpN9Gfj2ITQJWIWXrozL_yowY95e-rAoCxzbx8ciS9q0Nv5ItztCO7Tqh006SIzdHS5l6-8fSI2TFVI46KreL1TZhvhZBDcR2idp13ShAmK1LZ6AJ_NMTPzudYxXGJJcvDykWpc1ie-Krith-2Raj2e54wqioorFCJjGAaJX48UFSELAcItoHbPwE4mO2W6k0d23aMOYDjZ0l_KUD6gy7KYNWkY-TrrB3Sufc6ZXsPR7sXkmtk9Dy4koWYnb1WjJeoMlBtmVcrNUi"
  },
  {
    brand: "Chanel",
    title: "Le Lift Serum",
    price: "R$ 1.150",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtDmtOLZfFpoQaLEI_Q-ND6HjC17lUh4PABmLOGnQSN8OE7J_6VRGsNvaMLTmQMzZ0MTKFwCfEZ8gpEOtJA5bB2ymbasggtZYQWtaA5ULfGTsGwGuaorWVjXUme-n0GdO6sZRORtze1TG7udYgP1v6Kb1mkmqfjalHT9lDXHLUvuAa5V55XsUVoliw7AihOCzm8ZQZb-24I_tvKbQydNp9Aer6QIzkhp7w6CvG0q9-VwlrZvfVEYP3VwPE3HPWEPkgLTZoXoX4M9ip"
  }
] as const;

const activeBenefits = [
  "Acesso antecipado",
  "Beneficios do programa",
  "Acesso a acoes e ativacoes selecionadas, quando disponiveis"
] as const;

const explorationCards = [
  { icon: Sparkles, title: "Explorar novidades", href: "/skincare" },
  { icon: Flame, title: "Radar de drops", href: "/popclub/radar" },
  { icon: Sparkles, title: "Minha rotina", href: "/popclub/rotina" }
] as const;

export default function PopClubHomeExperience() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-24 text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcf9f8]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center text-[#1c1b1b]"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-[var(--font-playfair)] text-2xl font-bold uppercase tracking-[0.2em]">
            PopClub
          </span>
          <div className="h-8 w-8 overflow-hidden rounded-full border border-black/10 bg-[#e5e2e1]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1563xRoRq5vRheJA45fhg7X4eZ82lvYVrSgawUgITH74RnVeCpFtwwUKhk9UMcKNNne4Et4d89KZZqhQp_XkDs7sdtbpeJSXN0BCbcGY2BugKDtZ8XD21UlQB5NwyREgbjqmcoW6BF67XrNhftodkJSaFihbAeIjlXhAYb-rjAUPS_q_4kiWdwBx6wU59jx0FIZma05fk7K0m1Q_iNCdfJresE4m_JBQorooMkd-exjCnxj7Y8EJSvt0fHhn3CHOnXTLTz_nIW_T2"
              alt="Perfil"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </header>

      <ImmersiveMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="PopClub"
        links={homeMenuLinks}
        searchPlaceholder="Buscar beneficios"
      />

      <main className="mx-auto max-w-7xl px-6 pb-10 pt-24 lg:px-10 lg:pt-28">
        <section className="mb-12 grid gap-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.62fr)]">
          <div className="space-y-8">
            <div className="max-w-2xl">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#444748]/65">
                Dashboard membership
              </p>
              <h1 className="font-[var(--font-playfair)] text-4xl font-bold tracking-tight lg:text-6xl">
                Bem-vinda de volta, Giovanna
              </h1>
              <p className="mt-4 text-lg tracking-tight text-[#444748]/80">
                Seu PopClub esta ativo e pronto para acompanhar sua rotina com mais continuidade.
              </p>
            </div>

            <Link
              href="/skin-scan"
              className="group relative flex aspect-[4/6] flex-col justify-end overflow-hidden rounded-[30px] bg-black p-8 sm:aspect-[16/10] lg:aspect-[4/3]"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMrwGLXxwcdP0-4Gm-xoLzVWcl-kZIHPs4AT_i7eU-Nsbypbu44Fy4m4Mnb5K-TDnJBb8GoxrYNCCtOrYoPXk_TXdvo_UaU32NLbLDvBPguh9F1bRQDILV12cIbZk46CGgP_cBLK79SKR2BZqO62t9ThKd-HVRh1Z37ZISYWvoAzy50igfd3T2iOqBE1NldBqsfN7POTV58RxH_YWclcCTbDB2A3ZSW_EGDdLUz1HiRQhUxQUZmgnhfU70TLyNgfLCl88DXdJVS8vq"
                alt="Skin Scan"
                className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative z-10 flex max-w-xl flex-col items-start gap-4 text-left">
                <span className="bg-[#ed93d5]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  Comece por aqui
                </span>
                <div className="space-y-2">
                  <h2 className="font-[var(--font-playfair)] text-[24px] font-semibold text-white lg:text-[36px]">
                    Faca seu Skin Scan
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-white/80 lg:text-base">
                    Descubra sua rotina ideal com base no seu perfil unico e receba
                    indicacoes editoriais mais precisas.
                  </p>
                </div>
                <div className="inline-flex h-12 min-w-[220px] items-center justify-center bg-white px-8 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition-colors group-hover:bg-[#ed93d5] group-hover:text-white">
                  Fazer meu Skin Scan
                </div>
              </div>
            </Link>
          </div>

          <aside className="grid gap-6 lg:content-start">
            <section className="bg-[#f6f3f2] p-6 lg:p-7">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#444748]">
                  Membro desde 2023
                </span>
                <span className="rounded-full bg-[#f6f3ec] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b89c6a]">
                  Ouro
                </span>
              </div>
              <div className="mt-4 h-[2px] w-full bg-[#e5e2e1]">
                <div className="h-full w-[75%] bg-[#ed93d5]" />
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-[#444748]">
                Faltam 250 pontos para o nivel Diamante
              </p>
            </section>

            <section className="rounded-[24px] border border-black/[0.05] bg-white/75 p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#444748]/65">
                Seu momento agora
              </p>
              <div className="space-y-4">
                <div className="rounded-[18px] bg-[#f6f3f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]/60">
                    Insight
                  </p>
                  <p className="mt-2 font-[var(--font-playfair)] text-xl leading-tight">
                    Sua proxima vantagem esta no fluxo Skin Scan.
                  </p>
                </div>
                <div className="rounded-[18px] bg-[#f6f3f2] p-4 text-sm leading-relaxed text-[#444748]">
                  Complete a analise para transformar beneficios e sugestoes organizadas com base
                  no seu perfil em uma rotina mais clara.
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.72fr)]">
          <div>
            <div className="mb-8 flex items-center justify-between px-1">
              <h3 className="font-[var(--font-playfair)] text-xl font-bold tracking-tight lg:text-3xl">
                Selecionado para voce
              </h3>
              <Link
                href="/skincare"
                className="border-b border-black/20 pb-px text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]"
              >
                Ver tudo
              </Link>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
              {selectedProducts.map((product) => (
                <article
                  key={product.title}
                  className="min-w-[260px] border border-black/[0.03] bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] lg:min-w-0"
                >
                  <div className="mb-4 aspect-[4/5] overflow-hidden bg-[#f6f3f2]">
                    <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-black/40">
                      {product.brand}
                    </p>
                    <h4 className="font-[var(--font-playfair)] text-xl leading-tight">
                      {product.title}
                    </h4>
                    <p className="text-sm text-[#444748]">{product.price}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-10">
            <section>
              <h3 className="mb-8 font-[var(--font-playfair)] text-xl font-bold tracking-tight lg:text-3xl">
                Seus beneficios ativos
              </h3>
              <div className="space-y-5">
                {activeBenefits.map((item) => (
                  <div key={item} className="flex items-center gap-6 border-b border-black/[0.05] pb-4">
                    <Star className="h-6 w-6 text-black/60" />
                    <div className="flex-1">
                      <h4 className="text-xs font-extrabold uppercase tracking-[0.22em]">
                        {item}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[#444748]/65">
                Explore o clube
              </p>
              <div className="grid gap-4 lg:grid-cols-1 xl:grid-cols-3">
                {explorationCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="relative flex min-h-[220px] flex-col justify-between overflow-hidden bg-[#e5e2e1]/40 p-8"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_70%)] opacity-60" />
                      <Icon className="relative z-10 h-8 w-8 opacity-50" />
                      <h5 className="relative z-10 font-[var(--font-playfair)] text-[18px] font-medium leading-tight">
                        {card.title}
                      </h5>
                    </Link>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>
      </main>

      <ImmersiveBottomNav activeTone="pink" items={homeBottomNavItems} />
    </div>
  );
}
