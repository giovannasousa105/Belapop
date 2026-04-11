const riskTone = {
  Baixa: "bg-emerald-50 text-emerald-700",
  Media: "bg-amber-50 text-amber-700",
  Alta: "bg-rose-50 text-rose-700"
};

export default function RecentAprs({ recentAprs, recentSummary }) {
  return (
    <details className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-medium text-blue-700">APRs recentes</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">
            Acompanhe sem poluir a home
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {recentSummary.total} APRs recentes - {recentSummary.updatedNow} atualizadas hoje -{" "}
            {recentSummary.pending} aguardando acao
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            Toque para abrir
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition group-open:rotate-180">
            v
          </div>
        </div>
      </summary>

      <div className="border-t border-slate-200 px-6 pb-6 pt-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 md:w-72"
            placeholder="Buscar APR, setor ou equipe"
          />
          <button
            type="button"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 md:w-auto"
          >
            Ver todas
          </button>
        </div>

        <div className="space-y-3">
          {recentAprs.slice(0, 3).map((apr) => (
            <div
              key={apr.id}
              className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.1fr_1fr_1fr_1fr_auto] md:items-center"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      riskTone[apr.risk] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {apr.risk}
                  </span>
                  <p className="text-lg font-semibold text-slate-900">{apr.id}</p>
                </div>
                <p className="mt-2 text-sm text-slate-500">{apr.owner}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Area</p>
                <p className="font-medium text-slate-900">{apr.area}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Setor</p>
                <p className="font-medium text-slate-900">{apr.sector}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Proxima etapa</p>
                <p className="font-medium text-slate-900">{apr.step}</p>
              </div>

              <button
                type="button"
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Abrir
              </button>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
