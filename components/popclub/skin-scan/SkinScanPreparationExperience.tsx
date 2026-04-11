"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Camera, CameraOff, Lightbulb, Lock, X } from "lucide-react";

import { ImmersiveBottomNav } from "@/components/popclub/shared/ImmersiveBottomNav";
import { skinScanPrepBottomNavItems } from "@/lib/popclub/navigation";

const preparationTips = [
  { icon: Lightbulb, label: "Ambiente iluminado" },
  { icon: CameraOff, label: "Sem maquiagem pesada" },
  { icon: Camera, label: "Rosto centralizado" }
] as const;

export default function SkinScanPreparationExperience() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] pb-24 text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcf9f8]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link
            href="/skin-scan"
            className="inline-flex h-10 w-10 items-center justify-center text-[#1c1b1b]"
          >
            <X className="h-5 w-5" />
          </Link>
          <h1 className="font-[var(--font-playfair)] text-sm uppercase tracking-[0.2em]">
            Skin Analysis
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-10 pt-24 lg:px-10 lg:pb-16 lg:pt-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:items-start lg:gap-16">
          <section className="lg:sticky lg:top-28">
            <div className="relative mb-8 w-full overflow-hidden rounded-[30px] bg-[#f6f3f2]">
              <div className="aspect-[3/4] lg:aspect-[4/5]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEePFd5civAVYsv0HWN0Gtn8EF2YHHOiZtxcusk4aA-4Y_JD2E7CB3u8pf9C1KzwxBVvwFscXIGSeyL2YbOKoRLhGlVGtLn_DWZr7uF0mmcv9Wyi-eVb-9TYdfmaTDpNYztT5FbFA-YvdYO2hoOjxm_2Z36XRj2di1wiPGNp2F9Bw5lyPS0xUw20Rvb2qaXlTZvVQoD1jHrhwYZk04VwrXQaWN0vVkptKBVGCTKC8V8T2H2esZmeR2yq5kHHPTMZk8KoTv8M3f6XAO"
                  alt="Rosto para analise"
                  className="h-full w-full object-cover grayscale opacity-80"
                />
              </div>
              <div className="absolute inset-0 border-[20px] border-[#fcf9f8]" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <div className="max-w-sm rounded-[22px] border border-white/15 bg-white/12 p-5 text-white backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">
                    Before capture
                  </p>
                  <p className="mt-3 font-[var(--font-playfair)] text-2xl leading-tight lg:text-3xl">
                    Ajuste o ambiente para uma leitura mais precisa.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-8 lg:pt-8">
            <div className="space-y-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#444748]/65">
                Permissao de camera
              </p>
              <h2 className="font-[var(--font-playfair)] text-4xl font-bold leading-tight tracking-tight lg:text-6xl lg:leading-[1.04]">
                Precisamos da sua camera.
              </h2>
              <p className="max-w-xl text-lg leading-relaxed text-[#444748]">
                Para analisar sua pele com precisao e fornecer uma rotina personalizada de
                cuidados, o capture precisa de luz, enquadramento e leitura limpa.
              </p>
            </div>

            <section className="rounded-[28px] bg-[#f6f3f2] p-8 lg:p-10">
              <h3 className="mb-8 text-xs font-bold uppercase tracking-[0.3em] text-[#444748]">
                Prepare sua pele
              </h3>
              <div className="grid gap-5">
                {preparationTips.map((tip) => {
                  const Icon = tip.icon;

                  return (
                    <div
                      key={tip.label}
                      className="flex items-start gap-5 rounded-[20px] bg-white/70 px-5 py-4"
                    >
                      <Icon className="mt-0.5 h-5 w-5 text-black" />
                      <span className="text-sm tracking-wide">{tip.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-black/[0.05] bg-white/70 p-6">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-black/50" />
                <p className="text-sm leading-relaxed text-[#444748]">
                  Suas imagens sao processadas de forma privada e segura.
                </p>
              </div>
            </section>

            <div className="space-y-4">
              <Link
                href="/faceshield"
                className="inline-flex min-h-14 w-full items-center justify-center bg-black px-8 text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
              >
                Permitir e continuar
              </Link>
              <p className="px-4 text-center text-[10px] uppercase tracking-[0.22em] leading-loose text-[#444748] lg:px-0 lg:text-left">
                Quanto mais uniforme a captura, mais refinada sera a recomendacao.
              </p>
            </div>
          </section>
        </div>
      </main>

      <ImmersiveBottomNav items={skinScanPrepBottomNavItems} />
    </div>
  );
}
