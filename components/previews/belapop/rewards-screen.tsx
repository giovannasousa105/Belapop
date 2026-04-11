/* eslint-disable @next/next/no-img-element */

import { Bot, Crown, Gift, LayoutDashboard, Lock, Settings, Sparkles } from "lucide-react";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import { previewHeadlineFont } from "./luxury-preview-theme";

const memberLinks = [
  { label: "Painel", icon: LayoutDashboard, active: false },
  { label: "Niveis de Status", icon: Crown, active: false },
  { label: "Vitrine de Recompensas", icon: Gift, active: true },
  { label: "SkinBela AI", icon: Bot, active: false },
  { label: "Configuracoes", icon: Settings, active: false }
] as const;

const rewards = [
  {
    eyebrow: "Acessorios",
    title: "Espatula Metalica Signature",
    description: "Instrumento de precisao em aco cirurgico com acabamento escultural.",
    price: "1.200 pts",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOitwUeKvIL2ZP_V-pndXaDtpFfbdXjR-8dl0psIZeZ83eN4bKV3kopGG7xfq48ss_C5qpROKECtM2hDYbjNaFsjfi54sjQ7F-rJp95u0Df9KNLEhm42uHChEfIt3Do16O0Id6HCyc9_rtMb2fT9lFtjMOzGouYEeVmCdeU4t2W-w6rrxdMqDBlfFHfblRmLRHsbMhpeTJ2-HYimDeXJ-oTrbgOjQU4kOy5NOnHGGgyf3SQZ9BEYiwIep1oblmhiJvaAz3SHLEAEIV"
  },
  {
    eyebrow: "Viagem",
    title: "Kit Atelier de Viagem",
    description: "Selecao de miniaturas premium para voos longos e rotinas compactas.",
    price: "3.500 pts",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBv9hkSlo9Vz4CfLFcuUaDbfQ3piRpSY1xXy9bmNmWue7B778Cq-h4_Ikr1r8AZYdOrX8Rj1iiumP0ajig-fTyPdbc4ioOmwVxwjVo_Pk8nLo9olS3HL_gzMfP_0L9EgXZkF7ThEoVkWffpP9YDAvLbrWxo8hY22Urjw5G9DJE_SnbEJNa-WeOSIFZQWH1OpGwFseelal8WDy1gyeIgqMK6LE_ua0I5_S6YP62AXdgfwjUPLCEkSVTAlLsjqTgIz0Jg8Jc-r8_8Dp0Y"
  },
  {
    eyebrow: "Equipamento",
    title: "Pincel de Escultura Facial",
    description: "Cerdas ultrafinas com detalhes dourados para um ritual de cabine.",
    price: "8.000 pts",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCWHJ1mKTDOycyx3UKg_bpFrKSqe1pg_RvaQYJNGjTTtFDwEOaWU47TIy8SA6LZIptWSFJHtsPfHe5V_-wFaWjG6Rr-pFsrRzmgvHxd1uYofFpkcUA66XioeuqnKZhIrJOBjWJTnnLHpj1ooKa3kwo_Vy3G-bPQYI4S48jHLlhRmJFmYZetyh4jOmm_m7XU3_AnnQkkuPTdaVuRA-s1nkuICQyX9Z5EIHf9Is73WfaXMtYJTLsDngVOrhlFB96VCzP7HGc2AZXU8tmB"
  },
  {
    eyebrow: "Lifestyle",
    title: "Vela Santal and Silk",
    description: "Aromaterapia em vidro artesanal para prolongar a atmosfera do atelier.",
    price: "2.800 pts",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBIGi5znfBGOQheBxmImV_pTsHgrBtW_CQHYsWGvtqqyvijHlq4fYg2wlI4sy3BYwOPeR81MbxBeQM6Prjb8s_DhTtxlyF1enkl7t6VGnOygBBE-oWihdQOXAPWbLJUIYD36ayJCuhaCsJ4sK_nyCdOhAyD-MT1MDc2ezm1g9A_ckOIdtBQ4NeXqhSrZQ-bFOx7F2-zd3-2c1hXUHUwRBEZ3HxZRjGAoQZ1PIIlMVUGbyWLhiIivfVkZm05JwqJgyk3-kDT5-U1WbMx"
  }
] as const;

const boutiqueItems = [
  {
    badge: "Ouro +",
    title: "O Elixir Profissional Vol. 500ml",
    subtitle: "Formula mestre",
    price: "R$ 1.485,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCMI3PizvrWNPhx5BSYNKycwMPI6FcTmH2UCfGlHlX9dEgyZKUMCcql2zvQ9jRamJHsAll0VcZwMXUILLR0FTeyzt1-B4uFQVGozMdL4OcP6qMil0VaYKAcMIS6A0lZaNkDfbIa6e7clNykGywQZtUTLyv32ZYttAuTf1W2B3LeMlEHNiF28mR78cIm3VmAepOhYE6ALsAU8bh8dJtWryQfNkYGHoKa3pIBPUPGEnVCaLR-Y18viS4evkfxtQE_3qPIJvO4iIdkukos",
    locked: false
  },
  {
    badge: "Platinum exclusivo",
    title: "Complexo Celestial Noturno",
    subtitle: "Lote limitado",
    price: "R$ 2.450,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDLXFLBLxTwv4v8Z_84lAEzDhB3LusHFzyzkWEVUsVCw4s_zB-QakxrTfp8BiBfLTrFgTot3Mk_RBfBj4VrmxHtzmXUqXuqfzwJQtpWQ_ygRFIe-JgfaWIvKhBF9AP05iVi_VmDIRrlhe3BkLcOaatKHxh1xPWzGOkB2PBMf10S6C4ARgw7VWcKidXzF83FZH4cs6sFbGsADpTt2XiHeuS_6lR3C6HrYNoP02kwIDc5XJ4LOXGRXXNKShMq6W7ak9koBhUpGnfGxEwE",
    locked: true
  }
] as const;

export function RewardsPreviewScreen() {
  return (
    <LuxuryPreviewFrame activeItem="POPCLUB">
      <main className="bg-[#fcf9f8] pt-[72px]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[250px,minmax(0,1fr)] lg:px-8 lg:py-12">
          <aside className="space-y-5 lg:sticky lg:top-28 lg:h-fit">
            <div className="bg-black p-6 text-white">
              <p className={`${previewHeadlineFont.className} text-2xl italic`}>Alexandria V.</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-white/60">
                Membro categoria ouro
              </p>
              <div className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#dac769]">
                <Crown className="h-4 w-4" />
                24.850 pontos disponiveis
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto lg:hidden">
              {memberLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`inline-flex min-w-max items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] ${
                      item.active ? "bg-black text-white" : "bg-white text-[#444748]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <nav className="hidden space-y-2 lg:block">
              {memberLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href="#"
                    className={`flex items-center gap-3 px-4 py-4 text-[10px] uppercase tracking-[0.22em] ${
                      item.active
                        ? "bg-[#f6f3f2] font-bold text-black"
                        : "text-[#6b7280] transition-colors hover:bg-white hover:text-black"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <button className="hidden min-h-14 w-full items-center justify-center bg-black px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ef75ce] lg:inline-flex">
              Upgrade para platinum
            </button>
          </aside>

          <div className="space-y-16 lg:space-y-24">
            <section className="grid gap-6 border-b border-black/6 pb-12 md:grid-cols-12 md:items-end">
              <div className="md:col-span-7">
                <span className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#ef75ce]">
                  Atelier privado
                </span>
                <h1 className={`${previewHeadlineFont.className} mt-4 text-4xl font-bold leading-[0.95] tracking-[-0.05em] sm:text-5xl lg:text-6xl`}>
                  Vitrine de
                  <br />
                  recompensas
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#444748]">
                  Galeria mobile first com recompensas premium, resgates imediatos e acesso a lotes reservados para membros.
                </p>
              </div>
              <div className="md:col-span-5">
                <div className="relative overflow-hidden bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#747878]">Saldo atual</p>
                  <p className={`${previewHeadlineFont.className} mt-3 text-5xl font-bold tracking-[-0.05em]`}>
                    24.850
                  </p>
                  <button className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] underline underline-offset-4">
                    Historico de resgates
                  </button>
                  <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-[#ef75ce]/10 blur-2xl" />
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <div className="max-w-2xl">
                <span className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#ef75ce]">
                  A edicao rara
                </span>
                <h2 className={`${previewHeadlineFont.className} mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-5xl`}>
                  Pecas de colecionador
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <article className="group relative overflow-hidden md:col-span-2">
                  <img
                    alt="Mascara de seda"
                    className="aspect-[16/11] w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9_jpTyAdop7PR175NHQwwYo6uYiOKGLKgBySCSMclGiCuv-XeFsnyl_5oat-SE0xBEjBR3-HqKQRFijfIbcKHOJY68Yy-1EroM3XhOsGmINAliIXsoGk4GA9yk5uPOhCsS6mDH44_heq9x17HJA8iESc5RXpKUnYr-ZrH3XfEX4t7oLDqVN4lTBJ550ViFN7BZr1k11Y69xLew7advplslJhi4KAc9fodNhhY_mg8zyUbakXsuWGRgDVTW5YTLYRoyWfPeuCcM7Pn"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-white/70">
                      Lancamento exclusivo
                    </p>
                    <h3 className={`${previewHeadlineFont.className} mt-4 text-3xl font-bold leading-tight sm:text-4xl`}>
                      Mascara de Seda
                      <br />
                      Mulberry Midnight
                    </h3>
                    <div className="mt-6 flex flex-col gap-4 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-lg font-semibold uppercase tracking-[0.2em]">5.000 pontos</span>
                      <button className="min-h-14 bg-white px-6 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition-colors hover:bg-[#ef75ce] hover:text-white">
                        Resgatar presente
                      </button>
                    </div>
                  </div>
                </article>

                <article className="border border-black/8 bg-white p-6">
                  <Sparkles className="h-6 w-6 text-[#ef75ce]" />
                  <h3 className={`${previewHeadlineFont.className} mt-4 text-2xl font-bold`}>
                    Convites privados
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#444748]">
                    Noites exclusivas, previews e encontros em ateliers internacionais.
                  </p>
                  <button className="mt-6 min-h-12 border border-black px-5 text-[10px] font-bold uppercase tracking-[0.22em] transition-colors hover:bg-black hover:text-white">
                    Ver calendario
                  </button>
                </article>
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#ef75ce]">
                    Resgates imediatos
                  </span>
                  <h2 className={`${previewHeadlineFont.className} mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl`}>
                    Objetos de desejo
                  </h2>
                </div>
                <a href="#" className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ef75ce] underline underline-offset-4">
                  Ver todos os beneficios
                </a>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {rewards.map((reward) => (
                  <article key={reward.title} className="flex flex-col border border-black/8 bg-white p-6">
                    <img alt={reward.title} className="aspect-square w-full object-cover" src={reward.image} />
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#ef75ce]">
                      {reward.eyebrow}
                    </p>
                    <h3 className={`${previewHeadlineFont.className} mt-3 text-2xl font-bold leading-tight`}>
                      {reward.title}
                    </h3>
                    <p className="mt-4 flex-1 text-sm leading-7 text-[#444748]">{reward.description}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-black/6 pt-5">
                      <span className={`${previewHeadlineFont.className} text-lg font-bold`}>
                        {reward.price}
                      </span>
                      <button className="min-h-11 border border-black px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-black hover:text-white">
                        Solicitar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-8 bg-[#f6f3f2] px-5 py-10 sm:px-8 lg:grid-cols-[320px,minmax(0,1fr)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.34em] text-black">
                  Boutique privada
                </span>
                <h2 className={`${previewHeadlineFont.className} mt-4 text-3xl font-bold leading-tight sm:text-5xl`}>
                  Colecoes para membros
                </h2>
                <p className="mt-5 text-base leading-7 text-[#444748]">
                  Formulações e volumes profissionais reservados para clientes com historico de curadoria.
                </p>
                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ef75ce]">
                    <Sparkles className="h-4 w-4" />
                    Acesso ouro desbloqueado
                  </div>
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[#747878]">
                    <Lock className="h-4 w-4" />
                    Cofre exclusivo platinum
                  </div>
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                {boutiqueItems.map((item, index) => (
                  <article key={item.title} className={`flex flex-col ${index === 1 ? "sm:translate-y-8" : ""}`}>
                    <div className="relative overflow-hidden border border-black/6 bg-white">
                      <img alt={item.title} className="aspect-[4/5] w-full object-cover" src={item.image} />
                      <span className="absolute right-4 top-4 bg-black px-3 py-1 text-[8px] uppercase tracking-[0.2em] text-white">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className={`${previewHeadlineFont.className} mt-5 text-2xl font-bold leading-tight`}>
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#747878]">
                      {item.subtitle}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <span className="text-lg font-bold">{item.price}</span>
                      {item.locked ? (
                        <div className="border border-black/20 px-3 py-2 text-[8px] uppercase tracking-[0.2em] text-[#747878]">
                          Bloqueado platinum
                        </div>
                      ) : (
                        <button className="min-h-11 bg-black px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ef75ce]">
                          Adicionar
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </LuxuryPreviewFrame>
  );
}
