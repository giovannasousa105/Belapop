"use client";

import { Camera, ChevronRight, ImageUp, Sparkles } from "lucide-react";

type Props = {
  onChooseCamera: () => void;
  onChooseUpload: () => void;
  onChooseQuiz: () => void;
};

const options = [
  {
    id: "camera",
    title: "Escanear com câmera",
    description: "Mais preciso. Vamos guiar sua captura em poucos passos.",
    cta: "Abrir câmera",
    icon: Camera
  },
  {
    id: "upload",
    title: "Enviar foto",
    description: "Mais prático. Use uma foto frontal em boa luz.",
    cta: "Enviar foto",
    icon: ImageUp
  },
  {
    id: "quiz",
    title: "Quiz rápido",
    description: "Sem câmera, sem upload, em menos de 1 minuto.",
    cta: "Responder quiz",
    icon: Sparkles
  }
] as const;

export default function SkinScanCaptureModeSelector({
  onChooseCamera,
  onChooseUpload,
  onChooseQuiz
}: Props) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-12 pt-24 text-white sm:px-8">
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">FaceShield real</p>
        <h1 className="mt-4 font-[var(--font-playfair)] text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
          Escolha como quer começar.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
          Você pode escanear pela câmera, enviar fotos ou seguir por um quiz rápido. A imagem nunca é obrigatória.
        </p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          const onClick =
            option.id === "camera"
              ? onChooseCamera
              : option.id === "upload"
                ? onChooseUpload
                : onChooseQuiz;

          return (
            <article
              key={option.id}
              className="group flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.05))]"
            >
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/8">
                  <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <h2 className="mt-6 font-[var(--font-playfair)] text-3xl font-semibold tracking-[-0.03em]">
                  {option.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/72">{option.description}</p>
              </div>

              <button
                type="button"
                onClick={onClick}
                className="mt-8 inline-flex min-h-14 w-full items-center justify-between rounded-full border border-white/12 bg-black/24 px-5 text-xs uppercase tracking-[0.22em] text-white transition hover:border-[#a44a64] hover:text-white"
              >
                <span>{option.cta}</span>
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>

      <div className="mt-8 rounded-[26px] border border-white/10 bg-black/22 p-5 text-sm leading-7 text-white/62">
        O SkinScan oferece recomendações cosméticas e não substitui avaliação médica ou dermatológica.
      </div>
    </div>
  );
}
