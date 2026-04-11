export default function CatalogoLoading() {
  return (
    <div className="min-h-screen bg-bpOffWhite text-bpBlackSoft">
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Catalogo BelaPop</p>
          <h1 className="mt-3 font-display text-3xl text-bpBlack">Preparando sua selecao...</h1>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`catalog-loading-card-${index}`}
              className="h-72 animate-pulse rounded-3xl border border-black/10 bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
