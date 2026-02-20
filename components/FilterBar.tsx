"use client";

import React from "react";

type FilterBarProps = {
  search: string;
  category: string;
  sort: string;
  categories: string[];
  tone?: "light" | "dark";
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
};

export const FilterBar = ({
  search,
  category,
  sort,
  categories,
  tone = "dark",
  onSearchChange,
  onCategoryChange,
  onSortChange
}: FilterBarProps) => {
  const isLight = tone === "light";
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl p-5 md:flex-row md:items-center md:justify-between ${
        isLight ? "border border-black/10 bg-white shadow-sm" : "glass-panel"
      }`}
    >
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nome"
          className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:border-bpPink/60 ${
            isLight
              ? "border-slate-200 bg-white text-bpBlackSoft placeholder:text-bpGraphite/60"
              : "border-white/10 bg-bpBlackSoft text-bpOffWhite placeholder:text-bpPinkSoft/50"
          }`}
        />
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:border-bpPink/60 md:w-56 ${
            isLight
              ? "border-slate-200 bg-white text-bpBlackSoft"
              : "border-white/10 bg-bpBlackSoft text-bpOffWhite"
          }`}
        >
          <option value="">Todas categorias</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value)}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:border-bpPink/60 md:w-56 ${
          isLight
            ? "border-slate-200 bg-white text-bpBlackSoft"
            : "border-white/10 bg-bpBlackSoft text-bpOffWhite"
        }`}
      >
        <option value="featured">Destaque</option>
        <option value="asc">Menor preço</option>
        <option value="desc">Maior preço</option>
      </select>
    </div>
  );
};

