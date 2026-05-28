"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Menu,
  MoonStar,
  RefreshCcw,
  ShoppingBag,
  Sparkles,
  SunMedium,
  X
} from "lucide-react";

import { BundleRecommendationStrip } from "@/components/bundles/BundleRecommendationStrip";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { popClubPaths } from "@/lib/popclub/navigation";
import {
  ensureTopConcerns,
  normalizeSkinConcern,
  type ConcernKey,
  type OpenAiSkinAnalysis,
  type SkinAnalysisProduct
} from "@/lib/skincare/skinAnalysis";

type SkinAnalysisResultProps = {
  analysis: OpenAiSkinAnalysis;
  generatedAt: string;
  imageUrl?: string | null;
  recommendedProducts: SkinAnalysisProduct[];
};

type ZoneKey =
  | "forehead"
  | "nose"
  | "left_cheek"
  | "right_cheek"
  | "chin"
  | "eye_area";

type ZoneSummary = {
  id: ZoneKey;
  title: string;
  signals: string[];
  recommendation: string;
  tone: string;
  shortLabel: string;
  weight: number;
};

type IndicatorMetric = {
  title: string;
  score: number;
  valueLabel: string;
  descriptor: string;
};

type ResultNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

const zoneLabels: Record<ZoneKey, string> = {
  forehead: "Testa",
  nose: "Nariz",
  left_cheek: "Bochecha esquerda",
  right_cheek: "Bochecha direita",
  chin: "Queixo",
  eye_area: "Área dos olhos"
};

const concernTitles: Record<ConcernKey, string> = {
  hydration: "Hidratação",
  oiliness: "Oleosidade",
  redness: "Vermelhidão",
  texture: "Textura",
  uniformity: "Uniformidade",
  pores: "Poros visíveis",
  fine_lines: "Linhas finas"
};

const concernRecommendations: Record<ConcernKey, string> = {
  hydration: "Priorize hidratação de suporte e reforço da barreira da pele.",
  oiliness: "Prefira limpeza suave, textura leve e proteção com acabamento confortável.",
  redness: "Mantenha fórmulas suaves, calmantes e foco em barreira cutânea.",
  texture: "Combine renovação gradual com hidratação equilibrada.",
  uniformity: "Aposte em luminosidade, antioxidantes e proteção solar diária.",
  pores: "Prefira limpeza suave, séruns leves e textura mais equilibrada.",
  fine_lines: "Invista em hidratação, antioxidantes e renovação gradual."
};

const concernZoneFallbacks: Record<ConcernKey, ZoneKey[]> = {
  hydration: ["left_cheek", "right_cheek", "chin"],
  oiliness: ["forehead", "nose"],
  redness: ["left_cheek", "right_cheek"],
  texture: ["forehead", "nose", "left_cheek", "right_cheek"],
  uniformity: ["forehead", "left_cheek", "right_cheek"],
  pores: ["nose", "forehead"],
  fine_lines: ["eye_area", "forehead"]
};

const zoneOverlayLayout: Array<{
  id: ZoneKey;
  className: string;
}> = [
  {
    id: "forehead",
    className:
      "top-[15%] left-1/2 h-12 w-28 -translate-x-1/2 md:h-14 md:w-32"
  },
  {
    id: "left_cheek",
    className: "top-[39%] left-[14%] h-16 w-20 md:h-[74px] md:w-[92px]"
  },
  {
    id: "right_cheek",
    className: "top-[39%] right-[14%] h-16 w-20 md:h-[74px] md:w-[92px]"
  },
  {
    id: "nose",
    className: "top-[44%] left-1/2 h-14 w-16 -translate-x-1/2 md:h-16 md:w-[74px]"
  },
  {
    id: "chin",
    className:
      "bottom-[20%] left-1/2 h-12 w-20 -translate-x-1/2 md:bottom-[18%] md:h-14 md:w-24"
  }
];

const qualityStatusCopy = {
  good: "Qualidade boa",
  medium: "Qualidade média",
  poor: "Qualidade limitada"
} as const;

const qualityIssueCopy: Record<string, string> = {
  low_light: "A captura ficou um pouco escura.",
  blur: "A imagem perdeu definição em alguns pontos.",
  shadow: "Há sombras mais marcadas em parte do rosto.",
  overexposure: "A luz ficou mais intensa do que o ideal."
};

const zoneFallbackMessage = "Sem sinais visuais fortes nesta zona.";

const resultNavItems: ResultNavItem[] = [
  { label: "Inicio", href: popClubPaths.skinScan },
  { label: "Análise", href: "#topo", active: true },
  { label: "Rotina", href: "#rotina" },
  { label: "Loja", href: "#produtos" }
];

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function formatCurrency(value: number | null) {
  if (value === null) return "Consulte valor";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
}

function formatAnalysisDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Leitura recente";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function resolveZones(rawZones: string[], fallbackZones: ZoneKey[]) {
  const resolved = new Set<ZoneKey>();

  for (const rawZone of rawZones) {
    const zone = normalizeText(rawZone);

    if (zone.includes("testa")) resolved.add("forehead");
    if (zone.includes("nariz")) resolved.add("nose");
    if (zone.includes("olho")) resolved.add("eye_area");
    if (zone.includes("queixo")) resolved.add("chin");

    if (zone.includes("bochechas") || zone.includes("bochecha")) {
      if (zone.includes("esquerd")) {
        resolved.add("left_cheek");
      } else if (zone.includes("direit")) {
        resolved.add("right_cheek");
      } else {
        resolved.add("left_cheek");
        resolved.add("right_cheek");
      }
    }
  }

  if (resolved.size === 0) {
    fallbackZones.forEach((zone) => resolved.add(zone));
  }

  return Array.from(resolved);
}

function concernSignalWeight(label: string) {
  const normalized = normalizeText(label);

  if (
    normalized.includes("aparente") ||
    normalized.includes("elevada") ||
    normalized.includes("irregular")
  ) {
    return 3;
  }

  if (
    normalized.includes("leve") ||
    normalized.includes("moderad") ||
    normalized.includes("equilibrad")
  ) {
    return 2;
  }

  return 1;
}

function inferHydrationMetric(label: string) {
  const normalized = normalizeText(label);

  if (normalized.includes("sem sinais fortes")) {
    return { score: 86, descriptor: "Alta" };
  }

  if (normalized.includes("leve")) {
    return { score: 68, descriptor: "Moderada" };
  }

  if (normalized.includes("aparente")) {
    return { score: 42, descriptor: "Baixa" };
  }

  return { score: 60, descriptor: "Equilibrada" };
}

function inferOilinessMetric(label: string) {
  const normalized = normalizeText(label);

  if (normalized.includes("equilibrad")) {
    return { score: 74, descriptor: "Equilibrada" };
  }

  if (normalized.includes("baixa")) {
    return { score: 58, descriptor: "Baixa" };
  }

  if (normalized.includes("elevada")) {
    return { score: 44, descriptor: "Elevada" };
  }

  return { score: 60, descriptor: "Moderada" };
}

function createIndicatorMetrics(analysis: OpenAiSkinAnalysis): IndicatorMetric[] {
  const hydration = inferHydrationMetric(analysis.drynessAppearance.label);
  const oiliness = inferOilinessMetric(analysis.oilinessAppearance.label);

  return [
    {
      title: "Hidratação",
      score: hydration.score,
      valueLabel: `${hydration.score}%`,
      descriptor: hydration.descriptor
    },
    {
      title: "Textura",
      score: clamp(analysis.skinTexture.score),
      valueLabel: `${clamp(analysis.skinTexture.score)}%`,
      descriptor: analysis.skinTexture.label
    },
    {
      title: "Uniformidade",
      score: clamp(analysis.toneUniformity.score),
      valueLabel: `${clamp(analysis.toneUniformity.score)}%`,
      descriptor: analysis.toneUniformity.label
    },
    {
      title: "Oleosidade",
      score: oiliness.score,
      valueLabel: `${oiliness.score}%`,
      descriptor: oiliness.descriptor
    }
  ];
}

function createZoneSummaries(analysis: OpenAiSkinAnalysis): ZoneSummary[] {
  const base: Record<ZoneKey, ZoneSummary> = {
    forehead: {
      id: "forehead",
      title: zoneLabels.forehead,
      signals: [],
      recommendation: "",
      tone: "Equilibrada",
      shortLabel: "Equilíbrio",
      weight: 0
    },
    nose: {
      id: "nose",
      title: zoneLabels.nose,
      signals: [],
      recommendation: "",
      tone: "Equilibrada",
      shortLabel: "Equilíbrio",
      weight: 0
    },
    left_cheek: {
      id: "left_cheek",
      title: zoneLabels.left_cheek,
      signals: [],
      recommendation: "",
      tone: "Equilibrada",
      shortLabel: "Equilíbrio",
      weight: 0
    },
    right_cheek: {
      id: "right_cheek",
      title: zoneLabels.right_cheek,
      signals: [],
      recommendation: "",
      tone: "Equilibrada",
      shortLabel: "Equilíbrio",
      weight: 0
    },
    chin: {
      id: "chin",
      title: zoneLabels.chin,
      signals: [],
      recommendation: "",
      tone: "Equilibrada",
      shortLabel: "Equilíbrio",
      weight: 0
    },
    eye_area: {
      id: "eye_area",
      title: zoneLabels.eye_area,
      signals: [],
      recommendation: "",
      tone: "Equilibrada",
      shortLabel: "Equilíbrio",
      weight: 0
    }
  };

  const addSignal = (
    zones: ZoneKey[],
    signal: string,
    level: string,
    concern: ConcernKey
  ) => {
    const weight = concernSignalWeight(level);

    zones.forEach((zone) => {
      const entry = base[zone];
      entry.signals.push(signal);

      if (weight >= entry.weight) {
        entry.weight = weight;
        entry.recommendation = concernRecommendations[concern];
        entry.tone = level;
        entry.shortLabel = concernTitles[concern];
      }
    });
  };

  if (normalizeText(analysis.oilinessAppearance.label) !== "baixa") {
    addSignal(
      resolveZones(analysis.oilinessAppearance.zones, concernZoneFallbacks.oiliness),
      `Maior aparência de brilho: ${analysis.oilinessAppearance.label}.`,
      analysis.oilinessAppearance.label,
      "oiliness"
    );
  }

  if (normalizeText(analysis.drynessAppearance.label) !== "sem sinais fortes") {
    addSignal(
      resolveZones(analysis.drynessAppearance.zones, concernZoneFallbacks.hydration),
      `Sinais visuais de ressecamento: ${analysis.drynessAppearance.label}.`,
      analysis.drynessAppearance.label,
      "hydration"
    );
  }

  if (normalizeText(analysis.rednessAppearance.label) !== "baixa") {
    addSignal(
      resolveZones(analysis.rednessAppearance.zones, concernZoneFallbacks.redness),
      `Vermelhidão visível: ${analysis.rednessAppearance.label}.`,
      analysis.rednessAppearance.label,
      "redness"
    );
  }

  if (normalizeText(analysis.fineLinesAppearance.label) !== "não aparentes") {
    addSignal(
      resolveZones(analysis.fineLinesAppearance.zones, concernZoneFallbacks.fine_lines),
      `Linhas finas aparentes: ${analysis.fineLinesAppearance.label}.`,
      analysis.fineLinesAppearance.label,
      "fine_lines"
    );
  }

  if (normalizeText(analysis.visiblePores.label) !== "baixos") {
    addSignal(
      concernZoneFallbacks.pores,
      `Poros visíveis: ${analysis.visiblePores.label}.`,
      analysis.visiblePores.label,
      "pores"
    );
  }

  if (normalizeText(analysis.skinTexture.label) !== "uniforme") {
    addSignal(
      concernZoneFallbacks.texture,
      `Textura aparente: ${analysis.skinTexture.label}.`,
      analysis.skinTexture.label,
      "texture"
    );
  }

  if (normalizeText(analysis.toneUniformity.label) !== "uniforme") {
    addSignal(
      concernZoneFallbacks.uniformity,
      `Uniformidade visual: ${analysis.toneUniformity.label}.`,
      analysis.toneUniformity.label,
      "uniformity"
    );
  }

  return Object.values(base).map((zone) => ({
    ...zone,
    signals: zone.signals.length ? zone.signals : [zoneFallbackMessage],
    recommendation:
      zone.recommendation ||
      "Mantenha uma rotina leve, consistente e com proteção diária."
  }));
}

function AbstractHeroVisual() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.5),rgba(252,249,248,0.15)_40%,rgba(0,0,0,0.18)_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(0,0,0,0.08),transparent_28%,rgba(0,0,0,0.16)_100%)]" />
      <div className="absolute inset-x-[18%] top-[12%] h-[62%] rounded-[44%] border border-white/22" />
      <div className="absolute inset-x-[30%] top-[20%] h-[48%] rounded-[46%] border border-white/18" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(252,249,248,1),rgba(252,249,248,0.08)_42%,rgba(252,249,248,0.03))]" />
    </div>
  );
}

function AbstractFaceMap() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_50%_26%,rgba(255,255,255,0.44),rgba(236,225,217,0.58),rgba(222,208,199,0.92))]">
      <div className="absolute inset-x-[14%] top-[8%] h-[78%] rounded-[44%] border border-black/10" />
      <div className="absolute inset-x-[26%] top-[16%] h-[62%] rounded-[48%] border border-black/8" />
    </div>
  );
}

function QualityMeta({
  status,
  generatedAt
}: {
  status: OpenAiSkinAnalysis["imageQuality"]["status"];
  generatedAt: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.22em] text-[#6c645f]">
      <span className="border border-black/10 px-3 py-2">
        {qualityStatusCopy[status]}
      </span>
      <span className="inline-flex items-center gap-2 border border-black/10 px-3 py-2">
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
        {formatAnalysisDate(generatedAt)}
      </span>
    </div>
  );
}

function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around bg-[#fcf9f8]/96 px-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl md:hidden">
      <Link
        href={popClubPaths.skinScan}
        className="flex flex-col items-center justify-center pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#444748] opacity-50 transition-opacity active:scale-95"
      >
        Início
      </Link>
      <a
        href="#topo"
        className="flex flex-col items-center justify-center border-t-2 border-[#1A1A1A] pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1A1A1A] transition-transform active:scale-95"
      >
        Análise
      </a>
      <a
        href="#rotina"
        className="flex flex-col items-center justify-center pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#444748] opacity-50 transition-opacity active:scale-95"
      >
        Rotina
      </a>
      <Link
        href="#produtos"
        className="flex flex-col items-center justify-center pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#444748] opacity-50 transition-opacity active:scale-95"
      >
        Loja
      </Link>
    </nav>
  );
}

function DesktopResultNav() {
  return (
    <nav className="hidden items-center gap-7 md:flex">
      {resultNavItems.map((item) =>
        item.href.startsWith("#") ? (
          <a
            key={item.label}
            href={item.href}
            className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
              item.active
                ? "border-t border-[#1c1b1b] pt-2 text-[#1c1b1b]"
                : "pt-2 text-[#5d5752] transition-colors hover:text-[#1c1b1b]"
            }`}
          >
            {item.label}
          </a>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
              item.active
                ? "border-t border-[#1c1b1b] pt-2 text-[#1c1b1b]"
                : "pt-2 text-[#5d5752] transition-colors hover:text-[#1c1b1b]"
            }`}
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}

function MobileMenu({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#1c1b1b]/28 backdrop-blur-sm md:hidden">
      <div className="ml-auto flex min-h-full w-[86%] max-w-sm flex-col bg-[#fcf9f8] px-7 pb-8 pt-6 shadow-[-20px_0_60px_rgba(0,0,0,0.16)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6c5e06]">
              Skin Scan
            </p>
            <p className="mt-2 font-[var(--font-playfair)] text-2xl tracking-[-0.04em] text-[#1c1b1b]">
              BelaPop
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-12 min-w-12 items-center justify-center border border-black/10 text-[#1c1b1b] active:scale-95"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-12 flex flex-col gap-6">
          {resultNavItems.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
                  item.active
                    ? "border-t border-[#1c1b1b] pt-2 text-[#1c1b1b]"
                    : "pt-2 text-[#5d5752]"
                }`}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
                  item.active
                    ? "border-t border-[#1c1b1b] pt-2 text-[#1c1b1b]"
                    : "pt-2 text-[#5d5752]"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="mt-auto space-y-3 pt-12">
          <Link
            href="#rotina"
            onClick={onClose}
            className="flex min-h-14 w-full items-center justify-center gap-3 bg-[#1c1b1b] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Ver rotina
          </Link>
          <Link
            href={popClubPaths.skinScanCapture}
            onClick={onClose}
            className="flex min-h-14 w-full items-center justify-center border border-[#1c1b1b] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1c1b1b] active:scale-[0.98]"
          >
            Refazer scan
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SkinAnalysisResult({
  analysis,
  generatedAt,
  imageUrl,
  recommendedProducts
}: SkinAnalysisResultProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { user, ready: authReady } = useAuth();
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [allAdded, setAllAdded] = useState(false);
  const [shared, setShared] = useState(false);

  const routineTotal = recommendedProducts.reduce(
    (sum, p) => sum + (p.priceCents ?? 0),
    0
  );

  const addAllToCart = () => {
    recommendedProducts.forEach((p) => addItem(p.id, 1, p.sellerId ?? undefined));
    setAllAdded(true);
    window.setTimeout(() => router.push("/carrinho"), 400);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "Meu Skin Scan BelaPop", url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(url).catch(() => null);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    }
  };

  const indicatorMetrics = useMemo(() => createIndicatorMetrics(analysis), [analysis]);
  const zoneSummaries = useMemo(() => createZoneSummaries(analysis), [analysis]);
  const topConcerns = useMemo(
    () =>
      ensureTopConcerns(analysis).map(
        (concern) => concernTitles[concern] ?? concernTitles.hydration
      ),
    [analysis]
  );

  const concernBadge = (matchedConcern: string) => {
    const normalized = normalizeSkinConcern(matchedConcern);
    return normalized ? concernTitles[normalized] : "Rotina sugerida";
  };

  const qualityIssues = analysis.imageQuality.issues
    .map((issue) => qualityIssueCopy[issue] ?? issue)
    .slice(0, 2);

  return (
    <div id="topo" className="min-h-screen overflow-x-hidden bg-[#fcf9f8] text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcf9f8]/88 px-4 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] md:px-8">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
                return;
              }

              router.push(popClubPaths.skinScanCapture);
            }}
            className="flex min-h-11 min-w-11 items-center justify-center transition-opacity active:opacity-70"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" aria-hidden="true" />
          </button>

          <div className="flex flex-1 items-center justify-center md:justify-start">
            <h1 className="font-[var(--font-playfair)] text-xl font-bold uppercase tracking-[-0.04em] text-[#1A1A1A]">
              BelaPop
            </h1>
          </div>

          <DesktopResultNav />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void handleShare()}
              className="flex min-h-11 min-w-11 items-center justify-center text-[10px] uppercase tracking-[0.14em] text-[#444748] transition-opacity active:opacity-70 md:gap-1"
              aria-label="Compartilhar resultado"
            >
              {shared ? "✓ Copiado" : <Sparkles className="h-4 w-4 text-[#1A1A1A]" aria-hidden="true" />}
            </button>
            <Link
              href="/carrinho"
              className="flex min-h-11 min-w-11 items-center justify-center transition-opacity active:opacity-70"
              aria-label="Abrir carrinho"
            >
              <ShoppingBag className="h-5 w-5 text-[#1A1A1A]" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex min-h-11 min-w-11 items-center justify-center transition-opacity active:opacity-70 md:hidden"
              aria-label="Abrir menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-5 w-5 text-[#1A1A1A]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="pb-32 pt-16 md:pb-20">
        <section className="relative flex min-h-[530px] flex-col justify-end overflow-hidden bg-[#fcf9f8] px-8 pb-12 md:min-h-[640px] lg:px-16 lg:pb-20">
          <div className="absolute inset-0 z-0">
            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt="Leitura visual da pele capturada pelo Skin Scan BelaPop"
                  className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(252,249,248,1),rgba(252,249,248,0.12)_42%,rgba(252,249,248,0.06))]" />
              </>
            ) : (
              <AbstractHeroVisual />
            )}
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl space-y-4">
            <h2 className="max-w-xl font-[var(--font-playfair)] text-4xl font-bold leading-tight tracking-[-0.05em] text-[#1c1b1b] lg:text-6xl">
              Sua Leitura de Pele
            </h2>
            <p className="max-w-xs text-[15px] leading-7 text-[#444748] opacity-80 lg:max-w-md">
              Com base na imagem capturada, identificamos sinais visuais aparentes da sua pele.
            </p>
            <QualityMeta status={analysis.imageQuality.status} generatedAt={generatedAt} />
          </div>
        </section>

        <section className="relative z-20 -mt-8 px-6 lg:-mt-10 lg:px-16">
          <div className="mx-auto max-w-7xl border-l-4 border-[#dac769] bg-white px-8 py-9 shadow-[0_10px_40px_rgba(0,0,0,0.05)] lg:px-10 lg:py-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6c5e06]">
              Leitura Visual
            </span>
            <h3 className="mt-2 font-[var(--font-playfair)] text-2xl text-[#1c1b1b] lg:text-3xl">
              Seu Momento de Pele
            </h3>
            <p className="mt-6 text-[15px] italic leading-8 text-[#1c1b1b]">
              &quot;{analysis.summary}&quot;
            </p>
            {qualityIssues.length ? (
              <p className="mt-6 max-w-2xl text-xs leading-6 text-[#5d5752]">
                {qualityIssues.join(" ")}
              </p>
            ) : null}
          </div>
        </section>

        {authReady && !user && (
          <section className="mt-8 px-6 lg:px-16">
            <div className="mx-auto max-w-7xl flex flex-col items-start gap-3 rounded-2xl border border-[#dac769]/40 bg-[#fffbeb] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#6c5e06]">Salve esta análise no seu perfil</p>
                <p className="mt-1 text-xs text-[#5d5752]">
                  Crie uma conta gratuita para acompanhar sua evolução e acessar a rotina salva quando quiser.
                </p>
              </div>
              <Link
                href={`/login?tab=customer&returnTo=${encodeURIComponent("/skin-scan/resultado")}`}
                className="shrink-0 inline-flex items-center justify-center bg-[#1c1b1b] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#6c5e06]"
              >
                Salvar análise
              </Link>
            </div>
          </section>
        )}

        {authReady && user && (
          <section className="mt-8 px-6 lg:px-16">
            <div className="mx-auto max-w-7xl flex items-center gap-2 rounded-2xl border border-[#1D9E75]/20 bg-[#f0fdf4] px-5 py-3">
              <span className="text-xs font-semibold text-[#1D9E75]">✓ Análise salva no seu perfil</span>
              <Link href="/conta/skincare" className="ml-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1D9E75] underline underline-offset-4">
                Ver histórico
              </Link>
            </div>
          </section>
        )}

        <section className="mt-20 px-6 lg:px-16">
          <h4 className="mb-10 text-center text-xs uppercase tracking-[0.22em] text-[#444748]">
            Indicadores de Saúde
          </h4>
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-black/8 lg:grid-cols-4">
            {indicatorMetrics.map((metric) => (
              <div
                key={metric.title}
                className="bg-[#fcf9f8] px-6 py-8 text-center lg:px-8"
              >
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#1c1b1b]">
                  {metric.title}
                </span>
                <div className="relative mx-auto mb-4 mt-4 h-1 w-12 bg-[#e5e2e1]">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#1c1b1b] transition-[width] duration-700 ease-out"
                    style={{ width: `${metric.score}%`, transitionDelay: "200ms" }}
                  />
                </div>
                <p className="text-xs text-[#444748]">
                  {metric.valueLabel} — {metric.descriptor}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 px-6 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col items-center">
            <h4 className="mb-12 text-xs uppercase tracking-[0.22em] text-[#444748]">
              Mapeamento Facial
            </h4>
            <div className="relative h-96 w-72 md:h-[30rem] md:w-80">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Mapa visual do rosto usado na leitura BelaPop"
                  className="h-full w-full object-cover grayscale opacity-40"
                />
              ) : (
                <AbstractFaceMap />
              )}

              {zoneOverlayLayout.map((overlay) => {
                const zone = zoneSummaries.find((item) => item.id === overlay.id);

                if (!zone) return null;

                return (
                  <div
                    key={overlay.id}
                    className={`absolute flex items-center justify-center border border-[#dac769]/50 bg-white/10 px-2 text-center backdrop-blur-[1px] ${overlay.className}`}
                  >
                    <span className="text-[8px] uppercase tracking-tight text-[#6c5e06]">
                      {zone.title}: {zone.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
              {zoneSummaries.map((zone) => (
                <article key={zone.id} className="bg-[#fcf9f8] px-5 py-5">
                  <h5 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6c5e06]">
                    {zone.title}
                  </h5>
                  <p className="mt-3 text-sm leading-7 text-[#1c1b1b]">
                    {zone.signals[0]}
                  </p>
                  <p className="mt-3 text-xs leading-6 text-[#5d5752]">
                    {zone.recommendation}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="rotina" className="mt-24 bg-[#f6f3f2] py-20 scroll-mt-24">
          <div className="mx-auto mb-12 max-w-7xl px-6 lg:px-16">
            <h4 className="font-[var(--font-playfair)] text-3xl text-[#1c1b1b] lg:text-4xl">
              Sua Rotina BelaPop
            </h4>
            <p className="mt-4 text-sm text-[#444748]">
              Protocolo exclusivo baseado na sua análise.
            </p>
          </div>

          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:grid lg:grid-cols-2 lg:px-16">
            <div className="bg-[#fcf9f8] p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SunMedium className="h-4 w-4 text-[#6c5e06]" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">
                    Manhã
                  </span>
                </div>
                <span className="text-[10px] italic text-[#444748]">
                  {String(analysis.routineRecommendation.morning.length).padStart(2, "0")} Passos
                </span>
              </div>

              <div className="space-y-4">
                {analysis.routineRecommendation.morning.map((step, index) => (
                  <div
                    key={step}
                    className={`flex items-center gap-4 py-2 ${
                      index < analysis.routineRecommendation.morning.length - 1
                        ? "border-b border-black/8"
                        : ""
                    }`}
                  >
                    <span className="font-[var(--font-playfair)] text-xl text-[#6c5e06]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#fcf9f8] p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MoonStar className="h-4 w-4 text-[#1c1b1b]" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">
                    Noite
                  </span>
                </div>
                <span className="text-[10px] italic text-[#444748]">
                  {String(analysis.routineRecommendation.night.length).padStart(2, "0")} Passos
                </span>
              </div>

              <div className="space-y-4">
                {analysis.routineRecommendation.night.map((step, index) => (
                  <div
                    key={step}
                    className={`flex items-center gap-4 py-2 ${
                      index < analysis.routineRecommendation.night.length - 1
                        ? "border-b border-black/8"
                        : ""
                    }`}
                  >
                    <span className="font-[var(--font-playfair)] text-xl text-[#1c1b1b]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="produtos" className="mt-24 overflow-hidden px-6 scroll-mt-24 lg:px-16">
          <div className="mx-auto mb-10 flex max-w-7xl flex-col gap-4">
            <h4 className="text-center text-xs uppercase tracking-[0.2em] text-[#444748]">
              Escolhidos para sua pele
            </h4>
            {topConcerns.length ? (
              <div className="flex flex-wrap justify-center gap-2">
                {topConcerns.map((concern) => (
                  <span
                    key={concern}
                    className="border border-black/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#5d5752]"
                  >
                    {concern}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {recommendedProducts.length ? (
            <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-4">
              {recommendedProducts.map((product) => (
                <article key={product.id} className="min-w-[240px] bg-[#fcf9f8] md:min-w-0">
                  <div className="mb-4 aspect-[3/4] overflow-hidden bg-[#f0eded]">
                    {product.heroImageUrl ? (
                      <img
                        src={product.heroImageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-[#8a7d74]">
                        BelaPop
                      </div>
                    )}
                  </div>

                  <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6c5e06]">
                    {product.brand ?? "Curadoria BelaPop"}
                  </h5>
                  <p className="mt-1 font-[var(--font-playfair)] text-lg text-[#1c1b1b]">
                    {product.name}
                  </p>
                  <p className="mb-2 mt-1 text-xs text-[#444748]">
                    {concernBadge(product.matchedConcern)}
                  </p>
                  <p className="mb-4 text-xs leading-6 text-[#5d5752]">{product.reason}</p>
                  <p className="mb-4 text-sm text-[#1c1b1b]">{formatCurrency(product.priceCents)}</p>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        addItem(product.id, 1, product.sellerId ?? undefined);
                        setAddedProductId(product.id);
                      }}
                      className="w-full bg-[#1c1b1b] py-3 text-[10px] uppercase tracking-[0.2em] text-white transition-opacity active:opacity-90"
                    >
                      {addedProductId === product.id ? "Adicionado" : "Comprar"}
                    </button>
                    <Link
                      href={`/produto/${product.slug}`}
                      className="w-full border border-[#1c1b1b] py-3 text-center text-[10px] uppercase tracking-[0.2em] text-[#1c1b1b] transition-all active:bg-[#1c1b1b] active:text-white"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-[#fcf9f8] px-6 py-8 text-center text-sm leading-7 text-[#5d5752]">
              Não encontramos uma seleção precisa agora. Refaça o scan facial ou siga para uma curadoria mais específica.
            </div>
          )}
        </section>

        <section className="mt-24 px-6 lg:px-16">
          <div className="mx-auto max-w-7xl space-y-4 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
            <Link
              href="#rotina"
              className="block w-full bg-[#6c5e06] px-6 py-5 text-center text-xs font-bold uppercase tracking-[0.3em] text-white shadow-lg transition-transform active:scale-[0.98]"
            >
              Montar minha rotina
            </Link>
            <Link
              href="#produtos"
              className="block w-full border border-[#1c1b1b] px-6 py-5 text-center text-xs uppercase tracking-[0.3em] text-[#1c1b1b] transition-all active:bg-[#1c1b1b] active:text-white"
            >
              Ver produtos recomendados
            </Link>
            <Link
              href={popClubPaths.skinScanCapture}
              className="flex w-full items-center justify-center gap-2 px-6 py-5 text-center text-[10px] uppercase tracking-[0.2em] text-[#444748] transition-opacity active:opacity-50"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Refazer scan facial
            </Link>
          </div>
        </section>

        <BundleRecommendationStrip
          title="Kits sugeridos para transformar a leitura em rotina"
          subtitle="Depois do Skin Scan, escolha um ritual pronto com produtos conectados e ordem de uso clara."
          limit={3}
          className="mt-20"
        />

        <footer className="mt-20 px-10 pb-24 text-center md:pb-16">
          <p className="text-[9px] uppercase leading-loose tracking-[0.2em] text-[#444748]/60">
            {analysis.disclaimer}
            <br />
            BelaPop Atelier Digital © 2024
          </p>
        </footer>
      </main>

      {recommendedProducts.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-black/10 bg-[#fcf9f8]/95 px-4 backdrop-blur md:hidden"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", paddingTop: 12 }}
        >
          <button
            type="button"
            onClick={addAllToCart}
            disabled={allAdded}
            className="min-h-[52px] w-full bg-[#1c1b1b] px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#6c5e06] disabled:opacity-70"
          >
            {allAdded
              ? "Adicionando ao carrinho..."
              : `Adicionar rotina completa · ${formatCurrency(routineTotal)}`}
          </button>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
