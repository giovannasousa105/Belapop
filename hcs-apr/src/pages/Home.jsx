import RecentAprs from "../components/RecentAprs";
import Sidebar from "../components/Sidebar";
import StatusCards from "../components/StatusCards";
import Topbar from "../components/Topbar";

const stages = [
  { name: "Inspecao inicial", status: "current" },
  { name: "Analise de risco", status: "upcoming" },
  { name: "Aprovacao", status: "upcoming" },
  { name: "Execucao", status: "upcoming" }
];

const priorities = [
  { title: "APR aguardando aprovacao", value: "12", note: "+3 hoje" },
  { title: "Risco alto em aberto", value: "4", note: "exigem acao" },
  { title: "Equipes em operacao", value: "8", note: "3 areas ativas" }
];

const recentAprs = [
  {
    id: "#0A51A2",
    area: "Civil",
    sector: "Setor 1",
    step: "Em aprovacao",
    risk: "Baixa",
    owner: "Equipe Campo"
  },
  {
    id: "#0A51A8",
    area: "Eletrica",
    sector: "Subestacao",
    step: "Checklist final",
    risk: "Media",
    owner: "Manutencao"
  },
  {
    id: "#0A5221",
    area: "Mecanica",
    sector: "Linha 3",
    step: "Liberada",
    risk: "Baixa",
    owner: "Operacao"
  }
];

const recentSummary = {
  total: 18,
  updatedNow: 3,
  pending: 5
};

const shortcuts = [
  "Criar APR",
  "Continuar APR em rascunho",
  "Validar aprovacoes",
  "Abrir biblioteca de controles"
];

const stageTone = {
  current: "border-blue-200 bg-blue-50 text-blue-700",
  upcoming: "border-slate-200 bg-slate-50 text-slate-600"
};

export default function HcsAprHomeRedesign() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1">
          <Topbar />

          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-12 lg:px-8">
            <section className="space-y-6 lg:col-span-8">
              <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-8 text-white shadow-sm">
                <div className="max-w-3xl">
                  <p className="mb-3 text-sm uppercase tracking-[0.28em] text-blue-100">
                    Bem-vindo de volta
                  </p>
                  <h2 className="max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
                    Operacao limpa, decisao rapida, APR no centro da jornada.
                  </h2>
                  <p className="mt-5 max-w-xl text-base text-blue-50 md:text-lg">
                    APR com inteligencia para orientar cada passo, com mais facilidade,
                    clareza e seguranca.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      Nova APR
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Ver aprovacoes
                    </button>
                  </div>
                </div>
              </div>

              <StatusCards priorities={priorities} />

              <RecentAprs recentAprs={recentAprs} recentSummary={recentSummary} />
            </section>

            <aside className="space-y-6 lg:col-span-4">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                      APR em foco
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                      #0A51A2
                    </h3>
                  </div>
                  <span className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                    Em aprovacao
                  </span>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Area</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">Civil</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Setor</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">Setor 1</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Responsavel
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">Equipe Campo</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                  >
                    Continuar
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Detalhes
                  </button>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-blue-700">Fluxo da APR</p>
                <div className="mt-4 space-y-3">
                  {stages.map((stage, index) => (
                    <div
                      key={stage.name}
                      className={`rounded-2xl border px-4 py-3 ${stageTone[stage.status]}`}
                    >
                      <p className="text-xs uppercase tracking-[0.22em]">Etapa {index + 1}</p>
                      <p className="mt-1 font-semibold">{stage.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-blue-700">Acoes rapidas</p>
                <div className="mt-4 space-y-3">
                  {shortcuts.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>{item}</span>
                      <span>{">"}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-blue-700">Criterios da nova home</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>1. Prioridade operacional acima de conteudo institucional.</li>
                  <li>2. Uma acao principal por bloco, para reduzir duvida.</li>
                  <li>3. Hierarquia visual forte com bastante respiro.</li>
                  <li>4. Busca e atalhos sempre presentes para acelerar o uso diario.</li>
                </ul>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
