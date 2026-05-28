"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useCart } from "@/lib/CartContext";
import { getBeneficio } from "@/lib/skin-scan/ativos-map";
import {
  BELAPOP_SCAN_KEY,
  LEGACY_SKIN_SCAN_KEYS,
  SKIN_SCAN_FOCOS_KEY,
} from "@/types/skin-scan";
import type { RotinaPasso, SkinRotina, SkinScanResult } from "@/types/skin-scan";

type RoutineTab = "manha" | "noite" | "semanal" | "semana1";

const CATEGORY_ICONS: Record<string, string> = {
  limpeza: "○",
  tonico: "◇",
  serum: "◆",
  hidratante: "◎",
  protetor: "☀",
  tratamento: "✦",
};

const PERIOD_LABELS: Record<RoutineTab, string> = {
  manha: "Manhã",
  noite: "Noite",
  semanal: "Semanal",
  semana1: "Semana 1",
};

function ProductCard({ product, step }: { product: RotinaPasso; step: number }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product.slug, 1, "belapop");
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div style={{ border: "1px solid rgba(30,30,30,0.09)", background: "#fff" }} className="space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50 text-base text-neutral-400">
            {CATEGORY_ICONS[product.categoria] ?? "•"}
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400">Passo {step}</p>
            <h3 className="text-sm font-medium">{product.nome}</h3>
          </div>
        </div>
        <span className="whitespace-nowrap text-sm font-medium">
          R$ {product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <p className="border-l-2 border-neutral-200 pl-3 text-xs italic text-neutral-500">
        {product.comoUsar}
      </p>

      {product.ativosChave.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.ativosChave.map((ativo) => (
            <span
              key={ativo}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] text-neutral-600"
            >
              {ativo}
            </span>
          ))}
        </div>
      )}

      <details className="group">
        <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-neutral-400 transition-colors hover:text-black">
          Por que foi recomendado ↓
        </summary>
        <div className="mt-2 space-y-3 text-xs leading-relaxed text-neutral-500">
          <p>{product.porQueRecomendado}</p>

          {/* Ativos e benefícios */}
          {product.ativosChave.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                O que cada ativo faz
              </p>
              {product.ativosChave.map((ativo) => {
                const beneficio = getBeneficio(ativo);
                return (
                  <div key={ativo} className="flex gap-2">
                    <span className="shrink-0 font-medium text-neutral-700">{ativo}:</span>
                    <span>{beneficio ?? "Ativo cosmético com função específica para esta rotina"}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Base científica */}
          {product.evidencia && (
            <p className="rounded-lg bg-neutral-50 p-2 font-medium text-neutral-600">
              🔬 Grau {product.evidencia.grau} — {product.evidencia.fonte}
            </p>
          )}

          {product.alertaSinergia && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700">
              ⚠ {product.alertaSinergia}
            </p>
          )}
        </div>
      </details>

      <div className="flex gap-2 pt-1">
        <Link
          href={`/produto/${product.slug}`}
          className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-center text-xs tracking-wider transition-colors hover:border-black"
        >
          VER PRODUTO
        </Link>
        <button
          type="button"
          onClick={handleAdd}
          disabled={added}
          className="flex-1 rounded-lg bg-black py-2.5 text-xs tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {added ? "✓ ADICIONADO" : "ADICIONAR"}
        </button>
      </div>
    </div>
  );
}

export default function SkinScanRotinaPage() {
  const { addItem } = useCart();
  const router = useRouter();
  const [result, setResult] = useState<SkinScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<RoutineTab>("manha");
  const [allAdded, setAllAdded] = useState(false);

  useEffect(() => {
    const raw =
      sessionStorage.getItem(BELAPOP_SCAN_KEY) ??
      sessionStorage.getItem("BELAPOP_SCAN_KEY");

    if (!raw) {
      router.replace("/skin-scan/foco");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SkinScanResult;

      // Normalizar campos ausentes em dados de sessões antigas
      if (parsed.rotina) {
        parsed.rotina.semanal = parsed.rotina.semanal ?? [];
        parsed.rotina.manha   = parsed.rotina.manha   ?? [];
        parsed.rotina.noite   = parsed.rotina.noite   ?? [];
      }

      setResult(parsed);
    } catch {
      router.replace("/skin-scan/foco");
    }
  }, [router]);

  const tabs = useMemo<RoutineTab[]>(() => {
    const base: RoutineTab[] = ["manha", "noite"];
    if (result?.rotina.semanal?.length) base.push("semanal");
    if (result?.rotina.semana1?.length) base.unshift("semana1");
    return base;
  }, [result]);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  const rotina: SkinRotina = result.rotina;
  const currentProducts = rotina[activeTab] ?? [];
  const tipoPele = result.analise.tipoPele;

  // Produtos únicos de toda a rotina (para o CTA de kit completo)
  const allProducts = useMemo(() => {
    const seen = new Set<string>();
    const items: RotinaPasso[] = [];
    for (const produto of [
      ...(rotina.manha ?? []),
      ...(rotina.noite ?? []),
      ...(rotina.semanal ?? []),
      ...(rotina.semana1 ?? []),
    ]) {
      if (!seen.has(produto.slug)) {
        seen.add(produto.slug);
        items.push(produto);
      }
    }
    return items;
  }, [rotina]);

  const totalRotina = allProducts.reduce((sum, p) => sum + p.preco, 0);

  const handleAddAll = () => {
    for (const produto of allProducts) {
      addItem(produto.slug, 1, "belapop");
    }
    setAllAdded(true);
    setTimeout(() => setAllAdded(false), 4000);
  };

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Sua rotina personalizada</p>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)" }} className="text-3xl">
          Rotina para pele {tipoPele}
        </h1>
        <p className="text-sm text-neutral-500">
          Baseada em evidencias PubMed, AAD 2024 e rotina real BelaPop
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2.5 text-xs tracking-wider transition-colors ${
              activeTab === tab
                ? "bg-white font-medium text-black shadow-sm"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            {PERIOD_LABELS[tab].toUpperCase()}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-400">
        {currentProducts.length} produto{currentProducts.length !== 1 ? "s" : ""} na rotina de{" "}
        {PERIOD_LABELS[activeTab].toLowerCase()}
      </p>

      {/* Melhoria 3.3 — CTA "Adicionar rotina completa" */}
      {allProducts.length > 0 && (
        <button
          type="button"
          onClick={handleAddAll}
          disabled={allAdded}
          className="w-full rounded-xl border-2 border-black bg-black py-4 text-center text-sm font-semibold tracking-wider text-white transition-all hover:bg-neutral-800 disabled:border-green-600 disabled:bg-green-600"
        >
          {allAdded
            ? `✓ ${allProducts.length} produtos adicionados`
            : `Adicionar rotina completa — R$ ${totalRotina.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
        </button>
      )}

      {currentProducts.length > 0 ? (
        <div className="space-y-4">
          {currentProducts.map((product, index) => (
            <ProductCard key={`${activeTab}-${product.slug}`} product={product} step={index + 1} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-neutral-400">
          <p className="text-sm">Nenhum produto especifico para este periodo.</p>
          <p className="mt-1 text-xs">Mantenha os produtos da manha como base.</p>
        </div>
      )}

      <section className="space-y-2 rounded-xl bg-neutral-50 p-5">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Base cientifica</p>
        <p className="text-xs leading-relaxed text-neutral-500">
          As recomendacoes combinam os sinais visuais da leitura, os focos selecionados e ativos com
          evidencia para barreira, sebo, textura, manchas e fotoprotecao. Esta analise e orientativa
          e nao substitui avaliacao dermatologica presencial.
        </p>
      </section>

      <div className="space-y-3">
        <Link
          href="/skin-scan/resultado"
          className="block w-full rounded-xl border border-neutral-200 py-3 text-center text-sm tracking-wider transition-colors hover:border-black"
        >
          ← Ver resultado da analise
        </Link>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(BELAPOP_SCAN_KEY);
            sessionStorage.removeItem(SKIN_SCAN_FOCOS_KEY);
            for (const key of LEGACY_SKIN_SCAN_KEYS) {
              sessionStorage.removeItem(key);
            }
            router.push("/skin-scan");
          }}
          className="block w-full py-3 text-center text-sm text-neutral-400 transition-colors hover:text-black"
        >
          Comecar nova analise
        </button>
      </div>
    </main>
  );
}
