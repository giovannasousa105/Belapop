"use client";

import type { FiltrosBusca } from "@/lib/catalogo/catalogoTypes";

const UNIVERSOS = [
  { valor: "rosto",      label: "Rosto" },
  { valor: "corpo",      label: "Corpo" },
  { valor: "cabelo",     label: "Cabelo" },
  { valor: "perfumaria", label: "Perfumaria" },
  { valor: "wellness",   label: "Wellness" },
] as const;

const NECESSIDADES = [
  "hidratação",
  "anti-idade",
  "clareamento",
  "controle sebáceo",
  "acne",
  "firmeza",
  "calmante",
  "proteção solar",
];

const TIPOS_PELE = [
  { valor: "SECA",     label: "Seca" },
  { valor: "OLEOSA",   label: "Oleosa" },
  { valor: "MISTA",    label: "Mista" },
  { valor: "SENSIVEL", label: "Sensível" },
  { valor: "NORMAL",   label: "Normal" },
];

interface Props {
  filtros: FiltrosBusca;
  onAtualizar: (filtros: Partial<FiltrosBusca>) => void;
}

export function FiltrosSidebar({ filtros, onAtualizar }: Props) {
  function toggleArray<K extends "necessidades" | "tipo_pele">(
    campo: K,
    valor: string,
  ) {
    const atual = (filtros[campo] ?? []) as string[];
    const existe = atual.includes(valor);
    onAtualizar({ [campo]: existe ? atual.filter((v) => v !== valor) : [...atual, valor] });
  }

  return (
    <aside aria-label="Filtros" className="flex flex-col gap-6 text-sm">
      {/* Universo */}
      <section>
        <h3 className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wider">Universo</h3>
        <div className="flex flex-col gap-1">
          {UNIVERSOS.map(({ valor, label }) => (
            <button
              key={valor}
              type="button"
              onClick={() => onAtualizar({ universo: filtros.universo === valor ? undefined : valor })}
              className={`text-left px-2 py-1 rounded-lg transition-colors ${
                filtros.universo === valor
                  ? "bg-rose-50 text-rose-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Tipo de pele */}
      <section>
        <h3 className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wider">Tipo de pele</h3>
        <div className="flex flex-col gap-1">
          {TIPOS_PELE.map(({ valor, label }) => {
            const selecionado = (filtros.tipo_pele ?? []).includes(valor);
            return (
              <label key={valor} className="flex items-center gap-2 cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={selecionado}
                  onChange={() => toggleArray("tipo_pele", valor)}
                  className="rounded border-slate-300 text-rose-500 focus:ring-rose-200"
                />
                <span className={selecionado ? "text-slate-800 font-medium" : "text-slate-600"}>{label}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Necessidades */}
      <section>
        <h3 className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wider">Necessidades</h3>
        <div className="flex flex-wrap gap-1.5">
          {NECESSIDADES.map((n) => {
            const selecionado = (filtros.necessidades ?? []).includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggleArray("necessidades", n)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  selecionado
                    ? "bg-rose-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </section>

      {/* Curadoria */}
      <section>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filtros.curated ?? false}
            onChange={(e) => onAtualizar({ curated: e.target.checked || undefined })}
            className="rounded border-slate-300 text-rose-500 focus:ring-rose-200"
          />
          <span className="text-slate-600 text-sm">Somente curadoria BelaPop</span>
        </label>
      </section>

      {/* Preço */}
      <section>
        <h3 className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wider">Preço</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Mín"
            min={0}
            value={filtros.preco_min ?? ""}
            onChange={(e) => onAtualizar({ preco_min: e.target.value ? Number(e.target.value) * 100 : undefined })}
            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-200"
          />
          <span className="text-slate-400 shrink-0">—</span>
          <input
            type="number"
            placeholder="Máx"
            min={0}
            value={filtros.preco_max ? filtros.preco_max / 100 : ""}
            onChange={(e) => onAtualizar({ preco_max: e.target.value ? Number(e.target.value) * 100 : undefined })}
            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-200"
          />
        </div>
      </section>

      {/* Limpar */}
      <button
        type="button"
        onClick={() => onAtualizar({
          universo:         undefined,
          necessidades:     undefined,
          tipo_pele:        undefined,
          curated:          undefined,
          preco_min:        undefined,
          preco_max:        undefined,
          sensibilidade_max: undefined,
        })}
        className="text-xs text-slate-400 hover:text-slate-600 underline text-left"
      >
        Limpar filtros
      </button>
    </aside>
  );
}
