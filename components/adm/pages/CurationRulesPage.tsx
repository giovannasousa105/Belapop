import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  AlertTriangle,
  Edit3,
  FileText,
  Flag,
  Settings2,
  Wallpaper
} from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { governanceRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type CurationRulesPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"]
});

const rulesTheme = {
  "--rules-bg": "#fbf9f4",
  "--rules-sidebar": "#f5f4ed",
  "--rules-surface": "#ffffff",
  "--rules-surface-low": "#efeee6",
  "--rules-surface-high": "#e8e9e0",
  "--rules-text": "#31332c",
  "--rules-text-soft": "#5e6058",
  "--rules-primary": "#5f5e5e",
  "--rules-primary-dim": "#535252",
  "--rules-secondary": "#6e5b4d",
  "--rules-tertiary": "#a23d3e",
  "--rules-border": "rgba(177, 179, 169, 0.15)",
  "--rules-shadow": "0 20px 40px rgba(49, 51, 44, 0.03)"
} as CSSProperties;

type ContentRule = {
  eyebrow: string;
  title: string;
  detail: string;
  action: string;
  actionClassName: string;
  icon: LucideIcon;
};

type ClaimRule = {
  title: string;
  detail: string;
  action: string;
  icon: LucideIcon;
  toneClassName: string;
  surfaceClassName: string;
};

type ImageRule = {
  label: string;
  title: string;
  detail: string;
  icon: LucideIcon;
};

type CategoryRule = {
  name: string;
  detail: string;
};


const contentRules: ContentRule[] = [
  {
    eyebrow: "Incomplete Description",
    title: "Lista de ingredientes ausente",
    detail: "Gatilho: Se campo 'Ingredients' estiver vazio na submissao.",
    action: "Acao: Reduzir score em 20%",
    actionClassName: "bg-[rgba(254,137,131,0.12)] text-[#752121]",
    icon: FileText
  },
  {
    eyebrow: "Content Quality",
    title: "Descricao com menos de 200 caracteres",
    detail: "Gatilho: Contagem de strings no campo 'Main Description' < 200.",
    action: "Acao: Marcar para revisao manual",
    actionClassName: "bg-[#f8decc] text-[#604e41]",
    icon: AlignLeft
  }
];

const claimRules: ClaimRule[] = [
  {
    title: "Uso de termos proibidos",
    detail: 'Gatilho: Presenca de "cura milagrosa", "reversao total" ou "imediato".',
    action: "Reprovar automatico",
    icon: AlertTriangle,
    toneClassName: "text-[var(--rules-tertiary)]",
    surfaceClassName: "bg-[var(--rules-surface)] border border-[var(--rules-border)]"
  },
  {
    title: "Promessa de resultado imediato",
    detail: "Gatilho: Texto contendo mencao a resultados em menos de 24h.",
    action: "Flag de atenção",
    icon: Flag,
    toneClassName: "text-[var(--rules-text-soft)]",
    surfaceClassName: "bg-[var(--rules-surface-low)]"
  }
];

const imageRules: ImageRule[] = [
  {
    label: "Resolucao Tecnica",
    title: "Resolucao inferior a 1080p",
    detail: "Acao: Solicitar novo envio automatico ao fornecedor.",
    icon: Settings2
  },
  {
    label: "Contexto Visual",
    title: "Fundo não neutro detectado",
    detail: "Acao: Reduzir qualidade visual no algoritmo de busca.",
    icon: Wallpaper
  }
];

const categoryRules: CategoryRule[] = [
  {
    name: "Maquiagem",
    detail: "Exigir teste de alergia certificado em anexo."
  },
  {
    name: "Skincare",
    detail: "Exigir registro ANVISA valido no campo 'Legal'."
  }
];

function Switch({
  enabled,
  compact = false
}: {
  enabled: boolean;
  compact?: boolean;
}) {
  const trackClassName = compact ? "h-4 w-8" : "h-5 w-10";
  const thumbClassName = compact ? "h-3 w-3 top-[2px]" : "h-4 w-4 top-[2px]";
  const translateClassName = compact ? "translate-x-4" : "translate-x-5";

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex ${trackClassName} rounded-full ${enabled ? "bg-[var(--rules-primary)]" : "bg-stone-200"}`}
    >
      <span
        className={`absolute left-[2px] ${thumbClassName} rounded-full border border-stone-300 bg-white transition-transform ${
          enabled ? translateClassName : ""
        }`}
      />
    </span>
  );
}

export async function CurationRulesPage({
  filters,
  searchParamsSource = filters
}: CurationRulesPageProps) {
  const [rulesResult, data] = await Promise.all([
    governanceRepository.listCurationRules(
      toListQueryParams(searchParamsSource, {
        page: 1,
        pageSize: 12,
        sortBy: "updatedAt",
        sortDir: "desc"
      })
    ),
    getAdmDataSource()
  ]);
  const liveContentRules: ContentRule[] = rulesResult.data.items
    .filter((rule) => rule.scope === "documento" || rule.scope === "logistica")
    .slice(0, 2)
    .map((rule) => ({
      eyebrow: rule.status,
      title: rule.name,
      detail: `Gatilho: ${rule.condition}.`,
      action: `Acao: ${rule.action}`,
      actionClassName:
        rule.priority === "critica"
          ? "bg-[rgba(254,137,131,0.12)] text-[#752121]"
          : "bg-[#f8decc] text-[#604e41]",
      icon: rule.scope === "documento" ? FileText : AlignLeft
    }));
  const liveClaimRules: ClaimRule[] = rulesResult.data.items
    .filter((rule) => rule.scope === "claim" || rule.scope === "reputacao")
    .slice(0, 2)
    .map((rule) => ({
      title: rule.name,
      detail: `Gatilho: ${rule.condition}.`,
      action: rule.action,
      icon: rule.priority === "critica" ? AlertTriangle : Flag,
      toneClassName:
        rule.priority === "critica" ? "text-[var(--rules-tertiary)]" : "text-[var(--rules-text-soft)]",
      surfaceClassName:
        rule.priority === "critica"
          ? "bg-[var(--rules-surface)] border border-[var(--rules-border)]"
          : "bg-[var(--rules-surface-low)]"
    }));
  const liveImageRules: ImageRule[] = rulesResult.data.items
    .filter((rule) => rule.scope === "imagem")
    .slice(0, 2)
    .map((rule, index) => ({
      label: rule.status,
      title: rule.name,
      detail: `Acao: ${rule.action}.`,
      icon: index % 2 === 0 ? Settings2 : Wallpaper
    }));
  const liveCategoryRules: CategoryRule[] = Array.from(new Set(data.products.map((product) => product.category)))
    .slice(0, 2)
    .map((category) => ({
      name: category,
      detail: `${data.products.filter((product) => product.category === category).length} SKU(s) monitorados por categoria.`
    }));
  return (
    <div
      className="flex min-h-screen overflow-hidden bg-[var(--rules-bg)] font-body text-[var(--rules-text)] selection:bg-[#f8decc]"
      style={rulesTheme}
    >
      <FinanceSidebar activeHref="/adm/curadoria/regras" />

      <main className="relative flex h-screen min-h-screen flex-1 flex-col overflow-y-auto pl-[220px]">
        <div className="mx-auto w-full max-w-7xl space-y-16 p-6 sm:p-10 xl:p-12">
          <section>
            <h2 className={`${notoSerif.className} mb-4 text-4xl tracking-[-0.02em] text-[var(--rules-text)] xl:text-5xl`}>
              Regras de Curadoria
            </h2>
            <p className="max-w-2xl text-base font-light leading-relaxed text-[var(--rules-text-soft)] xl:text-lg">
              Defina os parametros automaticos para aprovacao e pontuacao de novos itens no catalogo.
              Transforme diretrizes editoriais em inteligencia operacional.
            </p>
          </section>

          <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
            <div className="space-y-12 xl:col-span-8">
              <section className="space-y-6">
                <div className="flex items-end justify-between border-b border-[rgba(177,179,169,0.15)] pb-4">
                  <h3 className={`${notoSerif.className} text-2xl italic text-[var(--rules-text)]`}>
                    Criterios de Conteudo
                  </h3>
                  <span className="text-[10px] uppercase tracking-widest text-stone-400">02 Active Rules</span>
                </div>

                <div className="space-y-1">
                  {(liveContentRules.length > 0 ? liveContentRules : contentRules).map((rule) => {
                    const Icon = rule.icon;

                    return (
                      <article
                        key={rule.title}
                        className="flex flex-col justify-between gap-6 rounded-xl border border-[var(--rules-border)] bg-[var(--rules-surface)] p-8 transition-all hover:border-[rgba(95,94,94,0.2)] md:flex-row md:items-center"
                      >
                        <div className="max-w-xl space-y-3">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-[var(--rules-primary)]" strokeWidth={1.7} />
                            <span className="text-[10px] font-semibold uppercase tracking-tight text-stone-500">
                              {rule.eyebrow}
                            </span>
                          </div>
                          <h4 className={`${notoSerif.className} text-xl text-[var(--rules-text)]`}>
                            {rule.title}
                          </h4>
                          <p className="text-sm text-stone-500">{rule.detail}</p>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${rule.actionClassName}`}>
                              {rule.action}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-6 md:items-end">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              className="text-xs font-semibold text-stone-400 underline underline-offset-4 transition-colors hover:text-[var(--rules-primary)]"
                            >
                              Editar
                            </button>
                            <Switch enabled />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-end justify-between border-b border-[rgba(177,179,169,0.15)] pb-4">
                  <h3 className={`${notoSerif.className} text-2xl italic text-[var(--rules-text)]`}>
                    Criterios de Claims
                  </h3>
                  <span className="text-[10px] uppercase tracking-widest text-stone-400">02 Active Rules</span>
                </div>

                <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                  {(liveClaimRules.length > 0 ? liveClaimRules : claimRules).map((rule) => {
                    const Icon = rule.icon;

                    return (
                      <article
                        key={rule.title}
                        className={`flex flex-col justify-between rounded-xl p-8 ${rule.surfaceClassName}`}
                      >
                        <div className="space-y-4">
                          <Icon className={rule.toneClassName} strokeWidth={1.7} />
                          <h4 className={`${notoSerif.className} text-lg text-[var(--rules-text)]`}>
                            {rule.title}
                          </h4>
                          <p className="text-xs leading-relaxed text-stone-500">{rule.detail}</p>
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${rule.toneClassName}`}>
                            {rule.action}
                          </span>
                          <Switch enabled compact />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="space-y-8 xl:col-span-4">
              <section className="space-y-10 rounded-[2rem] bg-stone-900 p-10 text-stone-50">
                <header>
                  <h3 className={`${notoSerif.className} mb-2 text-2xl`}>Criterios de Imagem</h3>
                  <p className="text-xs font-light tracking-wide text-stone-400">
                    Padroes visuais de excelencia
                  </p>
                </header>

                <div className="space-y-8">
                  {(liveImageRules.length > 0 ? liveImageRules : imageRules).map((rule) => {
                    const Icon = rule.icon;

                    return (
                      <div key={rule.title} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-widest text-stone-500">{rule.label}</span>
                          <Icon className="h-4 w-4 text-stone-300" strokeWidth={1.7} />
                        </div>
                        <h5 className="text-sm font-medium text-stone-50">{rule.title}</h5>
                        <p className="text-[11px] text-stone-400">{rule.detail}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6">
                  <div className="h-40 w-full overflow-hidden rounded-xl grayscale opacity-40">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaUGuoSwsrZf_nzlPIihlo3psIIgrDj_r1xnUp97T2z7jpYXFTCSJuxb5e-wjW5FHTYrBVxyMDNlbGAbyDGQOKt2Yq6iPRMfbOmFhsvVd-DPfylL2Pp1Bdad8OjuVUNLhvOEQARGG3enmvovOFZryguyVgKcpwkKufeLatlI1PUnGBthtlNTZaNQyQ2sDM0NA0HY4aNAbyPnXPrfOgZMRhfCuMrf3MGSzYjpc9l8fZ1kgHCeSEQgWevMz96_s5r3dy-gb4dVwn6iyL"
                      alt="Skincare aesthetic"
                      width={480}
                      height={320}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6 rounded-xl bg-[var(--rules-surface-high)] p-8">
                <h3 className={`${notoSerif.className} border-b border-stone-400/40 pb-3 text-xl italic text-[var(--rules-text)]`}>
                  Criterios de Categoria
                </h3>

                <div className="space-y-6">
                  {(liveCategoryRules.length > 0 ? liveCategoryRules : categoryRules).map((rule) => (
                    <article key={rule.name} className="group">
                      <div className="mb-2 flex items-start justify-between">
                        <p className="text-xs font-bold uppercase tracking-tight text-[var(--rules-text)]">
                          {rule.name}
                        </p>
                        <button
                          type="button"
                          aria-label={`Editar ${rule.name}`}
                          className="text-stone-400 transition-colors hover:text-stone-900"
                        >
                          <Edit3 className="h-4 w-4" strokeWidth={1.7} />
                        </button>
                      </div>
                      <p className="text-sm text-[var(--rules-text)]">{rule.detail}</p>
                    </article>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-full border border-stone-800 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-800 transition-all duration-300 hover:bg-stone-800 hover:text-stone-50"
                >
                  Adicionar Categoria
                </button>
              </section>
            </div>
          </div>
        </div>

        <footer className="mt-auto border-t border-[rgba(177,179,169,0.15)] bg-[var(--rules-surface-low)] p-8 sm:p-10 xl:p-12">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 opacity-60 md:flex-row md:items-center">
            <div className="flex gap-10 sm:gap-12">
              <div>
                <p className="text-[10px] uppercase tracking-widest">Total de Regras</p>
                <p className={`${notoSerif.className} text-2xl text-[var(--rules-text)]`}>24</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest">Eficiencia de Filtro</p>
                <p className={`${notoSerif.className} text-2xl text-[var(--rules-text)]`}>89.2%</p>
              </div>
            </div>
            <div className={`${notoSerif.className} text-sm italic text-[var(--rules-text)]`}>
              &quot;A curadoria e a arte de escolher o que nao mostrar.&quot;
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
