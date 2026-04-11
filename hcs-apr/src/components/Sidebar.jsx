const navItems = ["Home", "APR", "Biblioteca", "Dashboards", "Checklists", "Admin"];

export default function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white xl:flex xl:flex-col">
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-sm">
            HCS
          </div>
          <div>
            <p className="text-xl font-semibold text-slate-900">HCS Digital</p>
            <p className="text-sm text-slate-500">APR - Engenharia de Seguranca</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Workspace</p>
          <p className="mt-2 text-lg font-semibold text-blue-700">HCS</p>
        </div>
      </div>

      <nav className="space-y-2 px-5 pb-5">
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-base font-medium transition ${
              item === "Home"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="px-5">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
          <button
            type="button"
            className="mb-3 flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            + Nova APR
          </button>
          <button
            type="button"
            className="mb-3 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Biblioteca
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Checklist
          </button>
        </div>
      </div>

      <div className="mt-auto p-5">
        <div className="rounded-3xl bg-slate-900 p-5 text-white">
          <p className="text-sm text-slate-300">Meta do dia</p>
          <p className="mt-2 text-3xl font-semibold">16 APRs</p>
          <p className="mt-2 text-sm text-slate-300">14 concluidas, 2 em andamento</p>
        </div>
      </div>
    </aside>
  );
}
