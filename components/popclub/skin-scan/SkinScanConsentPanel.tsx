"use client";

import { useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type Props = {
  continueLabel: string;
  onBack: () => void;
  onContinue: () => void;
  disabled?: boolean;
};

export default function SkinScanConsentPanel({
  continueLabel,
  onBack,
  onContinue,
  disabled = false
}: Props) {
  const checkboxId = "faceshield-consent";
  const [consentChecked, setConsentChecked] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-10 text-white">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 self-start text-xs uppercase tracking-[0.22em] text-white/68 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar
      </button>

      <div className="overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-7 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-9">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/8">
          <ShieldCheck className="h-5 w-5 text-white" aria-hidden="true" />
        </div>

        <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-white/55">Consentimento LGPD</p>
        <h1 className="mt-3 font-[var(--font-playfair)] text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Sua imagem, usada com cuidado.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
          A imagem será usada apenas para esta leitura assistida, conforme nossa política de privacidade.
        </p>

        <label
          htmlFor={checkboxId}
          className="mt-8 flex cursor-pointer items-start gap-4 rounded-[24px] border border-white/12 bg-black/22 p-5"
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={consentChecked}
            onChange={(event) => setConsentChecked(event.target.checked)}
            className="mt-1 h-5 w-5 rounded border-white/20 bg-transparent text-white accent-[#a44a64]"
          />
          <span className="text-sm leading-7 text-white/86">
            Autorizo a BelaPop a processar minha imagem para gerar uma recomendação cosmética personalizada.
          </span>
        </label>

        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/70">
          O SkinScan oferece recomendações cosméticas e não substitui avaliação médica ou dermatológica.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onContinue}
            disabled={disabled || !consentChecked}
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-7 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {continueLabel}
          </button>
          <p className="text-xs leading-6 text-white/48">
            Você também pode seguir pelo quiz rápido sem usar câmera ou upload.
          </p>
        </div>
      </div>
    </div>
  );
}
