export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div>
          <p className="text-sm font-medium text-blue-700">Visao operacional</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Home APR</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Versao mobile
          </button>
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Ajuda
          </button>
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Perfil
          </button>
          <button
            type="button"
            className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Criar APR
          </button>
        </div>
      </div>
    </header>
  );
}
