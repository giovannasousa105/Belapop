"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Droplets, Waves, X } from "lucide-react";

import { ImmersiveBottomNav } from "@/components/popclub/shared/ImmersiveBottomNav";
import { skinScanBottomNavItems } from "@/lib/popclub/navigation";

const routineProducts = [
  {
    brand: "La Mer",
    title: "The Treatment Lotion",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDe2FbRhkfcnTB8Accu_TIwzstrigTnKfDwpM3isGE2wAuYxWXjiKNbsPpI3Qsc86gm38v-29IDS8XF_ER7hVBDEWo9Ze6HEgQ5v7D_N23f3lXl6NrlsXraKR982qIX85_SlxRsM2D9IszGmPedDyrYDKRJcz_Eki8AuTZuw79z8u95OwgpYzIT8f7OanPF6chnYiLdXEyx1dyVMzosEVA2HjG_YSlwjExCYj0ut5N3bvsYKiDZXbGQdVdxhVDe8uTyiurcvs8t1m4E"
  },
  {
    brand: "Chanel",
    title: "Hydra Beauty Camellia Glow",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDiaTMoz2C-OcRtY5z8WMqjOXEBmDpzl2LS8brdXZ40G-Nr6eeaR4P1M5yl3hR3V_9U7PGCeSdzEXBml21DQs1wpSG5_9E7U88qm0b57NjWLyUwoecigHSMPyQvWDXJkzz6pQuZAdUs3z5NX3DH3zGqa8PjhpotbV6DYBVz1qmquO7WpfltLZhGFduKI0wBjVjGvWpSbyEWM32t0gMtMnIvXeXd2i63mpUCf3A59ATMkfZQNUx5tuYiFterAAeBRxwesLwhU9GwMkky"
  }
] as const;

export default function SkinScanResultExperience() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-24 text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcf9f8]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link
            href="/skin-scan/analisando"
            className="inline-flex h-10 w-10 items-center justify-center text-[#1c1b1b]"
          >
            <X className="h-5 w-5" />
          </Link>
          <h1 className="text-sm uppercase tracking-[0.2em]">Skin Analysis</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-10 pt-24 lg:px-10 lg:pb-16">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)] lg:gap-16">
          <section className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
              Relatorio personalizado
            </p>
            <h2 className="font-[var(--font-playfair)] text-5xl font-bold tracking-[-0.05em] lg:text-7xl">
              Seu diagnostico.
            </h2>

            <div className="relative mb-8 mt-8 overflow-hidden rounded-[30px]">
              <div className="aspect-[4/5] lg:aspect-[4/4.7]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUj5r6MS9y0tE7du-wm613z6UgQeXbkaT7-tTsb645W0HfKIkc3bXk3XgYCUluTnj5fS4ptOZFdE3FhtE748lHkmKkAXtMVXMFDqGcRkwuVr3Jr2DPkjgBzDKQuaoNR7YVWLYRYFZKXvuCDZxv4El3VEgVSad0FQEtfJfLpTDu09QpTntIxG4-HiXkomnWZiDGXtOj3WOSTcGj22A5LfzqwnBdsXZosW-S5Ey-8K9HaZLL9Lz1RWtsESU8nC5ygvaZesba5ziOu-bl"
                  alt="Diagnostico editorial"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-0 right-0 max-w-[80%] bg-[#fcf9f8] p-6 lg:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                  Status geral
                </p>
                <p className="font-[var(--font-playfair)] text-3xl font-bold uppercase lg:text-4xl">
                  Excelente.
                </p>
              </div>
            </div>

            <p className="max-w-xl font-[var(--font-playfair)] text-lg italic leading-relaxed text-[#444748] lg:text-2xl">
              Sua pele esta equilibrada, com leve necessidade de hidratacao.
            </p>
          </section>

          <div className="space-y-14">
            <section className="grid grid-cols-2 gap-px bg-black/10">
              <div className="flex aspect-square flex-col justify-between bg-[#f6f3f2] p-6 lg:p-8">
                <Droplets className="h-6 w-6 text-black" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                    Hidratacao
                  </p>
                  <p className="text-3xl font-bold lg:text-4xl">72%</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6c5e06]">
                    High
                  </p>
                </div>
              </div>
              <div className="flex aspect-square flex-col justify-between bg-[#f6f3f2] p-6 lg:p-8">
                <Droplets className="h-6 w-6 text-black" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                    Oleosidade
                  </p>
                  <p className="text-2xl font-bold lg:text-3xl">Media</p>
                </div>
              </div>
              <div className="col-span-2 flex aspect-square flex-col justify-between bg-[#f6f3f2] p-6 lg:aspect-auto lg:min-h-[240px] lg:p-8">
                <div className="flex items-start justify-between">
                  <Waves className="h-6 w-6 text-black" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                    Textura
                  </p>
                </div>
                <p className="font-[var(--font-playfair)] text-4xl font-bold lg:text-5xl">Suave.</p>
              </div>
            </section>

            <section>
              <div className="mb-8 flex items-end justify-between">
                <h3 className="font-[var(--font-playfair)] text-2xl font-bold lg:text-4xl">
                  Rotina sugerida
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748] underline underline-offset-4">
                  Ver tudo
                </span>
              </div>

              <div className="grid gap-10 lg:grid-cols-2">
                {routineProducts.map((product, index) => (
                  <article key={product.title}>
                    <div className="relative mb-6 aspect-[3/4] overflow-hidden bg-[#f6f3f2]">
                      <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                      <div className="absolute left-4 top-4 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                        Etapa {String(index + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#444748]">
                      {product.brand}
                    </p>
                    <h4 className="mt-1 font-[var(--font-playfair)] text-xl font-bold lg:text-2xl">
                      {product.title}
                    </h4>
                  </article>
                ))}
              </div>
            </section>

            <Link
              href="/skin-scan/diagnostico"
              className="inline-flex min-h-14 w-full items-center justify-center bg-[#e5e2e1] px-8 text-sm font-black uppercase tracking-[0.2em] text-[#1c1b1b] transition-colors hover:bg-black hover:text-white lg:w-auto lg:min-w-[320px]"
            >
              Ver analise detalhada
            </Link>
          </div>
        </div>
      </main>

      <ImmersiveBottomNav items={skinScanBottomNavItems} />
    </div>
  );
}
