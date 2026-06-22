"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import SkinAnalysisResult from "@/components/popclub/skin-scan/SkinAnalysisResult";
import { popClubPaths } from "@/lib/popclub/navigation";
import {
  SKIN_ANALYSIS_SESSION_STORAGE_KEY,
  skinAnalysisSessionSchema,
  type SkinAnalysisSession
} from "@/lib/skincare/skinAnalysis";

type LoadState = "loading" | "ready" | "missing";

const previewSession: SkinAnalysisSession = {
  generatedAt: new Date().toISOString(),
  imagePreviewDataUrl: null,
  recommendedProducts: [
    {
      id: "preview-creme-de-la-mer",
      slug: "creme-de-la-mer",
      name: "Creme de la Mer",
      brand: "La Mer",
      category: "Skincare",
      heroImageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAoZSDZRQ2KBIrSlpJk8sT9llWwZgL75yM2_Tw_VMoogGAGKrYxJvbODbv8VtRoeAO1YIbq2NZJE6W4oXzqPcPwTF9ilF37mlXx5B3Yzxi8pbyo1adI7nTTUnncJr9Sniz4_zEsJGeqAFS5iUL0ux4NKuTZZlot-8yLtwp9OrZG0MG7-mxhOUXpeRZ7PXUNPSlHgSE2XNs6rYt0n24t4BduPhZUAr7VVqKuGWLmSbMemX_D1quQa-Tv2yOYyYTSAtgjl1FXQzH7FODO",
      priceCents: 145000,
      sellerId: null,
      reason: "Ajuda a reforcar hidratação, conforto e equilibrio da barreira da pele.",
      matchedConcern: "hydration"
    },
    {
      id: "preview-sublimage",
      slug: "sublimage-lextrait",
      name: "Sublimage L'Extrait",
      brand: "Chanel",
      category: "Skincare",
      heroImageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC1IUq5RCeJAS8NOcsTuwaJEz0qME4Dhl0yo4gSjf7uEblw9ZgZGPTJd0A2_YirD_jRPVYT1r1-F9Af1dX0rTtk36fWQ4hST7knQjstIWpv78LOdWucNKNBiUleK6I2iuhrWo1_kYFqvSjb351szDY9qq-R4qQIeMUko1SUXyLwULtvDsbiKaUZ5vCbEU5L6AvEENzaPXVMUTYvekwZS9M29RR-Tu3VFGZhvpoGbiJW7woZ6z1gtHOG3x66ACZCOOeQHJTaRiiwWVei",
      priceCents: 220000,
      sellerId: null,
      reason: "Ajuda a apoiar luminosidade e proteção diaria quando o foco e uniformidade visual.",
      matchedConcern: "uniformity"
    }
  ],
  analysis: {
    imageQuality: {
      status: "good",
      issues: [],
      canAnalyze: true
    },
    skinTexture: {
      label: "Lisa",
      score: 85,
      confidence: 0.9
    },
    visiblePores: {
      label: "baixos",
      score: 78,
      confidence: 0.86
    },
    oilinessAppearance: {
      label: "equilibrada",
      zones: ["nariz"],
      confidence: 0.82
    },
    drynessAppearance: {
      label: "leve",
      zones: ["bochechas"],
      confidence: 0.84
    },
    rednessAppearance: {
      label: "baixa",
      zones: [],
      confidence: 0.8
    },
    toneUniformity: {
      label: "Regular",
      score: 70,
      confidence: 0.83
    },
    fineLinesAppearance: {
      label: "não aparentes",
      zones: [],
      confidence: 0.8
    },
    topConcerns: ["hydration", "uniformity"],
    summary:
      "Sua pele apresenta uma vitalidade notavel, com leve desidratacao nas zonas perifericas. A textura esta refinada, sugerindo um ciclo de renovacao equilibrado.",
    routineRecommendation: {
      morning: [
        "Limpeza Suave Micelar",
        "Serum Vitamina C + E",
        "Protetor Fluido Invisivel"
      ],
      night: ["Balsamo Demaquilante Nutritivo", "Creme Regenerador Noturno"]
    },
    disclaimer:
      "Leitura cosmética visual — não substitui avaliação dermatológica."
  }
};

function ResultFallback({ loadState }: { loadState: LoadState }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcf9f8] text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-[#fcf9f8]/84 px-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
        <Link href={popClubPaths.skinScanCapture} aria-label="Voltar para o Skin Scan">
          <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" aria-hidden="true" />
        </Link>
        <h1 className="font-[var(--font-playfair)] text-xl font-bold uppercase tracking-[-0.04em] text-[#1A1A1A]">
          BelaPop
        </h1>
        <Link href="/carrinho" aria-label="Abrir carrinho">
          <ShoppingBag className="h-5 w-5 text-[#1A1A1A]" aria-hidden="true" />
        </Link>
      </header>

      <main className="flex min-h-screen items-center justify-center px-6 pb-28 pt-24">
        <div className="w-full max-w-2xl bg-white px-8 py-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#6c5e06]">
            Skin Scan BelaPop
          </p>

          {loadState === "loading" ? (
            <>
              <h1 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-[-0.04em] text-[#111111]">
                Carregando sua leitura
              </h1>
              <p className="mt-4 text-sm leading-7 text-[#5b5551]">
                Estamos organizando sua leitura visual para mostrar tudo com clareza.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-4 font-[var(--font-playfair)] text-3xl tracking-[-0.04em] text-[#111111]">
                Não encontramos uma análise válida para exibir.
              </h1>
              <p className="mt-4 text-sm leading-7 text-[#5b5551]">
                Você pode fazer um novo Skin Scan agora. Se esta página foi aberta
                sem uma captura válida, vamos te levar de volta para o início da leitura.
              </p>
              <Link
                href={popClubPaths.skinScanCapture}
                className="mt-8 inline-flex min-h-14 items-center justify-center bg-[#111111] px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white"
              >
                Fazer novo Skin Scan
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SkinScanResultExperience() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [sessionData, setSessionData] = useState<SkinAnalysisSession | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (new URLSearchParams(window.location.search).get("preview") === "1") {
        setSessionData(previewSession);
        setLoadState("ready");
        return;
      }

      const raw = window.sessionStorage.getItem(SKIN_ANALYSIS_SESSION_STORAGE_KEY);

      if (!raw) {
        setLoadState("missing");
        return;
      }

      const parsed = skinAnalysisSessionSchema.parse(JSON.parse(raw));
      setSessionData(parsed);
      setLoadState("ready");
    } catch {
      window.sessionStorage.removeItem(SKIN_ANALYSIS_SESSION_STORAGE_KEY);
      setLoadState("missing");
    }
  }, []);

  useEffect(() => {
    if (loadState !== "ready" || !sessionData) return;

    const a = sessionData.analysis;
    void fetch("/api/v1/me/skin-scan-snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generatedAt: sessionData.generatedAt,
        summary: a.summary,
        topConcerns: a.topConcerns,
        skinTexture: { score: a.skinTexture.score, label: a.skinTexture.label },
        visiblePores: { score: a.visiblePores.score, label: a.visiblePores.label },
        toneUniformity: { score: a.toneUniformity.score, label: a.toneUniformity.label },
        oilinessLabel: a.oilinessAppearance.label,
        drynessLabel: a.drynessAppearance.label,
        rednessLabel: a.rednessAppearance.label
      })
    });
  }, [loadState, sessionData]);

  useEffect(() => {
    if (loadState !== "missing") return;

    const timeoutId = window.setTimeout(() => {
      router.replace(popClubPaths.skinScanCapture);
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [loadState, router]);

  if (loadState === "ready" && sessionData) {
    return (
      <SkinAnalysisResult
        analysis={sessionData.analysis}
        generatedAt={sessionData.generatedAt}
        imageUrl={sessionData.imagePreviewDataUrl ?? null}
        recommendedProducts={sessionData.recommendedProducts}
        sessionData={sessionData}
      />
    );
  }

  return <ResultFallback loadState={loadState} />;
}
