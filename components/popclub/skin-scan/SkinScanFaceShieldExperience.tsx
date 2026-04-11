"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Camera, RotateCcw, X, Zap } from "lucide-react";

export default function SkinScanFaceShieldExperience() {
  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <header className="fixed inset-x-0 top-0 z-50 bg-transparent px-6 pb-4 pt-8">
        <div className="mx-auto max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <Link href="/skin-scan/captura" className="inline-flex h-10 w-10 items-center justify-center">
              <X className="h-7 w-7" />
            </Link>
            <h1 className="flex-1 pr-8 text-center text-xs uppercase tracking-[0.3em]">
              Skin Scan
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-white" />
            <div className="h-2 w-2 rounded-full border border-white/10 bg-white/30" />
            <div className="h-2 w-2 rounded-full border border-white/10 bg-white/30" />
          </div>
        </div>
      </header>

      <main className="relative flex h-screen flex-col items-center justify-between overflow-hidden pb-12 pt-32">
        <div className="absolute inset-0">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXcTgmKKaa3yzLhSF7NHzY87D4uuwcfdJDkR5dLxwWc_MIrk_B89Zdq_Zpgl0Kf7dUH-l-qqvTpToZ0vszYGlpkhayyHigu4tk97xvo08q3geB_eH0quQ4aQ3P3wbVyZrdIqhKqKxkHZ8Mk6xbPaf1tmr9c8ncLz2gkq5VNMF-mbgki-x5oAzCaPZUDf7oM21SrEoMJq25BCMkDx-a7OBVeeGA-49ItlH1GlMr3JC2qXkbtA7Oh764Dvm0sxd8EkfZs3RTTCesTJjV"
            alt="Captura da camera"
            className="h-full w-full animate-[fadeZoom_20s_ease-out_infinite_alternate] object-cover grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 flex w-full max-w-md flex-col items-center px-8">
          <div className="relative mb-11 mt-5 h-[23rem] w-72 rounded-lg border-2 border-white shadow-[0_0_0_2px_rgba(255,255,255,0.3),0_0_20px_rgba(255,255,255,0.2)]">
            <div className="absolute -left-1 -top-1 h-6 w-6 border-l-2 border-t-2 border-white/50" />
            <div className="absolute -right-1 -top-1 h-6 w-6 border-r-2 border-t-2 border-white/50" />
            <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-2 border-l-2 border-white/50" />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-2 border-r-2 border-white/50" />
          </div>

          <div className="max-w-[280px] text-center">
            <h2 className="font-[var(--font-playfair)] text-2xl">Posicione seu rosto no centro</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/80">
              Ambiente iluminado melhora a precisao
            </p>
          </div>
        </div>

        <div className="relative z-20 flex w-full max-w-md flex-col items-center gap-6 px-12">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <Zap className="h-4 w-4 text-green-400" />
            <span className="text-[10px] uppercase tracking-[0.2em]">Perfeito</span>
          </div>

          <div className="flex w-full items-center justify-between">
            <button type="button" className="inline-flex h-12 w-12 items-center justify-center text-white/80">
              <Zap className="h-6 w-6" />
            </button>
            <div className="flex items-center justify-center animate-pulse">
              <Link href="/skin-scan/analisando" className="group relative inline-flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 scale-110 rounded-full border-2 border-white/20" />
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                  <Camera className="h-8 w-8 text-black" />
                </div>
              </Link>
            </div>
            <button type="button" className="inline-flex h-12 w-12 items-center justify-center text-white/80">
              <RotateCcw className="h-6 w-6" />
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeZoom {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
