"use client";

export default function CatalogQualityError({
  error: _error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-[8px] border border-[#d7d2c8] bg-white p-6 shadow-[var(--adm-shadow-micro)] md:p-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7d7469]">
        BelaPop Quality Standard
      </p>
      <h1 className="mt-3 font-editorial text-3xl leading-tight text-[#1f1b18]">
        Nao foi possivel carregar a governanca de catalogo agora.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6c645b]">
        A camada de dados preserva fallback seguro, mas esta visualizacao encontrou uma instabilidade ao montar o
        painel. Tente recarregar para buscar novamente a origem persistida.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-[8px] border border-[#2f2a25] bg-[#2f2a25] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white"
      >
        Recarregar painel
      </button>
    </section>
  );
}
