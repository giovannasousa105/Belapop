"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, SlidersHorizontal, Sparkles } from "lucide-react";

import { BundleCard } from "@/components/bundles/BundleCard";
import {
  skinBundleGoalOptions,
  skincareBundles,
  skinBundleSkinTypeOptions,
  skinBundleSortOptions,
  sortSkinBundles,
  type SkinBundleGoal,
  type SkinBundleSkinType,
  type SkinBundleSort
} from "@/lib/skincare/skincareBundles";

type FilterGoal = SkinBundleGoal | "todos";
type FilterSkinType = SkinBundleSkinType | "todos";

type SkincareBundleSectionProps = {
  mode?: "home" | "catalog";
};

export function SkincareBundleSection({ mode = "catalog" }: SkincareBundleSectionProps) {
  const [goal, setGoal] = useState<FilterGoal>("todos");
  const [skinType, setSkinType] = useState<FilterSkinType>("todos");
  const [sort, setSort] = useState<SkinBundleSort>("recommended");
  const isHome = mode === "home";

  const bundles = useMemo(() => {
    const filtered = skincareBundles.filter((bundle) => {
      const goalMatch = goal === "todos" || bundle.goal === goal;
      const skinMatch = skinType === "todos" || bundle.skinTypes.includes(skinType);
      return goalMatch && skinMatch;
    });
    return sortSkinBundles(filtered, sort).slice(0, isHome ? 3 : undefined);
  }, [goal, isHome, skinType, sort]);

  return (
    <section id="kits" className="bg-[#fcf9f8] px-4 py-16 text-[#1c1b1b] sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">
              Kits BelaPop
            </p>
            <h2 className="mt-4 max-w-3xl font-headline text-3xl leading-[1.1] tracking-normal sm:text-4xl">
              Kits pensados como rituais, não como produtos soltos.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5f5a55] sm:text-base">
              Escolha por momento, necessidade ou intenção de cuidado. A BelaPop organiza a rotina para você.
            </p>
          </div>
          <div className="border-l border-[#d8d0c8] pl-5 text-sm leading-7 text-[#5f5a55]">
            Cada kit combina produtos que fazem sentido juntos, na ordem certa e com uma proposta clara para a sua pele.
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ["Rotina completa", "Limpeza, tratamento e acabamento em uma única decisão."],
            ["Compra inteligente", "Economia visivel sem transformar a marca em promocao."],
            ["Curadoria semanal", "Selecionado pela BelaPop com contexto de uso real."]
          ].map(([title, detail]) => (
            <div key={title} className="border border-[#ded8d2] bg-white/70 px-4 py-4 text-sm shadow-[0_16px_60px_rgba(28,27,27,0.04)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">{title}</p>
              <p className="mt-2 leading-6 text-[#5f5a55]">{detail}</p>
            </div>
          ))}
        </div>

        {!isHome ? (
          <div className="mt-10 grid gap-3 border-y border-[#ded8d2] py-5 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6862]">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Objetivo
              </span>
              <select
                value={goal}
                onChange={(event) => setGoal(event.target.value as FilterGoal)}
                className={`h-12 border px-3 text-xs uppercase tracking-[0.06em] text-[#1c1b1b] ${goal !== "todos" ? "border-[#1c1b1b] bg-[#1c1b1b] text-white" : "border-[#d8d0c8] bg-white"}`}
              >
                {skinBundleGoalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6862]">
              Tipo de pele
              <select
                value={skinType}
                onChange={(event) => setSkinType(event.target.value as FilterSkinType)}
                className={`h-12 border px-3 text-xs uppercase tracking-[0.06em] text-[#1c1b1b] ${skinType !== "todos" ? "border-[#1c1b1b] bg-[#1c1b1b] text-white" : "border-[#d8d0c8] bg-white"}`}
              >
                {skinBundleSkinTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6862]">
              Ordenação
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SkinBundleSort)}
                className={`h-12 border px-3 text-xs uppercase tracking-[0.06em] text-[#1c1b1b] ${sort !== "recommended" ? "border-[#1c1b1b] bg-[#1c1b1b] text-white" : "border-[#d8d0c8] bg-white"}`}
              >
                {skinBundleSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {!isHome && (
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6862]">
            {bundles.length === 0
              ? "Nenhum kit para esse filtro. Tente outro critério."
              : `${bundles.length} ${bundles.length === 1 ? "kit encontrado" : "kits encontrados"}`}
          </p>
        )}

        {bundles.length > 0 ? (
          <div className="mt-4 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-3">
            {bundles.map((bundle, index) => (
              <BundleCard key={bundle.id} bundle={bundle} featured={bundle.featured || index === 0} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-black/10 bg-white p-10 text-center">
            <p className="text-sm leading-7 text-black/60">
              Nenhum kit encontrado para os filtros selecionados.
            </p>
            <button
              type="button"
              onClick={() => { setGoal("todos"); setSkinType("todos"); setSort("recommended"); }}
              className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] underline underline-offset-4"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {isHome ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/kits"
              className="inline-flex min-h-[52px] items-center justify-center gap-3 border border-[#1c1b1b] px-6 text-xs font-semibold uppercase tracking-[0.08em] text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
            >
              Ver todos os kits
              <Sparkles className="h-4 w-4" />
            </Link>
            <span className="text-xs leading-6 text-[#6f6862]">
              Use filtros por objetivo e tipo de pele na pagina completa.
            </span>
          </div>
        ) : (
          <div className="mt-8 flex items-center gap-2 text-xs leading-6 text-[#6f6862]">
            <Check className="h-4 w-4 text-[#6c5e06]" />
            Kits organizados para comprar a rotina completa em uma única decisão.
          </div>
        )}
      </div>
    </section>
  );
}
