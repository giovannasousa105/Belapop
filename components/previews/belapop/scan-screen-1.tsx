"use client";

/* eslint-disable react-hooks/static-components */
/* eslint-disable @next/next/no-img-element */

import {
  Activity,
  ArrowRight,
  Droplets,
  Eye,
  Info,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Waves
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import {
  previewHeadlineFont,
  previewPrimaryButtonClass
} from "./luxury-preview-theme";
import { getBelapopHref, type BelapopRenderMode } from "./routes";

const focusOptions = [
  { id: "acne", index: "01", title: "Acne e cravos", icon: Sparkles, color: "#5F9EA0" },
  { id: "oleosidade", index: "02", title: "Oleosidade excessiva", icon: Droplets, color: "#4A5D75" },
  { id: "poros", index: "03", title: "Poros aparentes", icon: Activity, color: "#B2847A" },
  { id: "manchas", index: "04", title: "Manchas e marcas", icon: Activity, color: "#C5B358" },
  { id: "desidratacao", index: "05", title: "Desidratacao", icon: Waves, color: "#7FB3D5" },
  { id: "barreira", index: "06", title: "Barreira sensibilizada", icon: ShieldCheck, color: "#E9967A" },
  { id: "vermelhidao", index: "07", title: "Vermelhidao e rosacea", icon: ShieldCheck, color: "#7FB394" },
  { id: "linhas", index: "08", title: "Linhas finas e firmeza", icon: Waves, color: "#CD7F32" },
  { id: "textura", index: "09", title: "Textura irregular", icon: ScanFace, color: "#928E85" },
  { id: "olheiras", index: "10", title: "Olheiras e area dos olhos", icon: Eye, color: "#5D5387" }
] as const;

type ScanScreenOneProps = {
  mode?: BelapopRenderMode;
  embedInPage?: boolean;
};

export function ScanScreenOne({ mode = "preview", embedInPage = false }: ScanScreenOneProps) {
  const [selected, setSelected] = useState<string[]>(["desidratacao", "olheiras"]);
  const Wrapper = ({
    children
  }: {
    children: ReactNode;
  }) =>
    embedInPage ? (
      <>{children}</>
    ) : (
      <LuxuryPreviewFrame activeItem="Skin Scan Bela" mode={mode}>
        {children}
      </LuxuryPreviewFrame>
    );

  const ctaLabel = useMemo(() => {
    if (selected.length === 0) {
      return "Selecione seus focos";
    }

    return `Iniciar diagnostico IA (${selected.length})`;
  }, [selected.length]);

  function toggleFocus(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <Wrapper>
      <div className={embedInPage ? "" : "pt-[72px]"}>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <header className="mb-12 flex flex-col gap-6 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="mb-4 block text-[10px] uppercase tracking-[0.3em] text-[#444748]">
                Skin Scan Bela / Etapa 01
              </span>
              <h1 className={`${previewHeadlineFont.className} text-4xl font-bold leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl`}>
                Selecione seu foco
                <br />
                de cuidado
              </h1>
            </div>
            <p className="max-w-sm text-sm italic leading-7 text-[#444748]">
              Para uma analise precisa, identifique as areas que mais demandam atencao em sua rotina. Nossa IA customiza o diagnostico com base nestas prioridades.
            </p>
          </header>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-0">
            {focusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selected.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleFocus(option.id)}
                  className={`group flex aspect-[0.95] flex-col justify-between border p-5 text-left transition-all sm:p-6 lg:aspect-square lg:p-8 ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-[#e5e2e1] bg-[#fcf9f8] text-[#1c1b1b] hover:bg-black hover:text-white"
                  }`}
                >
                  <span className="text-xs opacity-55">{option.index}</span>
                  <div className="w-full">
                    <Icon
                      className="mb-4 h-8 w-8 transition-transform group-hover:scale-110 sm:h-10 sm:w-10"
                      style={{ color: isSelected ? "#ffffff" : option.color }}
                    />
                    <h3 className={`${previewHeadlineFont.className} text-lg font-bold leading-none sm:text-xl`}>
                      {option.title}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-5 border-t border-[#e5e2e1] pt-8 lg:mt-14 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#e5e2e1]">
                <Info className="h-5 w-5 text-black" />
              </div>
              <p className="max-w-xs text-xs leading-6 text-[#444748]">
                Voce pode selecionar multiplos focos. Quanto mais detalhado, melhor sera a precisao do seu scan.
              </p>
            </div>
            <a
              href={selected.length === 0 ? "#" : getBelapopHref(mode, "scan-capture")}
              className={`${previewPrimaryButtonClass} w-full md:w-auto ${
                selected.length === 0 ? "pointer-events-none bg-black/35 hover:bg-black/35" : "hover:bg-[#1c1b1b]"
              }`}
              aria-disabled={selected.length === 0}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div className="relative">
              <img
                alt="Luxury skincare texture"
                className="h-[420px] w-full object-cover grayscale sm:h-[520px] lg:h-[600px]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuATm4JvER6CkwiD6OsuZ7wiwziFarXrndMLduXGkdxHqJZsYJ9T-zCeTttDhTA3kwc9I5fuiPI7SezdZxdfjXsJUdeGqJDxFOirNCHctUte-w4uYSFJ_K0CgpQBGHKKZUCcjo_lyc2BQsIaigpxizH9dtM0m7F4VhDbOPm6x4SB1spP2FbAlMsZ4uolKpQIKQpxZpmC-v-m_sPGxzrj9Ut9XDLAfd8I0E_AVa6ILCpnSeZlaZuviWUhG69UH7Pp8QD0r9ggGsfHLb-f"
              />
              <div className="mt-4 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:absolute sm:-bottom-10 sm:-right-6 sm:mt-0 sm:max-w-sm sm:p-8">
                <h4 className={`${previewHeadlineFont.className} text-2xl font-bold italic`}>
                  The Science of Glow.
                </h4>
                <p className="mt-3 text-sm leading-7 text-[#444748]">
                  Nossa tecnologia analisa mais de 50 marcadores biometricos para entregar uma rotina que realmente funciona para voce.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:gap-8">
              <h2 className={`${previewHeadlineFont.className} text-4xl font-bold tracking-tight`}>
                Privacidade e Ciencia
              </h2>
              <div className="space-y-6">
                <div className="flex gap-5">
                  <ShieldCheck className="mt-1 h-7 w-7 text-black" />
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em]">Dados protegidos</p>
                    <p className="text-sm leading-7 text-[#444748]">
                      Suas imagens sao processadas localmente e nunca armazenadas sem consentimento explicito.
                    </p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <Sparkles className="mt-1 h-7 w-7 text-black" />
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em]">
                      Analise dermatologica
                    </p>
                    <p className="text-sm leading-7 text-[#444748]">
                      Algoritmos validados para identificar padroes invisiveis a olho nu e priorizar os focos certos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Wrapper>
  );
}
