"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, Droplets, Layers3, ScanFace, Waves, X } from "lucide-react";

export default function SkinScanAnalyzingExperience() {
  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcf9f8]/10 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link href="/faceshield" className="inline-flex h-10 w-10 items-center justify-center">
            <X className="h-5 w-5" />
          </Link>
          <h1 className="text-sm uppercase tracking-[0.2em]">Skin Analysis</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 pb-32 pt-16">
        <div className="relative w-full max-w-md overflow-hidden bg-neutral-950">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ5CVrb-vZnL41VI6bMR2RTmkV-mBcHa-LopaB1R_Ljfy_FA4BsFrMErMQIYiH9qJVdhsQTnMvlmcfENRAt5MYIcrKKlw1p0vbb3IimzCCmLQXc7MmeAbIcSTv8vJZMDXmL8g9sV94wXSsJzZXrBgcmKNo31h5dMSCQMx53SAic3NExOQxnkuc3-JuCAp_RyiLmcfRATBCwYvlornPP9RGch4y1KLhi0g9EmBy-ONb7wwcncmQPwOY-xLoh8B5-slhCE7MV1OYOMYw"
            alt="Analise da pele"
            className="aspect-[3/4] h-full w-full object-cover opacity-60 grayscale brightness-75"
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="scan-line absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_#ffffff]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="pulse-ring h-32 w-32" />
            <div className="pulse-ring h-32 w-32 [animation-delay:1s]" />
            <div className="pulse-ring h-32 w-32 [animation-delay:2s]" />
          </div>
          <div className="absolute left-10 top-10 h-8 w-8 border-l border-t border-white/20" />
          <div className="absolute bottom-10 right-10 h-8 w-8 border-b border-r border-white/20" />
          <div className="absolute left-20 top-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Metric: Depth 0.4mm</p>
            <div className="mt-1 h-px w-12 bg-white/20" />
          </div>
          <div className="absolute bottom-20 left-10 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rotate-45 bg-[#f7e382]" />
              <span className="text-[10px] uppercase tracking-[0.24em]">Analyzing lipid barrier</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rotate-45 bg-white/40" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                Hydration synthesis
              </span>
            </div>
          </div>
        </div>

        <div className="z-10 -mt-10 w-full max-w-sm bg-[#fcf9f8] p-8 text-[#1c1b1b]">
          <h2 className="font-[var(--font-playfair)] text-3xl font-bold tracking-tight">
            Analisando sua pele.
          </h2>
          <p className="mb-8 mt-4 text-sm leading-relaxed text-[#444748]">
            Estamos identificando padroes e necessidades moleculares. A tecnologia de precisao esta mapeando cada zona para um regime personalizado.
          </p>
          <div className="relative h-[2px] w-full overflow-hidden bg-[#e5e2e1]">
            <div className="absolute inset-y-0 left-0 w-2/3 bg-black" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-black">
              Status: Processing
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-black">68%</span>
          </div>
          <Link
            href="/skin-scan/resultado"
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 bg-black px-6 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-opacity hover:opacity-90"
          >
            Ver leitura
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-px bg-[#e5e2e1]">
          <div className="bg-[#fcf9f8] p-6 text-[#1c1b1b]">
            <Layers3 className="mb-3 h-5 w-5" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#444748]">Structure</p>
            <p className="font-[var(--font-playfair)] text-lg">Dermis Map</p>
          </div>
          <div className="bg-[#fcf9f8] p-6 text-[#1c1b1b]">
            <Droplets className="mb-3 h-5 w-5" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#444748]">Moisture</p>
            <p className="font-[var(--font-playfair)] text-lg">Optimizing</p>
          </div>
        </div>
      </main>

      <style jsx>{`
        .scan-line {
          animation: scanMove 4s linear infinite;
        }

        .pulse-ring {
          position: absolute;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          animation: pulseEffect 3s ease-out infinite;
        }

        @keyframes scanMove {
          0% {
            top: 0;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        @keyframes pulseEffect {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
