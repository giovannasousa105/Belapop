"use client";

type ConsentScreenProps = {
  onContinue: () => void;
  onBack: () => void;
};

export default function ConsentScreen({ onContinue, onBack }: ConsentScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] uppercase tracking-[0.32em] text-white/56">Skin Scan BelaPop</p>
        <h1 className="mt-4 font-[var(--font-playfair)] text-4xl font-semibold tracking-[-0.05em]">
          Vamos iniciar sua leitura visual.
        </h1>
        <p className="mt-5 text-sm leading-7 text-white/76">
          Usaremos sua câmera apenas para analisar sinais visuais da pele e personalizar sua rotina BelaPop.
        </p>
        <p className="mt-4 text-xs leading-6 text-white/54">
          A imagem não será usada para identificar você e esta leitura não substitui avaliação dermatológica.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-black"
          >
            Entendi e quero iniciar
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/16 px-6 text-[11px] uppercase tracking-[0.28em] text-white/72"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
