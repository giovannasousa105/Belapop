"use client";

export default function FinanceiroError({
  error: _error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-6 text-[#1A1714]">
      <div className="max-w-md rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-8 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
          Módulo Financeiro
        </p>
        <h1 className="mt-3 text-xl font-semibold text-[#1A1714]">
          Não foi possível carregar o módulo agora.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B5E54]">
          Houve uma instabilidade ao buscar os dados financeiros. Tente novamente em alguns instantes.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-[#8B5E3C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7A5234]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
