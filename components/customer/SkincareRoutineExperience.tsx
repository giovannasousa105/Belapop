"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Droplets,
  FlaskConical,
  MoonStar,
  Shield,
  Sparkles,
  SunMedium,
  Trash2,
  type LucideIcon
} from "lucide-react";

import BelaCodeCameraCapture from "@/components/customer/BelaCodeCameraCapture";
import { formatMoneyFromCents } from "@/lib/customer/portal";
import {
  deleteCustomerBelaCodeScan,
  getCustomerBelaCodeScans,
  getCustomerSkinProfile,
  postCustomerSkinGptQuestion,
  getCustomerSkinTwin,
  getCustomerSkincareRoutine,
  getCustomerSkincareSimulations,
  postCustomerSkincareSimulations,
  patchCustomerSkinProfile,
  postCustomerBelaCodeAnalyze,
  postCustomerBelaCodeScan,
  postCustomerSkincareRoutineCart,
  postCustomerSkincareUsage,
  type CustomerBelaCodeScanItem,
  type CustomerRoutineCart,
  type CustomerRoutineGroup,
  type CustomerSimilarSkinProfile,
  type CustomerSkinConcernOption,
  type CustomerSkinMetricSet,
  type CustomerSkinImage,
  type CustomerSkinProfile,
  type CustomerSkinScan,
  type CustomerSkinGptResponse,
  type CustomerSkinToneOption,
  type CustomerSkinTwinResponse,
  type CustomerSkinTwin,
  type CustomerSkinTypeOption,
  type CustomerSkincareSimulationResponse,
  type CustomerTreatmentOutcomeSummary
} from "@/lib/customer/api";
import { skinMetricKeys, skinMetricLabels, type SkinMetricKey } from "@/lib/skincare/twin";
import { getSkinBelaEvidenceHref } from "@/lib/skingpt/publicEvidenceLinks";

type ProfileFormState = {
  skin_type_id: string | null;
  skin_tone_id: string | null;
  main_concern_id: string | null;
  sensitivity_level: number;
  price_affinity_cents: number | null;
};

type ScanFormState = {
  hydration_score: number;
  elasticity_score: number;
  pigmentation_score: number;
  acne_score: number;
  redness_score: number;
  pore_visibility: number;
  wrinkle_depth: number;
  image_url: string;
  brightness_score: number;
  centered_face_score: number;
  minimal_makeup_score: number;
  texture_score: number;
  depth_score: number;
  blink_detected: boolean;
  head_movement: boolean;
  smile_detected: boolean;
  frown_detected: boolean;
};

type ScanMetricFieldKey =
  | "hydration_score"
  | "elasticity_score"
  | "pigmentation_score"
  | "acne_score"
  | "redness_score"
  | "pore_visibility"
  | "wrinkle_depth";

const defaultFormState: ProfileFormState = {
  skin_type_id: null,
  skin_tone_id: null,
  main_concern_id: null,
  sensitivity_level: 3,
  price_affinity_cents: null
};

const defaultScanFormState: ScanFormState = {
  hydration_score: 52,
  elasticity_score: 54,
  pigmentation_score: 48,
  acne_score: 42,
  redness_score: 36,
  pore_visibility: 44,
  wrinkle_depth: 32,
  image_url: "",
  brightness_score: 72,
  centered_face_score: 84,
  minimal_makeup_score: 86,
  texture_score: 70,
  depth_score: 68,
  blink_detected: true,
  head_movement: true,
  smile_detected: true,
  frown_detected: true
};

const baselineSourceLabels: Record<string, string> = {
  twin: "Baseado no seu twin atual",
  scan: "Baseado no seu ultimo scan",
  profile: "Estimativa baseada no quiz",
  default: "Base inicial da plataforma"
};

const heatmapStyles: Record<string, { color: string; glow: string; label: string }> = {
  acne: { color: "rgba(225, 29, 72, 0.44)", glow: "rgba(225, 29, 72, 0.18)", label: "Acne" },
  hydration: { color: "rgba(251, 191, 36, 0.34)", glow: "rgba(251, 191, 36, 0.16)", label: "Hidratacao" },
  pigmentation: { color: "rgba(249, 115, 22, 0.34)", glow: "rgba(249, 115, 22, 0.16)", label: "Pigmentacao" },
  pores: { color: "rgba(168, 85, 247, 0.28)", glow: "rgba(168, 85, 247, 0.14)", label: "Poros" },
  wrinkles: { color: "rgba(59, 130, 246, 0.3)", glow: "rgba(59, 130, 246, 0.14)", label: "Linhas" },
  redness: { color: "rgba(239, 68, 68, 0.38)", glow: "rgba(239, 68, 68, 0.16)", label: "Vermelhidao" }
};

const heatmapRegionLabels: Record<string, string> = {
  forehead: "Testa",
  left_cheek: "Bochecha esquerda",
  right_cheek: "Bochecha direita",
  chin: "Queixo",
  nose: "Nariz",
  jawline: "Mandibula",
  left_eye_area: "Olho esquerdo",
  right_eye_area: "Olho direito",
  under_eye: "Area dos olhos"
};

const skinTypeLabels: Record<string, string> = {
  normal: "Normal ou equilibrada",
  oily: "Oleosa",
  dry: "Seca",
  combination: "Mista",
  sensitive: "Sensivel",
  acne_prone: "Com tendencia a acne",
};

const skinToneLabels: Record<string, string> = {
  fair: "Pele clara",
  medium: "Tom medio",
  tan: "Pele morena",
  deep: "Pele negra",
  rich: "Pele retinta"
};

const concernLabels: Record<string, string> = {
  acne: "Acne e cravos",
  oiliness: "Oleosidade excessiva",
  visible_pores: "Poros aparentes",
  dark_spots: "Manchas e marcas",
  dehydration: "Desidratacao",
  barrier_damage: "Barreira sensibilizada",
  rosacea: "Vermelhidao e rosacea",
  aging: "Linhas finas e firmeza",
  uneven_texture: "Textura irregular",
  under_eye: "Olheiras e area dos olhos"
};

const routineTimelineCopy: Record<
  string,
  {
    title: string;
    body: string;
    moment: string;
    moments: Array<"morning" | "night">;
    icon: LucideIcon;
  }
> = {
  cleanser: {
    title: "Comece limpando a pele",
    body: "Remove excesso de oleosidade, suor e residuos para preparar a pele para os proximos passos.",
    moment: "Use de manha e a noite",
    moments: ["morning", "night"],
    icon: Droplets
  },
  toner: {
    title: "Reequilibre logo depois da limpeza",
    body: "Ajuda a deixar a pele mais confortavel e pronta para receber os ativos seguintes.",
    moment: "Use logo apos limpar",
    moments: ["morning", "night"],
    icon: Sparkles
  },
  essence: {
    title: "Entregue hidratacao leve",
    body: "Adiciona conforto e uma primeira camada de luminosidade antes do tratamento principal.",
    moment: "Use antes do serum",
    moments: ["morning", "night"],
    icon: Sparkles
  },
  serum: {
    title: "Trate o foco principal da pele",
    body: "Aqui entra o ativo mais direcionado para acne, manchas, textura, firmeza ou sensibilidade.",
    moment: "Use no meio da rotina",
    moments: ["morning", "night"],
    icon: FlaskConical
  },
  moisturizer: {
    title: "Sele o conforto da pele",
    body: "Ajuda a segurar a hidratacao e reforcar a barreira para evitar ressecamento e irritacao.",
    moment: "Use para finalizar a rotina da noite ou antes do protetor",
    moments: ["morning", "night"],
    icon: Shield
  },
  sunscreen: {
    title: "Proteja no ultimo passo da manha",
    body: "Reduz dano solar e ajuda a prevenir manchas, sensibilidade e piora de sinais visuais.",
    moment: "Use todos os dias pela manha",
    moments: ["morning"],
    icon: SunMedium
  }
};

const routineStepShortLabels: Record<string, string> = {
  cleanser: "Limpeza",
  toner: "Tonico",
  essence: "Essence",
  serum: "Serum",
  moisturizer: "Hidratacao",
  sunscreen: "Protetor"
};

const heatmapEvidenceReferences: Record<
  string,
  {
    title: string;
    lead: string;
    sources: Array<{ source: string; focus: string; strength: string }>;
  }
> = {
  acne: {
    title: "Base cientifica para acne e oleosidade",
    lead: "A interpretacao de acne, inflamacao e oleosidade visual prioriza revisoes sistematicas, diretrizes e literatura dermatologica forte.",
    sources: [
      { source: "Cochrane", focus: "terapias topicas para acne", strength: "revisao sistematica" },
      { source: "AAD / JAAD", focus: "guidelines clinicas de acne", strength: "diretriz" },
      { source: "JAMA Dermatology / PubMed", focus: "revisoes sobre acne e manejo clinico", strength: "alto nivel" }
    ]
  },
  hydration: {
    title: "Base cientifica para hidratacao e barreira",
    lead: "A leitura de ressecamento e barreira sensibilizada usa literatura sobre funcao de barreira, ceramidas e conforto cutaneo.",
    sources: [
      { source: "PubMed", focus: "ceramidas e funcao de barreira", strength: "revisao" },
      { source: "DermNet", focus: "barreira cutanea e pele seca", strength: "referencia clinica" },
      { source: "ABD / SciELO", focus: "cuidado de barreira e pele sensivel", strength: "contexto brasileiro" }
    ]
  },
  pigmentation: {
    title: "Base cientifica para manchas e pigmentacao",
    lead: "A leitura de pigmentacao prioriza evidencias sobre hiperpigmentacao, fotoprotecao e resposta inflamatoria residual.",
    sources: [
      { source: "PubMed", focus: "tratamento topico da hiperpigmentacao", strength: "revisao sistematica" },
      { source: "JAMA Dermatology / JAAD", focus: "pigmentacao e pele com manchas", strength: "alto nivel" },
      { source: "ABD / LILACS", focus: "abordagem clinica em contexto latino-americano", strength: "referencia regional" }
    ]
  },
  pores: {
    title: "Base cientifica para poros e textura",
    lead: "A leitura de poros aparentes e textura irregular combina literatura sobre oleosidade, retinoides e superficie cutanea.",
    sources: [
      { source: "JAAD", focus: "textura, acne e regulacao de oleosidade", strength: "alto nivel" },
      { source: "PubMed", focus: "retinoides e melhora de textura", strength: "revisao" },
      { source: "DermNet", focus: "poros aparentes e pele oleosa", strength: "referencia clinica" }
    ]
  },
  wrinkles: {
    title: "Base cientifica para linhas e fotoenvelhecimento",
    lead: "A leitura de linhas finas e rugas se apoia em literatura sobre fotoenvelhecimento, retinoides e fotoprotecao diaria.",
    sources: [
      { source: "JAMA Dermatology", focus: "fotoenvelhecimento e tratamento topico", strength: "alto nivel" },
      { source: "PubMed", focus: "tretinoina e melhora de linhas", strength: "revisao sistematica" },
      { source: "DermNet", focus: "photoaging e protetor solar", strength: "referencia clinica" }
    ]
  },
  redness: {
    title: "Base cientifica para vermelhidao e rosacea",
    lead: "A leitura de vermelhidao prioriza evidencias sobre rosacea, inflamacao cutanea e pele sensibilizada.",
    sources: [
      { source: "PubMed", focus: "rosacea treatment review and evidence update", strength: "revisao sistematica" },
      { source: "JAMA Dermatology", focus: "condutas para rosacea e vermelhidao", strength: "alto nivel" },
      { source: "DermNet", focus: "referencia clinica de rosacea", strength: "referencia clinica" }
    ]
  }
};

function normalizeVisualScore(value: number | null | undefined) {
  if (!Number.isFinite(Number(value))) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

function intensityLevel(value: number) {
  if (value >= 75) return "alta";
  if (value >= 50) return "moderada";
  if (value >= 30) return "leve";
  return "discreta";
}

function overallSeverityLabel(value: number) {
  if (value >= 75) return "Atencao alta";
  if (value >= 55) return "Monitoramento ativo";
  if (value >= 35) return "Leitura moderada";
  return "Estavel";
}

function scanStatusLabel(status: CustomerBelaCodeScanItem["scan_status"]) {
  if (status === "validated") return "Validado";
  if (status === "rejected") return "Rejeitado";
  return "Em analise";
}

function scanStatusClasses(status: CustomerBelaCodeScanItem["scan_status"]) {
  if (status === "validated") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "rejected") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-black/10 bg-bpOffWhite/70 text-bpGraphite/82";
}

function formatHeatmapRegionLabel(regionSlug: string) {
  return heatmapRegionLabels[regionSlug] ?? regionSlug.replaceAll("_", " ");
}

function formatSkinTypeLabel(value: string | null | undefined) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!normalized) return "Nao definido";

  return (
    skinTypeLabels[normalized] ??
    normalized
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatSkinToneLabel(value: string | null | undefined) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!normalized) return "Nao definido";

  return (
    skinToneLabels[normalized] ??
    normalized
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatConcernLabel(value: string | null | undefined) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replaceAll("-", "_");

  if (!normalized) return "Nao definido";

  return concernLabels[normalized] ?? normalized.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function toSolidTone(color: string) {
  return color.replace(/0\.\d+\)/g, "0.9)");
}

function getRoutineTimelineCopy(step: CustomerRoutineGroup) {
  const normalized = String(step.routine_step_slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return (
    routineTimelineCopy[normalized] ?? {
      title: `Siga a etapa ${step.step_order}`,
      body: "Esta etapa entra para sustentar a leitura da sua pele com mais consistencia ao longo da rotina.",
      moment: "Use na ordem mostrada",
      moments: ["morning", "night"],
      icon: MoonStar
    }
  );
}

function getRoutineStepSlug(step: CustomerRoutineGroup) {
  return String(step.routine_step_slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getRoutineStepPriority(step: CustomerRoutineGroup, moment: "morning" | "night") {
  const slug = getRoutineStepSlug(step);

  if (slug === "sunscreen") return moment === "morning" ? "essencial" : "complementar";
  if (slug === "cleanser") return "essencial";
  if (slug === "moisturizer") return "essencial";

  return "complementar";
}

function getRoutineStepShortLabel(step: CustomerRoutineGroup) {
  const slug = getRoutineStepSlug(step);
  return routineStepShortLabels[slug] ?? step.routine_step_name;
}

const scanFieldMap: Record<SkinMetricKey, ScanMetricFieldKey> = {
  hydration_level: "hydration_score",
  elasticity_level: "elasticity_score",
  pigmentation_level: "pigmentation_score",
  acne_level: "acne_score",
  redness_level: "redness_score",
  pore_visibility: "pore_visibility",
  wrinkle_depth: "wrinkle_depth"
};

function toFormState(profile: CustomerSkinProfile | null): ProfileFormState {
  if (!profile) return defaultFormState;
  return {
    skin_type_id: profile.skin_type_id,
    skin_tone_id: profile.skin_tone_id,
    main_concern_id: profile.main_concern_id,
    sensitivity_level: profile.sensitivity_level,
    price_affinity_cents: profile.price_affinity_cents
  };
}

function toScanFormState(metrics: CustomerSkinMetricSet | null): ScanFormState {
  if (!metrics) return defaultScanFormState;
  return {
    hydration_score: Math.round(metrics.hydration_level),
    elasticity_score: Math.round(metrics.elasticity_level),
    pigmentation_score: Math.round(metrics.pigmentation_level),
    acne_score: Math.round(metrics.acne_level),
    redness_score: Math.round(metrics.redness_level),
    pore_visibility: Math.round(metrics.pore_visibility),
    wrinkle_depth: Math.round(metrics.wrinkle_depth),
    image_url: "",
    brightness_score: defaultScanFormState.brightness_score,
    centered_face_score: defaultScanFormState.centered_face_score,
    minimal_makeup_score: defaultScanFormState.minimal_makeup_score,
    texture_score: defaultScanFormState.texture_score,
    depth_score: defaultScanFormState.depth_score,
    blink_detected: defaultScanFormState.blink_detected,
    head_movement: defaultScanFormState.head_movement,
    smile_detected: defaultScanFormState.smile_detected,
    frown_detected: defaultScanFormState.frown_detected
  };
}

export default function SkincareRoutineExperience() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingCart, setGeneratingCart] = useState(false);
  const [savingScan, setSavingScan] = useState(false);
  const [startingUsage, setStartingUsage] = useState(false);
  const [savingSimulationSnapshot, setSavingSimulationSnapshot] = useState(false);
  const [deletingScanId, setDeletingScanId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [askingAssistant, setAskingAssistant] = useState(false);

  const [skinTypes, setSkinTypes] = useState<CustomerSkinTypeOption[]>([]);
  const [skinTones, setSkinTones] = useState<CustomerSkinToneOption[]>([]);
  const [concerns, setConcerns] = useState<CustomerSkinConcernOption[]>([]);
  const [profile, setProfile] = useState<CustomerSkinProfile | null>(null);
  const [form, setForm] = useState<ProfileFormState>(defaultFormState);

  const [routineSteps, setRoutineSteps] = useState<CustomerRoutineGroup[]>([]);
  const [expandedRoutineMoment, setExpandedRoutineMoment] = useState<"morning" | "night" | null>("morning");
  const [routineViewMode, setRoutineViewMode] = useState<"compact" | "complete">("compact");
  const [routineProductsExpanded, setRoutineProductsExpanded] = useState(false);
  const [expandedRoutineStepId, setExpandedRoutineStepId] = useState<string | null>(null);
  const [routineSummary, setRoutineSummary] = useState({
    steps_count: 0,
    recommended_products_count: 0,
    total_price_cents: 0
  });
  const [routineCart, setRoutineCart] = useState<CustomerRoutineCart | null>(null);

  const [skinTwin, setSkinTwin] = useState<CustomerSkinTwin | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<CustomerSkinMetricSet | null>(null);
  const [baselineSource, setBaselineSource] = useState<"twin" | "scan" | "profile" | "default">("default");
  const [recentScans, setRecentScans] = useState<CustomerSkinScan[]>([]);
  const [latestOutcome, setLatestOutcome] = useState<CustomerTreatmentOutcomeSummary | null>(null);
  const [activeUsage, setActiveUsage] = useState<{
    started_at: string;
    total_products: number;
    routine_cart_id: string | null;
  } | null>(null);
  const [similarProfiles, setSimilarProfiles] = useState<CustomerSimilarSkinProfile[]>([]);
  const [scanForm, setScanForm] = useState<ScanFormState>(defaultScanFormState);
  const [simulations, setSimulations] = useState<CustomerSkincareSimulationResponse["scenarios"]>([]);
  const [simulationTopProducts, setSimulationTopProducts] = useState<CustomerSkincareSimulationResponse["top_products"]>([]);
  const [savedSimulations, setSavedSimulations] = useState<CustomerSkinTwinResponse["recent_simulations"]>([]);
  const [faceScans, setFaceScans] = useState<CustomerBelaCodeScanItem[]>([]);
  const [recentImages, setRecentImages] = useState<CustomerSkinImage[]>([]);
  const [selectedFaceScanId, setSelectedFaceScanId] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [heatmapSurfaceTab, setHeatmapSurfaceTab] = useState<"map" | "image" | "evidence">("map");
  const [distributionExpanded, setDistributionExpanded] = useState(false);
  const [priorityRegionsExpanded, setPriorityRegionsExpanded] = useState(false);
  const [pinnedPriorityRegionId, setPinnedPriorityRegionId] = useState<string | null>(null);
  const [hoveredPriorityRegionId, setHoveredPriorityRegionId] = useState<string | null>(null);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState<CustomerSkinGptResponse | null>(null);

  const loadExperience = useCallback(async () => {
    const profileResponse = await getCustomerSkinProfile();
    setSkinTypes(profileResponse.options.skin_types);
    setSkinTones(profileResponse.options.skin_tones);
    setConcerns(profileResponse.options.skin_concerns);
    setProfile(profileResponse.profile);
    setForm(toFormState(profileResponse.profile));

    const [routineResult, twinResult, simulationsResult, faceScansResult] = await Promise.allSettled([
      getCustomerSkincareRoutine(1),
      getCustomerSkinTwin(),
      getCustomerSkincareSimulations([30, 60, 90]),
      getCustomerBelaCodeScans()
    ]);

    if (routineResult.status === "fulfilled") {
      setRoutineSteps(routineResult.value.steps);
      setRoutineSummary(routineResult.value.summary);
    }

    if (twinResult.status === "fulfilled") {
      setSkinTwin(twinResult.value.twin);
      setCurrentMetrics(twinResult.value.current_metrics);
      setBaselineSource(twinResult.value.baseline_source);
      setRecentScans(twinResult.value.recent_scans);
      setRecentImages(twinResult.value.recent_images);
      setLatestOutcome(twinResult.value.latest_outcome);
      setActiveUsage(twinResult.value.active_usage);
      setSimilarProfiles(twinResult.value.similar_profiles);
      setSavedSimulations(twinResult.value.recent_simulations);
      setScanForm(toScanFormState(twinResult.value.current_metrics));
    }

    if (simulationsResult.status === "fulfilled") {
      setSimulations(simulationsResult.value.scenarios);
      setSimulationTopProducts(simulationsResult.value.top_products);
    }

    if (faceScansResult.status === "fulfilled") {
      setFaceScans(faceScansResult.value.items);
      setSelectedFaceScanId((current) => {
        if (current && faceScansResult.value.items.some((item) => item.id === current)) return current;
        return faceScansResult.value.items[0]?.id ?? null;
      });
    }

    const partialErrors = [routineResult, twinResult, simulationsResult, faceScansResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => (result.reason instanceof Error ? result.reason.message : "Falha parcial ao carregar skincare."));

    if (partialErrors.length > 0) {
      setMessage(partialErrors[0]);
    }

  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setMessage(null);

      try {
        await loadExperience();
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar sua experiencia de skincare.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [loadExperience]);

  const hasProfile = useMemo(() => Boolean(profile), [profile]);
  const selectedSkinType = useMemo(
    () => skinTypes.find((item) => item.id === form.skin_type_id) ?? null,
    [form.skin_type_id, skinTypes]
  );
  const selectedSkinTone = useMemo(
    () => skinTones.find((item) => item.id === form.skin_tone_id) ?? null,
    [form.skin_tone_id, skinTones]
  );
  const selectedConcern = useMemo(
    () => concerns.find((item) => item.id === form.main_concern_id) ?? null,
    [form.main_concern_id, concerns]
  );
  const latestScan = recentScans[0] ?? null;
  const selectedFaceScan = useMemo(
    () => faceScans.find((item) => item.id === selectedFaceScanId) ?? faceScans[0] ?? null,
    [faceScans, selectedFaceScanId]
  );
  const fallbackHeatmapImage = useMemo(() => {
    const forSelectedScan = selectedFaceScan?.id
      ? recentImages.find(
          (item) =>
            item.face_scan_id === selectedFaceScan.id &&
            (item.image_kind === "heatmap" || Boolean(item.heatmap_url))
        ) ?? null
      : null;

    if (forSelectedScan) return forSelectedScan;

    return (
      recentImages.find((item) => item.image_kind === "heatmap" || Boolean(item.heatmap_url)) ?? null
    );
  }, [recentImages, selectedFaceScan]);
  const displayHeatmapUrl =
    selectedFaceScan?.heatmap_url ??
    fallbackHeatmapImage?.heatmap_url ??
    (fallbackHeatmapImage?.image_kind === "heatmap" ? fallbackHeatmapImage.image_url : null) ??
    null;
  const fallbackScanImage = useMemo(() => {
    const forSelectedScan = selectedFaceScan?.id
      ? recentImages.find(
          (item) =>
            item.face_scan_id === selectedFaceScan.id &&
            (item.image_kind === "neutral" || item.image_kind === "scan")
        ) ??
        recentImages.find(
          (item) => item.face_scan_id === selectedFaceScan.id && item.image_kind !== "heatmap"
        ) ??
        null
      : null;

    if (forSelectedScan) return forSelectedScan;

    return recentImages.find((item) => item.image_kind === "neutral" || item.image_kind === "scan") ?? null;
  }, [recentImages, selectedFaceScan]);
  const displayScanPreviewUrl = selectedFaceScan?.image_url ?? fallbackScanImage?.image_url ?? null;
  const evaluatedRegionLabels = useMemo(() => {
    if (!selectedFaceScan?.heatmap_regions.length) return [];

    const seen = new Set<string>();
    return [...selectedFaceScan.heatmap_regions]
      .sort((left, right) => right.intensity - left.intensity)
      .map((region) => formatHeatmapRegionLabel(region.region_slug))
      .filter((label) => {
        if (seen.has(label)) return false;
        seen.add(label);
        return true;
      })
      .slice(0, 6);
  }, [selectedFaceScan]);
  const selectedFaceScanSummary = useMemo(() => {
    if (!selectedFaceScan) return null;

    const grouped = new Map<
      string,
      { condition: string; label: string; average: number; peak: number; count: number }
    >();

    for (const region of selectedFaceScan.heatmap_regions) {
      const current = grouped.get(region.condition_type) ?? {
        condition: region.condition_type,
        label: heatmapStyles[region.condition_type]?.label ?? region.condition_type,
        average: 0,
        peak: 0,
        count: 0
      };
      current.average += region.intensity;
      current.peak = Math.max(current.peak, region.intensity);
      current.count += 1;
      grouped.set(region.condition_type, current);
    }

    const conditionSummaries = Array.from(grouped.values())
      .map((item) => ({
        ...item,
        average: item.count > 0 ? item.average / item.count : 0
      }))
      .sort((left, right) => right.peak - left.peak);

    const priorityRegions = [...selectedFaceScan.heatmap_regions]
      .sort((left, right) => right.intensity - left.intensity)
      .slice(0, 4);

    const topRegion = priorityRegions[0] ?? null;
    const dominantCondition = conditionSummaries[0] ?? null;
    const overallScore = normalizeVisualScore(selectedFaceScan.score?.overall_score ?? dominantCondition?.peak ?? 0);
    const livenessScore = normalizeVisualScore(
      (selectedFaceScan.liveness?.confidence ?? selectedFaceScan.liveness_score ?? 0) * 100
    );

    return {
      overallScore,
      livenessScore,
      severityLabel: overallSeverityLabel(overallScore),
      dominantCondition,
      topRegion,
      priorityRegions,
      conditionSummaries,
      regionCount: selectedFaceScan.heatmap_regions.length
    };
  }, [selectedFaceScan]);
  const heatmapEvidence = useMemo(() => {
    const dominantConditionKey = selectedFaceScanSummary?.dominantCondition?.condition ?? null;
    if (dominantConditionKey && heatmapEvidenceReferences[dominantConditionKey]) {
      return heatmapEvidenceReferences[dominantConditionKey];
    }

    const concernKey = String(selectedFaceScan?.score?.main_concern ?? "")
      .trim()
      .toLowerCase()
      .replaceAll("-", "_");

    if (concernKey === "acne" || concernKey === "oiliness") return heatmapEvidenceReferences.acne;
    if (concernKey === "dark_spots") return heatmapEvidenceReferences.pigmentation;
    if (concernKey === "rosacea" || concernKey === "redness") return heatmapEvidenceReferences.redness;
    if (concernKey === "dehydration" || concernKey === "barrier_damage") return heatmapEvidenceReferences.hydration;
    if (concernKey === "visible_pores" || concernKey === "uneven_texture") return heatmapEvidenceReferences.pores;
    if (concernKey === "aging") return heatmapEvidenceReferences.wrinkles;

    return null;
  }, [selectedFaceScan, selectedFaceScanSummary]);
  const numberedPriorityRegions = useMemo(
    () =>
      (selectedFaceScanSummary?.priorityRegions ?? []).map((region, index) => ({
        ...region,
        mapIndex: index + 1
      })),
    [selectedFaceScanSummary]
  );
  const priorityRegionByCondition = useMemo(
    () =>
      numberedPriorityRegions.reduce<Record<string, (typeof numberedPriorityRegions)[number]>>((acc, region) => {
        if (!acc[region.condition_type]) {
          acc[region.condition_type] = region;
        }
        return acc;
      }, {}),
    [numberedPriorityRegions]
  );
  const activePriorityRegionId = hoveredPriorityRegionId ?? pinnedPriorityRegionId;
  const activePriorityRegion = useMemo(
    () => numberedPriorityRegions.find((region) => region.id === activePriorityRegionId) ?? null,
    [activePriorityRegionId, numberedPriorityRegions]
  );
  const activePriorityCondition = activePriorityRegion?.condition_type ?? null;
  const flaggedFindings = useMemo(
    () =>
      (selectedFaceScan?.findings ?? []).filter(
        (item) => item.requires_clinical_review || item.appearance_status !== "stable"
      ),
    [selectedFaceScan]
  );
  const morningRoutineSteps = useMemo(
    () => routineSteps.filter((step) => getRoutineTimelineCopy(step).moments.includes("morning")),
    [routineSteps]
  );
  const nightRoutineSteps = useMemo(
    () => routineSteps.filter((step) => getRoutineTimelineCopy(step).moments.includes("night")),
    [routineSteps]
  );

  useEffect(() => {
    if (pinnedPriorityRegionId && !numberedPriorityRegions.some((region) => region.id === pinnedPriorityRegionId)) {
      setPinnedPriorityRegionId(null);
    }
  }, [numberedPriorityRegions, pinnedPriorityRegionId]);

  useEffect(() => {
    if (hoveredPriorityRegionId && !numberedPriorityRegions.some((region) => region.id === hoveredPriorityRegionId)) {
      setHoveredPriorityRegionId(null);
    }
  }, [hoveredPriorityRegionId, numberedPriorityRegions]);

  useEffect(() => {
    if (heatmapSurfaceTab === "evidence" && !heatmapEvidence) {
      setHeatmapSurfaceTab("map");
    }
  }, [heatmapEvidence, heatmapSurfaceTab]);

  const clearPriorityRegionHighlight = useCallback(() => {
    setPinnedPriorityRegionId(null);
    setHoveredPriorityRegionId(null);
  }, []);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.skin_type_id || !form.main_concern_id) {
      setMessage("Selecione tipo de pele e principal preocupacao.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await patchCustomerSkinProfile({
        skin_type_id: form.skin_type_id,
        skin_tone_id: form.skin_tone_id,
        main_concern_id: form.main_concern_id,
        sensitivity_level: form.sensitivity_level,
        price_affinity_cents: form.price_affinity_cents
      });

      await loadExperience();
      setMessage("Perfil de pele atualizado. Rotina e simulacoes recalculadas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar perfil de pele.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCart = async () => {
    setGeneratingCart(true);
    setMessage(null);

    try {
      const response = await postCustomerSkincareRoutineCart();
      setRoutineCart(response.cart);
      await loadExperience();
      setMessage("Carrinho da rotina gerado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao gerar carrinho da rotina.");
    } finally {
      setGeneratingCart(false);
    }
  };

  const handleSaveScan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingScan(true);
    setMessage(null);

    try {
      const response = await postCustomerBelaCodeScan({
        hydration_score: scanForm.hydration_score,
        elasticity_score: scanForm.elasticity_score,
        pigmentation_score: scanForm.pigmentation_score,
        acne_score: scanForm.acne_score,
        redness_score: scanForm.redness_score,
        pore_visibility: scanForm.pore_visibility,
        wrinkle_depth: scanForm.wrinkle_depth,
        scan_source: "ai_scan",
        image_url: scanForm.image_url || null,
        capture_metadata: {
          brightness_score: Number((scanForm.brightness_score / 100).toFixed(4)),
          centered_face_score: Number((scanForm.centered_face_score / 100).toFixed(4)),
          minimal_makeup_score: Number((scanForm.minimal_makeup_score / 100).toFixed(4)),
          capture_mode: "guided_manual"
        },
        liveness: {
          texture_score: Number((scanForm.texture_score / 100).toFixed(4)),
          depth_score: Number((scanForm.depth_score / 100).toFixed(4)),
          blink_detected: scanForm.blink_detected,
          head_movement: scanForm.head_movement,
          smile_detected: scanForm.smile_detected,
          frown_detected: scanForm.frown_detected
        }
      });
      await loadExperience();
      setSelectedFaceScanId(response.face_scan.id);
      setMessage(
        response.ok
          ? "Novo scan BelaCode registrado. Seu Skin Twin foi atualizado."
          : response.message ?? "O scan foi rejeitado pelo quality gate do BelaCode."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar scan.");
    } finally {
      setSavingScan(false);
    }
  };

  const handleGuidedBelaCodeComplete = useCallback(
    async (response: Awaited<ReturnType<typeof postCustomerBelaCodeAnalyze>>) => {
      await loadExperience();
      setSelectedFaceScanId(response.face_scan.id);
    },
    [loadExperience]
  );

  const handleDeleteFaceScan = useCallback(
    async (scanId: string) => {
      if (deletingScanId === scanId) return;

      const confirmed = window.confirm("Remover este scan do seu historico? Essa acao nao pode ser desfeita.");
      if (!confirmed) return;

      setDeletingScanId(scanId);
      setMessage(null);

      try {
        const response = await deleteCustomerBelaCodeScan(scanId);
        setFaceScans(response.items);
        setSelectedFaceScanId((current) => {
          if (current && current !== scanId && response.items.some((item) => item.id === current)) {
            return current;
          }
          return response.items[0]?.id ?? null;
        });
        await loadExperience();
        setMessage("Scan removido do seu historico.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao remover scan.");
      } finally {
        setDeletingScanId(null);
      }
    },
    [deletingScanId, loadExperience]
  );

  const handleStartUsage = async () => {
    setStartingUsage(true);
    setMessage(null);

    try {
      await postCustomerSkincareUsage(routineCart ? { cart_id: routineCart.id } : undefined);
      await loadExperience();
      setMessage("Acompanhamento iniciado. Agora a BelaPop consegue medir sua evolucao.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao iniciar acompanhamento.");
    } finally {
      setStartingUsage(false);
    }
  };

  const handleSaveSimulationSnapshot = async () => {
    setSavingSimulationSnapshot(true);
    setMessage(null);

    try {
      const response = await postCustomerSkincareSimulations({
        days: simulations.map((scenario) => scenario.days),
        routine_cart_id: routineCart?.id ?? activeUsage?.routine_cart_id ?? null
      });

      setSavedSimulations(response.saved_simulations);
      setMessage("Simulacao salva no historico do seu twin.");
      await loadExperience();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar a simulacao.");
    } finally {
      setSavingSimulationSnapshot(false);
    }
  };

  const handleAskAssistant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (assistantQuestion.trim().length < 8) {
      setMessage("Escreva uma pergunta mais objetiva para o SkinBela.");
      return;
    }

    setAskingAssistant(true);
    setMessage(null);

    try {
      const response = await postCustomerSkinGptQuestion({ question: assistantQuestion.trim() });
      setAssistantAnswer(response);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao consultar o SkinBela.");
    } finally {
      setAskingAssistant(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <section id="belacode-scan" className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/84">Skincare routine builder</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Rotina personalizada e Skin Twin</h1>
        <p className="mt-3 max-w-3xl text-sm text-bpGraphite/84">
          A BelaPop combina quiz de pele, historico de scans e simulacoes de rotina para montar um plano
          progressivo de skincare, com leitura de evolucao em 30, 60 e 90 dias.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]">
        <article className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">Quiz de pele</p>
              <p className="mt-2 text-xl font-semibold text-bpBlack">Perfil base da sua rotina</p>
            </div>
            {hasProfile ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                perfil ativo
              </span>
            ) : (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-800">
                perfil pendente
              </span>
            )}
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-bpGraphite/82">Carregando configuracao de pele...</p>
          ) : (
            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block space-y-2 text-sm text-bpGraphite/84">
                  <span>Tipo de pele</span>
                  <select
                    value={form.skin_type_id ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        skin_type_id: event.target.value || null
                      }))
                    }
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 pr-10 text-sm text-bpBlack outline-none transition focus:border-bpPinkCta/40"
                  >
                    <option value="">Selecione</option>
                    {skinTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-bpGraphite/84">
                    {selectedSkinType?.description ?? "Escolha como sua pele costuma se comportar no dia a dia."}
                  </p>
                </label>

                <label className="block space-y-2 text-sm text-bpGraphite/84">
                  <span>Tom de pele</span>
                  <select
                    value={form.skin_tone_id ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        skin_tone_id: event.target.value || null
                      }))
                    }
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 pr-10 text-sm text-bpBlack outline-none transition focus:border-bpPinkCta/40"
                  >
                    <option value="">Selecione</option>
                    {skinTones.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-bpGraphite/84">
                    {selectedSkinTone?.description ?? "Isso ajuda a priorizar leitura de manchas, marcas e fotoprotecao."}
                  </p>
                </label>

                <label className="block space-y-2 text-sm text-bpGraphite/84 lg:col-span-2">
                  <span>Principal preocupacao</span>
                  <select
                    value={form.main_concern_id ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        main_concern_id: event.target.value || null
                      }))
                    }
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 pr-10 text-sm text-bpBlack outline-none transition focus:border-bpPinkCta/40"
                  >
                    <option value="">Selecione</option>
                    {concerns.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-bpGraphite/84">
                    {selectedConcern?.description ?? "Selecione o ponto que mais incomoda hoje para personalizar a rotina."}
                  </p>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-black/10 bg-bpOffWhite/55 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Leitura da pele</p>
                  <p className="mt-2 text-sm font-semibold text-bpBlack">
                    {selectedSkinType ? selectedSkinType.name : "Selecione seu tipo de pele"}
                  </p>
                  <p className="mt-1 text-xs text-bpGraphite/78">
                    {selectedSkinType?.description ?? "Isso guia textura, intensidade e ritmo da rotina."}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-bpOffWhite/55 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Tom de pele</p>
                  <p className="mt-2 text-sm font-semibold text-bpBlack">
                    {selectedSkinTone ? selectedSkinTone.name : "Selecione seu tom de pele"}
                  </p>
                  <p className="mt-1 text-xs text-bpGraphite/78">
                    {selectedSkinTone?.description ?? "Ajuda a priorizar manchas, marcas e fotoprotecao."}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-bpOffWhite/55 px-4 py-4 sm:col-span-2 xl:col-span-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Foco principal</p>
                  <p className="mt-2 text-sm font-semibold text-bpBlack">
                    {selectedConcern ? selectedConcern.name : "Selecione a principal preocupacao"}
                  </p>
                  <p className="mt-1 text-xs text-bpGraphite/78">
                    {selectedConcern?.description ?? "A rotina vai priorizar esse objetivo primeiro."}
                  </p>
                </div>
              </div>

              <label className="block space-y-2 text-sm text-bpGraphite/84">
                <span>Sensibilidade</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.sensitivity_level}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sensitivity_level: Number(event.target.value)
                    }))
                  }
                  className="w-full accent-[#C2185B]"
                />
                <div className="flex justify-between text-xs text-bpGraphite/72">
                  <span>Baixa</span>
                  <span className="font-medium text-bpBlack">{form.sensitivity_level}/5</span>
                  <span>Alta</span>
                </div>
              </label>

              <label className="block space-y-2 text-sm text-bpGraphite/84">
                <span>Faixa de investimento ideal</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.price_affinity_cents ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price_affinity_cents: event.target.value ? Number(event.target.value) : null
                    }))
                  }
                  placeholder="Ex.: 22000"
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                />
                <p className="text-xs text-bpGraphite/84">Informe em centavos para o algoritmo priorizar a faixa certa.</p>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full border border-bpPinkCta/35 bg-bpPinkCta px-6 py-3 text-xs uppercase tracking-[0.2em] text-white shadow-[0_18px_38px_rgba(213,30,113,0.22)] disabled:opacity-60"
              >
                {saving ? "Salvando..." : hasProfile ? "Atualizar rotina" : "Criar perfil e rotina"}
              </button>
            </form>
          )}
        </article>

        <article className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">Rotina recomendada</p>
              <p className="mt-2 text-xl font-semibold text-bpBlack">Selecao por etapa</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-bpOffWhite/70 px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/84">Total sugerido</p>
              <p className="mt-1 text-lg font-semibold text-bpBlack">
                {formatMoneyFromCents(routineSummary.total_price_cents)}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-bpGraphite/82">Carregando rotina...</p>
          ) : routineSteps.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-black/10 bg-bpOffWhite/60 p-5 text-sm text-bpGraphite/84">
              Defina seu perfil de pele para liberar a rotina personalizada por etapa.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] border border-[rgba(216,160,172,0.22)] bg-white/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">
                      Como fazer sua rotina
                    </p>
                    <p className="mt-1 text-sm leading-6 text-bpGraphite/82">
                      Veja primeiro a versao enxuta. Se quiser, abra os detalhes de manha e de noite.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-bpPink/25 bg-bpPinkLux px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpBlackSoft">
                      {routineSteps.length} etapas
                    </span>
                    <div className="inline-flex rounded-full border border-black/10 bg-bpOffWhite/50 p-1">
                      <button
                        type="button"
                        onClick={() => setRoutineViewMode("compact")}
                        className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition ${
                          routineViewMode === "compact"
                            ? "bg-bpPinkCta text-white shadow-[0_10px_24px_rgba(213,30,113,0.18)]"
                            : "text-bpGraphite/76"
                        }`}
                      >
                        Rotina enxuta
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoutineViewMode("complete")}
                        className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition ${
                          routineViewMode === "complete"
                            ? "bg-bpPinkCta text-white shadow-[0_10px_24px_rgba(213,30,113,0.18)]"
                            : "text-bpGraphite/76"
                        }`}
                      >
                        Rotina completa
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-700">
                    Essencial = base da rotina
                  </span>
                  <span className="rounded-full border border-black/10 bg-bpOffWhite/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/76">
                    Complementar = reforco ou tratamento
                  </span>
                  <span className="rounded-full border border-black/10 bg-bpOffWhite/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/76">
                    Protetor sempre por ultimo na manha
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    {
                      key: "morning" as const,
                      title: "Rotina da manha",
                      description: "Leitura rapida para antes de sair ou comecar o dia.",
                      icon: SunMedium,
                      steps: morningRoutineSteps
                    },
                    {
                      key: "night" as const,
                      title: "Rotina da noite",
                      description: "Sequencia para limpar, tratar e recuperar a pele com calma.",
                      icon: MoonStar,
                      steps: nightRoutineSteps
                    }
                  ]
                    .filter((section) => section.steps.length > 0)
                    .map((section) => {
                      const isOpen = expandedRoutineMoment === section.key;
                      const SectionIcon = section.icon;

                      return (
                        <div
                          key={section.key}
                          className="overflow-hidden rounded-[22px] border border-black/10 bg-bpOffWhite/34"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRoutineMoment((current) => (current === section.key ? null : section.key))
                            }
                            className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
                            aria-expanded={isOpen}
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-bpPink/25 bg-white text-bpPinkCta">
                                <SectionIcon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-bpBlack">{section.title}</p>
                                {routineViewMode === "complete" ? (
                                  <>
                                    <p className="mt-1 text-xs leading-5 text-bpGraphite/78">{section.description}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {section.steps.map((step, index) => {
                                        const priority = getRoutineStepPriority(step, section.key);
                                        return (
                                          <span
                                            key={`${section.key}-${step.routine_step_id}-rail`}
                                            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${
                                              priority === "essencial"
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : "border-black/10 bg-white text-bpGraphite/74"
                                            }`}
                                          >
                                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current/20 text-[9px]">
                                              {index + 1}
                                            </span>
                                            {getRoutineStepShortLabel(step)}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/72">
                                {section.steps.length} passos
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 text-bpGraphite/76 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                aria-hidden="true"
                              />
                            </div>
                          </button>

                          {isOpen ? (
                            <div className="border-t border-black/8 bg-white/70 px-4 pb-4 pt-3">
                              <ol className="space-y-3">
                                {section.steps.map((step, index) => {
                                  const timelineCopy = getRoutineTimelineCopy(step);
                                  const StepIcon = timelineCopy.icon;
                                  const topRecommendation = step.recommendations[0] ?? null;
                                  const priority = getRoutineStepPriority(step, section.key);

                                  return (
                                    <li
                                      key={`${section.key}-${step.routine_step_id}`}
                                      className="rounded-2xl border border-black/10 bg-bpOffWhite/28 p-3"
                                    >
                                      {routineViewMode === "compact" ? (
                                        <div className="flex flex-wrap items-center gap-3">
                                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bpPink/25 bg-bpPinkLux text-xs font-semibold text-bpBlack">
                                            {index + 1}
                                          </span>
                                          <span
                                            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${
                                              priority === "essencial"
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : "border-black/10 bg-white text-bpGraphite/72"
                                            }`}
                                          >
                                            {priority === "essencial" ? "Essencial" : "Complementar"}
                                          </span>
                                          {topRecommendation ? (
                                            <p className="min-w-0 flex-1 text-sm font-medium text-bpBlack">
                                              {topRecommendation.product_name}
                                            </p>
                                          ) : (
                                            <p className="min-w-0 flex-1 text-sm font-medium text-bpBlack">
                                              {step.routine_step_name}
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-start gap-3">
                                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bpPink/25 bg-bpPinkLux text-xs font-semibold text-bpBlack">
                                            {index + 1}
                                          </span>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <StepIcon className="h-3.5 w-3.5 text-bpPinkCta" aria-hidden="true" />
                                              <p className="text-sm font-semibold text-bpBlack">{step.routine_step_name}</p>
                                              <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-bpGraphite/72">
                                                Etapa {step.step_order}
                                              </span>
                                              <span
                                                className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${
                                                  priority === "essencial"
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : "border-black/10 bg-white text-bpGraphite/72"
                                                }`}
                                              >
                                                {priority === "essencial" ? "Essencial" : "Complementar"}
                                              </span>
                                            </div>
                                            <p className="mt-1 text-xs font-medium text-bpBlackSoft">
                                              {timelineCopy.title}
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-bpGraphite/78">
                                              {timelineCopy.body}
                                            </p>
                                            {topRecommendation ? (
                                              <p className="mt-2 text-xs leading-5 text-bpGraphite/76">
                                                <span className="font-medium text-bpBlack">Produto indicado:</span>{" "}
                                                {topRecommendation.product_name}
                                              </p>
                                            ) : null}
                                          </div>
                                        </div>
                                      )}
                                    </li>
                                  );
                                })}
                              </ol>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white/82">
                <button
                  type="button"
                  onClick={() => setRoutineProductsExpanded((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                  aria-expanded={routineProductsExpanded}
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Produtos por etapa</p>
                    <p className="mt-1 text-sm text-bpGraphite/82">
                      Abra para ver qual produto lidera cada etapa da rotina.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-black/10 bg-bpOffWhite/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/82">
                      {routineSteps.length} cards
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-bpGraphite/76 transition-transform ${routineProductsExpanded ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </div>
                </button>

                {routineProductsExpanded ? (
                  <div className="border-t border-black/8 px-4 pb-4 pt-4">
                    <div className="space-y-3">
                      {routineSteps.map((step) => {
                        const top = step.recommendations[0] ?? null;
                        const isOpen = expandedRoutineStepId === step.routine_step_id;
                        return (
                          <div key={step.routine_step_id} className="overflow-hidden rounded-2xl border border-black/10 bg-white/78">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRoutineStepId((current) =>
                                  current === step.routine_step_id ? null : step.routine_step_id
                                )
                              }
                              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                              aria-expanded={isOpen}
                            >
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.22em] text-bpGraphite/72">
                                  Etapa {step.step_order}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-bpBlack">{step.routine_step_name}</p>
                                <p className="mt-1 text-sm text-bpGraphite/82">
                                  {top ? top.product_name : "Nenhum produto elegivel para esta etapa."}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {top ? (
                                  <span className="rounded-full border border-bpPink/25 bg-bpPinkLux px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpBlackSoft">
                                    score {Math.round(top.score)}
                                  </span>
                                ) : null}
                                <ChevronDown
                                  className={`h-4 w-4 text-bpGraphite/76 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                  aria-hidden="true"
                                />
                              </div>
                            </button>

                            {isOpen ? (
                              top ? (
                                <div className="border-t border-black/8 px-4 pb-4 pt-4">
                                  <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
                                    <div className="relative h-24 overflow-hidden rounded-2xl border border-black/10 bg-bpOffWhite">
                                      {top.hero_image_url ? (
                                        <Image
                                          src={top.hero_image_url}
                                          alt={top.product_name}
                                          fill
                                          sizes="96px"
                                          className="object-cover"
                                          unoptimized={top.hero_image_url.endsWith(".svg")}
                                        />
                                      ) : null}
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                          <p className="text-base font-semibold text-bpBlack">{top.product_name}</p>
                                          <p className="text-sm text-bpGraphite/82">{formatMoneyFromCents(top.price_cents)}</p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.15em]">
                                        <span className="rounded-full border border-black/10 px-2.5 py-1 text-bpGraphite/84">
                                          ingrediente {Math.round(top.ingredient_match_score)}
                                        </span>
                                        <span className="rounded-full border border-black/10 px-2.5 py-1 text-bpGraphite/84">
                                          rating {Math.round(top.rating_score)}
                                        </span>
                                        <span className="rounded-full border border-black/10 px-2.5 py-1 text-bpGraphite/84">
                                          pele {Math.round(top.skin_type_match_score)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="border-t border-black/8 px-4 pb-4 pt-4 text-sm text-bpGraphite/82">
                                  Nenhum produto elegivel para esta etapa.
                                </p>
                              )
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerateCart}
                  disabled={generatingCart || routineSteps.length === 0}
                  className="rounded-full border border-bpPinkCta/35 bg-bpPinkCta px-6 py-3 text-xs uppercase tracking-[0.2em] text-white shadow-[0_18px_38px_rgba(213,30,113,0.22)] disabled:opacity-60"
                >
                  {generatingCart ? "Gerando..." : "Gerar carrinho da rotina"}
                </button>
                <button
                  type="button"
                  onClick={handleStartUsage}
                  disabled={startingUsage || (!routineCart && !routineSteps.length)}
                  className="rounded-full border border-black/15 bg-white px-6 py-3 text-xs uppercase tracking-[0.2em] text-bpBlack disabled:opacity-60"
                >
                  {startingUsage ? "Iniciando..." : activeUsage ? "Acompanhamento ativo" : "Comecar acompanhamento"}
                </button>
              </div>
            </div>
          )}
        </article>
      </section>

      <section id="belacode-scan" className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">Skin twin atual</p>
            <p className="mt-2 text-xl font-semibold text-bpBlack">Estado computacional da sua pele</p>
            <p className="mt-2 text-sm text-bpGraphite/82">{baselineSourceLabels[baselineSource]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeUsage ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                tracking desde {activeUsage.started_at}
              </span>
            ) : null}
            {latestOutcome ? (
              <span className="rounded-full border border-bpPink/25 bg-bpPinkLux px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpBlackSoft">
                melhora media {latestOutcome.improvement_score.toFixed(1)}
              </span>
            ) : null}
            {skinTwin ? (
              <span className="rounded-full border border-black/10 bg-bpOffWhite/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/82">
                confianca {Math.round(skinTwin.confidence_score * 100)}%
              </span>
            ) : null}
          </div>
        </div>

        {currentMetrics ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {skinMetricKeys.map((key) => (
              <div key={key} className="rounded-2xl border border-black/10 bg-bpOffWhite/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">{skinMetricLabels[key]}</p>
                <p className="mt-2 text-2xl font-semibold text-bpBlack">{Math.round(currentMetrics[key])}</p>
                <p className="mt-1 text-xs text-bpGraphite/84">escala de 0 a 100</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-black/10 bg-bpOffWhite/60 p-5 text-sm text-bpGraphite/84">
            Registre seu primeiro scan para liberar a camada de evolucao e simulacao.
          </div>
        )}

        {recentScans.length ? (
          <div className="mt-5 rounded-2xl border border-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/84">Ultimos scans</p>
            <div className="mt-3 grid gap-2">
              {recentScans.slice(0, 3).map((scan) => (
                <div key={scan.id} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="text-bpBlack">
                    {new Date(scan.created_at).toLocaleDateString("pt-BR")} - {scan.scan_source}
                  </span>
                  <span className="text-bpGraphite/82">
                    hidratacao {Math.round(scan.hydration_score)} / acne {Math.round(scan.acne_score)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section id="belacode-scan" className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">BelaCode scan</p>
              <p className="mt-2 text-xl font-semibold text-bpBlack">Captura guiada com quality gate</p>
              <p className="mt-2 text-sm text-bpGraphite/82">
                Simule a captura facial com sinais de iluminacao, textura e profundidade antes de atualizar o twin.
              </p>
            </div>
            {selectedFaceScan?.liveness ? (
              <div className="rounded-2xl border border-black/10 bg-bpOffWhite/60 px-4 py-3 text-right">
                <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Liveness</p>
                <p className="mt-1 text-lg font-semibold text-bpBlack">
                  {Math.round(selectedFaceScan.liveness.confidence * 100)}%
                </p>
                <p className="mt-1 text-xs text-bpGraphite/78">{selectedFaceScan.scan_status}</p>
              </div>
            ) : null}
          </div>
          <div className="mt-5">
            <BelaCodeCameraCapture
              disabled={savingScan}
              onComplete={handleGuidedBelaCodeComplete}
              onMessage={setMessage}
            />
          </div>

          <form onSubmit={handleSaveScan} className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-bpGraphite/72">
                Modo avancado: ajuste manual das metricas ou use uma URL externa para testes controlados.
              </div>
              <label className="block space-y-2 text-sm text-bpGraphite/84">
                <span>Imagem do scan (opcional)</span>
                <input
                  type="url"
                  value={scanForm.image_url}
                  onChange={(event) =>
                    setScanForm((current) => ({
                      ...current,
                      image_url: event.target.value
                    }))
                  }
                  placeholder="https://..."
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                />
              </label>

              <div className="grid gap-4 rounded-2xl border border-black/10 bg-bpOffWhite/45 p-4">
                <div>
                  <p className="text-sm font-medium text-bpBlack">Sinais de captura</p>
                  <p className="mt-1 text-xs text-bpGraphite/78">
                    Quanto melhor esses sinais, maior a chance do scan ser validado.
                  </p>
                </div>

                {(
                  [
                    ["brightness_score", "Iluminacao"],
                    ["centered_face_score", "Rosto centralizado"],
                    ["minimal_makeup_score", "Pouca maquiagem"],
                    ["texture_score", "Textura"],
                    ["depth_score", "Profundidade"]
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm text-bpGraphite/84">
                      <span>{label}</span>
                      <span className="font-medium text-bpBlack">{scanForm[key]}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={scanForm[key]}
                      onChange={(event) =>
                        setScanForm((current) => ({
                          ...current,
                          [key]: Number(event.target.value)
                        }))
                      }
                      className="w-full accent-[#C2185B]"
                    />
                  </label>
                ))}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpGraphite/84">
                    <input
                      type="checkbox"
                      checked={scanForm.blink_detected}
                      onChange={(event) =>
                        setScanForm((current) => ({
                          ...current,
                          blink_detected: event.target.checked
                        }))
                      }
                      className="h-4 w-4 accent-[#C2185B]"
                    />
                    Piscada detectada
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpGraphite/84">
                    <input
                      type="checkbox"
                      checked={scanForm.head_movement}
                      onChange={(event) =>
                        setScanForm((current) => ({
                          ...current,
                          head_movement: event.target.checked
                        }))
                      }
                      className="h-4 w-4 accent-[#C2185B]"
                    />
                    Movimento de cabeca detectado
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpGraphite/84">
                    <input
                      type="checkbox"
                      checked={scanForm.smile_detected}
                      onChange={(event) =>
                        setScanForm((current) => ({
                          ...current,
                          smile_detected: event.target.checked
                        }))
                      }
                      className="h-4 w-4 accent-[#C2185B]"
                    />
                    Sorriso detectado
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpGraphite/84">
                    <input
                      type="checkbox"
                      checked={scanForm.frown_detected}
                      onChange={(event) =>
                        setScanForm((current) => ({
                          ...current,
                          frown_detected: event.target.checked
                        }))
                      }
                      className="h-4 w-4 accent-[#C2185B]"
                    />
                    Testa franzida detectada
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 rounded-2xl border border-black/10 p-4">
                <div>
                  <p className="text-sm font-medium text-bpBlack">Leitura dermatologica</p>
                  <p className="mt-1 text-xs text-bpGraphite/78">
                    Essa camada alimenta o Skin Twin e a simulacao de rotina.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {skinMetricKeys.map((key) => {
                    const formKey = scanFieldMap[key];
                    return (
                      <label key={key} className="block space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm text-bpGraphite/84">
                          <span>{skinMetricLabels[key]}</span>
                          <span className="font-medium text-bpBlack">{scanForm[formKey]}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={scanForm[formKey]}
                          onChange={(event) => {
                            setScanForm((current) => ({
                              ...current,
                              [formKey]: Number(event.target.value)
                            }));
                          }}
                          className="w-full accent-[#C2185B]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-bpOffWhite/35 px-4 py-4">
                <p className="max-w-xl text-sm text-bpGraphite/82">
                  Use o modo avancado apenas para teste controlado. O fluxo principal deve continuar vindo da camera guiada.
                </p>
                <button
                  type="submit"
                  disabled={savingScan}
                  className="rounded-full border border-bpPinkCta/35 bg-bpPinkCta px-6 py-3 text-xs uppercase tracking-[0.2em] text-white shadow-[0_18px_38px_rgba(213,30,113,0.22)] disabled:opacity-60"
                >
                  {savingScan ? "Processando scan..." : "Executar BelaCode"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="space-y-6">
        <article className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">Skin heatmap</p>
              <p className="mt-2 text-xl font-semibold text-bpBlack">Mapa visual da sua pele</p>
              <p className="mt-2 max-w-2xl text-sm text-bpGraphite/80">
                Leitura visual por area do rosto com score geral, condicao dominante, intensidade por zona e sinais de captura
                validados pelo BelaCode.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {selectedFaceScanSummary ? (
                <span className="rounded-full border border-bpPink/25 bg-bpPinkLux px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpBlackSoft">
                  score {selectedFaceScanSummary.overallScore}/100
                </span>
              ) : null}
              {selectedFaceScan ? (
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${scanStatusClasses(selectedFaceScan.scan_status)}`}
                >
                  {scanStatusLabel(selectedFaceScan.scan_status)}
                </span>
              ) : displayHeatmapUrl ? (
                <span className="rounded-full border border-black/10 bg-bpOffWhite/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/82">
                  heatmap recente
                </span>
              ) : null}
            </div>
          </div>

          {selectedFaceScan || displayHeatmapUrl ? (
            <div className="mt-5 space-y-5">
              {selectedFaceScanSummary ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-black/10 bg-bpOffWhite/35 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Score geral</p>
                    <p className="mt-2 text-3xl font-semibold text-bpBlack">{selectedFaceScanSummary.overallScore}</p>
                    <p className="mt-1 text-xs text-bpGraphite/78">{selectedFaceScanSummary.severityLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-bpOffWhite/35 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Liveness</p>
                    <p className="mt-2 text-3xl font-semibold text-bpBlack">{selectedFaceScanSummary.livenessScore}%</p>
                    <p className="mt-1 text-xs text-bpGraphite/78">
                      {selectedFaceScan.liveness?.blink_detected ? "Piscada" : "Sem piscada"} /{" "}
                      {selectedFaceScan.liveness?.smile_detected ? "Sorriso" : "Sem sorriso"} /{" "}
                      {selectedFaceScan.liveness?.frown_detected ? "Testa franzida" : "Sem franzir"} /{" "}
                      {selectedFaceScan.liveness?.head_movement ? "Movimento ok" : "Sem rotacao"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-bpOffWhite/35 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Condicao dominante</p>
                    <p className="mt-2 text-lg font-semibold text-bpBlack">
                      {selectedFaceScanSummary.dominantCondition?.label ?? "Sem dominancia"}
                    </p>
                    <p className="mt-1 text-xs text-bpGraphite/78">
                      pico {Math.round(selectedFaceScanSummary.dominantCondition?.peak ?? 0)} / media{" "}
                      {Math.round(selectedFaceScanSummary.dominantCondition?.average ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-bpOffWhite/35 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Zona prioritaria</p>
                    <p className="mt-2 text-lg font-semibold text-bpBlack">
                      {selectedFaceScanSummary.topRegion
                        ? formatHeatmapRegionLabel(selectedFaceScanSummary.topRegion.region_slug)
                        : "Sem area critica"}
                    </p>
                    <p className="mt-1 text-xs text-bpGraphite/78">
                      {selectedFaceScanSummary.topRegion
                        ? `${heatmapStyles[selectedFaceScanSummary.topRegion.condition_type]?.label ?? "Leitura"} ${intensityLevel(selectedFaceScanSummary.topRegion.intensity)}`
                        : `${selectedFaceScanSummary.regionCount} regioes mapeadas`}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-5">
                <div className="space-y-4">
                  <div className="rounded-[30px] border border-black/10 bg-[radial-gradient(circle_at_top,_rgba(194,24,91,0.14),_transparent_42%),linear-gradient(180deg,#fff_0%,#f5edef_100%)] p-4 shadow-[0_24px_60px_rgba(18,18,18,0.06)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Leitura visual</p>
                        <p className="mt-1 text-sm text-bpGraphite/80">
                          Alterne entre mapa, imagem usada e evidencia para entender o scan sem dividir a tela.
                        </p>
                      </div>
                      <div className="inline-flex rounded-full border border-black/10 bg-white/72 p-1">
                        <button
                          type="button"
                          onClick={() => setHeatmapSurfaceTab("map")}
                          className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition ${
                            heatmapSurfaceTab === "map" ? "bg-bpPinkCta text-white shadow-[0_10px_24px_rgba(213,30,113,0.18)]" : "text-bpGraphite/76"
                          }`}
                        >
                          Mapa
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeatmapSurfaceTab("image")}
                          className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition ${
                            heatmapSurfaceTab === "image" ? "bg-bpPinkCta text-white shadow-[0_10px_24px_rgba(213,30,113,0.18)]" : "text-bpGraphite/76"
                          }`}
                        >
                          Imagem usada
                        </button>
                        {heatmapEvidence ? (
                          <button
                            type="button"
                            onClick={() => setHeatmapSurfaceTab("evidence")}
                            className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition ${
                              heatmapSurfaceTab === "evidence" ? "bg-bpPinkCta text-white shadow-[0_10px_24px_rgba(213,30,113,0.18)]" : "text-bpGraphite/76"
                            }`}
                          >
                            Evidencia
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {heatmapSurfaceTab === "map" ? (
                      <>
                        <div className="relative mt-4 aspect-[1.08] overflow-hidden rounded-[28px] border border-black/10 bg-[radial-gradient(circle_at_top,_rgba(194,24,91,0.14),_transparent_42%),linear-gradient(180deg,#fff_0%,#f5edef_100%)]">
                          {displayHeatmapUrl ? (
                            <Image
                              src={displayHeatmapUrl}
                              alt="Mapa do escaneamento da pele"
                              fill
                              sizes="(max-width: 1280px) 100vw, 920px"
                              className="object-cover object-center opacity-95"
                            />
                          ) : null}
                          {!displayHeatmapUrl ? (
                            <>
                              <div className="absolute inset-[14%_33%_10%_33%] rounded-[44%] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,237,240,0.94))] shadow-[0_24px_60px_rgba(18,18,18,0.08)]" />
                              <div className="absolute left-1/2 top-[20%] h-[12%] w-[8%] -translate-x-1/2 rounded-full border border-black/5 bg-white/75" />
                              <div className="absolute left-[41%] top-[39%] h-[2.2%] w-[5%] rounded-full bg-black/8" />
                              <div className="absolute right-[41%] top-[39%] h-[2.2%] w-[5%] rounded-full bg-black/8" />
                              <div className="absolute left-1/2 top-[48%] h-[12%] w-[1.8%] -translate-x-1/2 rounded-full bg-black/6" />
                              <div className="absolute left-1/2 top-[60%] h-[2.6%] w-[11%] -translate-x-1/2 rounded-full bg-black/8" />
                            </>
                          ) : null}
                          {(selectedFaceScan?.heatmap_regions ?? []).map((region) => {
                            const tone = heatmapStyles[region.condition_type];
                            const size = `${Math.max(72, region.radius * 260)}px`;
                            const isActive = activePriorityRegionId === region.id;
                            const hasActiveRegion = Boolean(activePriorityRegionId);
                            return (
                              <div
                                key={region.id}
                                className="absolute rounded-full blur-[10px] transition-all duration-200"
                                style={{
                                  left: `${region.position_x * 100}%`,
                                  top: `${region.position_y * 100}%`,
                                  width: size,
                                  height: size,
                                  transform: "translate(-50%, -50%)",
                                  opacity: hasActiveRegion ? (isActive ? 1 : 0.28) : 1,
                                  filter: isActive ? "blur(6px)" : "blur(10px)",
                                  background: `radial-gradient(circle, ${isActive ? toSolidTone(tone.color) : tone.color} 0%, ${isActive ? tone.color : tone.glow} 52%, transparent 78%)`
                                }}
                              />
                            );
                          })}
                          {numberedPriorityRegions.map((region) => (
                            <button
                              key={`${region.id}-marker`}
                              type="button"
                              onMouseEnter={() => setHoveredPriorityRegionId(region.id)}
                              onMouseLeave={() => setHoveredPriorityRegionId(null)}
                              onFocus={() => setHoveredPriorityRegionId(region.id)}
                              onBlur={() => setHoveredPriorityRegionId(null)}
                              onClick={() =>
                                setPinnedPriorityRegionId((current) => (current === region.id ? null : region.id))
                              }
                              className={`absolute z-[2] flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-sm font-semibold shadow-[0_10px_24px_rgba(18,18,18,0.12)] backdrop-blur transition-all duration-200 ${
                                activePriorityRegionId === region.id
                                  ? "border-bpPinkCta bg-bpPinkCta text-white shadow-[0_12px_28px_rgba(213,30,113,0.28)]"
                                  : "border-white/80 bg-white/88 text-bpBlack"
                              }`}
                              style={{
                                left: `${region.position_x * 100}%`,
                                top: `${region.position_y * 100}%`
                              }}
                              aria-label={`Destacar regiao ${region.mapIndex}: ${formatHeatmapRegionLabel(region.region_slug)}`}
                              aria-pressed={pinnedPriorityRegionId === region.id}
                            >
                              {region.mapIndex}
                            </button>
                          ))}

                          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/50 bg-white/75 px-4 py-3 backdrop-blur">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/82">
                              {selectedFaceScan?.score?.skin_type ? (
                                <span className="rounded-full border border-black/10 px-2.5 py-1">
                                  {formatSkinTypeLabel(selectedFaceScan.score.skin_type)}
                                </span>
                              ) : null}
                              {selectedFaceScan?.score?.main_concern ? (
                                <span className="rounded-full border border-bpPink/25 bg-bpPink/10 px-2.5 py-1 text-bpPink">
                                  {formatConcernLabel(selectedFaceScan.score.main_concern)}
                                </span>
                              ) : null}
                              <span className="rounded-full border border-black/10 px-2.5 py-1">
                                {selectedFaceScanSummary?.regionCount ?? 0} regioes
                              </span>
                              {!selectedFaceScan && displayHeatmapUrl ? (
                                <span className="rounded-full border border-black/10 px-2.5 py-1">
                                  imagem recuperada
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-bpGraphite/78">
                          As manchas coloridas mostram onde a IA concentrou a leitura por intensidade e tipo de sinal.
                        </p>
                        {activePriorityRegion ? (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bpPink/20 bg-white/78 px-4 py-3 text-sm text-bpGraphite/84">
                            <p className="min-w-0 flex-1">
                              <span className="font-medium text-bpBlack">
                                Regiao {activePriorityRegion.mapIndex}: {formatHeatmapRegionLabel(activePriorityRegion.region_slug)}
                              </span>{" "}
                              com {heatmapStyles[activePriorityRegion.condition_type]?.label?.toLowerCase() ?? "leitura"}{" "}
                              {intensityLevel(activePriorityRegion.intensity)}.
                            </p>
                            {pinnedPriorityRegionId ? (
                              <button
                                type="button"
                                onClick={clearPriorityRegionHighlight}
                                className="rounded-full border border-black/10 bg-bpOffWhite/70 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-bpBlackSoft transition hover:border-bpPink/35 hover:bg-bpPinkLux/55"
                              >
                                Limpar destaque
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {heatmapSurfaceTab === "image" ? (
                      <div className="mt-4 rounded-[24px] border border-black/10 bg-white/92 p-4 shadow-[0_18px_48px_rgba(18,18,18,0.04)]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Imagem avaliada</p>
                          {displayScanPreviewUrl ? (
                            <span className="rounded-full border border-black/10 bg-bpOffWhite/55 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/82">
                              scan usado
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center">
                          <div className="relative h-56 w-full overflow-hidden rounded-[22px] border border-black/10 bg-bpOffWhite md:h-48 md:w-40 md:shrink-0">
                            {displayScanPreviewUrl ? (
                              <Image
                                src={displayScanPreviewUrl}
                                alt="Imagem usada no escaneamento"
                                fill
                                sizes="(max-width: 768px) 100vw, 160px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-bpGraphite/72">
                                A foto usada no scan aparece aqui.
                              </div>
                            )}
                          </div>
                          <p className="text-sm leading-6 text-bpGraphite/78">
                            Esta e a imagem usada para ler textura, distribuicao, uniformidade e sinais visuais da pele. Ela fica como referencia do que gerou o mapa visual.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {heatmapSurfaceTab === "evidence" && heatmapEvidence ? (
                      <div className="mt-4 rounded-2xl border border-black/10 bg-bpOffWhite/35 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">
                              Base cientifica desta leitura
                            </p>
                            <p className="mt-2 text-base font-semibold text-bpBlack">{heatmapEvidence.title}</p>
                          </div>
                          <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/82">
                            integrado ao heatmap
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-bpGraphite/82">{heatmapEvidence.lead}</p>
                        <div className="mt-4 grid gap-3">
                          {heatmapEvidence.sources.map((item) => (
                            <Link
                              key={`${heatmapEvidence.title}-${item.source}-${item.focus}`}
                              href={getSkinBelaEvidenceHref(item.source)}
                              className="rounded-2xl border border-black/10 bg-white px-4 py-3 transition hover:border-bpPink/35 hover:bg-bpPinkLux/35"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-bpPink/25 bg-bpPinkLux px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-bpBlackSoft">
                                    {item.source}
                                  </span>
                                  <span className="rounded-full border border-black/10 bg-bpOffWhite/55 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/78">
                                    {item.strength}
                                  </span>
                                </div>
                                <span className="text-[11px] uppercase tracking-[0.16em] text-bpPink">
                                  Ver curadoria
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-bpBlack">{item.focus}</p>
                            </Link>
                          ))}
                        </div>
                        <p className="mt-3 text-xs leading-5 text-bpGraphite/76">
                          O mapa visual e a leitura estetica usam esta base para contextualizar acne, pigmentacao, vermelhidao,
                          textura, hidratacao e fotoenvelhecimento. Isso continua sendo triagem cosmetica, nao diagnostico medico.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-bpOffWhite/35 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">
                        O que esta sendo avaliado
                      </p>
                      <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/82">
                        {(evaluatedRegionLabels.length || 5)} areas
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(evaluatedRegionLabels.length
                        ? evaluatedRegionLabels
                        : ["Testa", "Bochechas", "Nariz", "Queixo", "Area dos olhos"]
                      ).map((label) => (
                        <span
                          key={`evaluated-region-${label}`}
                          className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-bpBlackSoft"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-bpOffWhite/35 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">Leitura rapida</p>
                    <p className="mt-3 text-sm leading-6 text-bpGraphite/84">
                      {selectedFaceScan?.scan_status === "validated"
                        ? `O scan validado mostrou maior concentracao em ${selectedFaceScanSummary?.topRegion ? formatHeatmapRegionLabel(selectedFaceScanSummary.topRegion.region_slug) : "areas distribuidas"}, com dominancia de ${selectedFaceScanSummary?.dominantCondition?.label?.toLowerCase() ?? "sensibilidade geral"}.`
                        : displayHeatmapUrl
                          ? "O mapa mais recente da pele foi recuperado para visualizacao. Os detalhes finos do scan aparecem assim que a leitura completa sincroniza."
                          : "O scan ainda nao passou pelo threshold ideal de validacao. Use iluminacao frontal, rosto centralizado e piscada real para uma leitura mais confiavel."}
                    </p>
                  </div>
                  {flaggedFindings.length ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700">Triagem visual</p>
                          <p className="mt-2 text-base font-semibold text-amber-950">
                            Achados novos ou suspeitos para avaliacao dermatologica
                          </p>
                        </div>
                        <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-800">
                          {flaggedFindings.length} sinal{flaggedFindings.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-amber-900/80">
                        Isso e triagem visual do BelaCode, nao diagnostico. Quando aparece uma mudanca nova ou suspeita, o sistema recomenda avaliacao com dermatologista e dispara alerta por email.
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {flaggedFindings.map((finding) => (
                          <div key={finding.id} className="rounded-2xl border border-amber-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-amber-950">
                                {finding.finding_type.replaceAll("_", " ")}
                              </p>
                              <span className="text-xs uppercase tracking-[0.16em] text-amber-700">
                                {finding.appearance_status}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-amber-900/70">
                              {formatHeatmapRegionLabel(finding.region_slug)} • confianca {Math.round(finding.confidence_score * 100)} • severidade {Math.round(finding.severity_score)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 2xl:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-[0_14px_36px_rgba(18,18,18,0.04)]">
                    <button
                      type="button"
                      onClick={() => setDistributionExpanded((current) => !current)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                      aria-expanded={distributionExpanded}
                    >
                      <div>
                        <p className="text-sm font-semibold text-bpBlack">Distribuicao por condicao</p>
                        <p className="mt-1 text-xs text-bpGraphite/84">intensidade media e pico</p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-bpGraphite/76 transition-transform ${distributionExpanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>

                    {distributionExpanded ? (
                      selectedFaceScanSummary?.conditionSummaries.length ? (
                        <div className="mt-4 space-y-3">
                          {selectedFaceScanSummary.conditionSummaries.map((condition) => {
                            const tone = heatmapStyles[condition.condition];
                            const matchingPriorityRegion = priorityRegionByCondition[condition.condition] ?? null;
                            const isActive = activePriorityCondition === condition.condition;
                            return (
                              <button
                                key={`${selectedFaceScan?.id ?? "fallback"}-${condition.condition}`}
                                type="button"
                                disabled={!matchingPriorityRegion}
                                onMouseEnter={() => {
                                  if (matchingPriorityRegion) setHoveredPriorityRegionId(matchingPriorityRegion.id);
                                }}
                                onMouseLeave={() => setHoveredPriorityRegionId(null)}
                                onFocus={() => {
                                  if (matchingPriorityRegion) setHoveredPriorityRegionId(matchingPriorityRegion.id);
                                }}
                                onBlur={() => setHoveredPriorityRegionId(null)}
                                onClick={() => {
                                  if (!matchingPriorityRegion) return;
                                  setPinnedPriorityRegionId((current) =>
                                    current === matchingPriorityRegion.id ? null : matchingPriorityRegion.id
                                  );
                                }}
                                aria-pressed={matchingPriorityRegion ? pinnedPriorityRegionId === matchingPriorityRegion.id : undefined}
                                className={`w-full rounded-2xl border p-3 text-left transition ${
                                  isActive
                                    ? "border-bpPinkCta bg-bpPink/10 shadow-[0_10px_26px_rgba(213,30,113,0.12)]"
                                    : "border-black/10 bg-bpOffWhite/35 hover:border-bpPink/30"
                                } ${matchingPriorityRegion ? "" : "cursor-default"}`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`rounded-full ${isActive ? "h-4 w-4 ring-4 ring-bpPinkLux/80" : "h-3.5 w-3.5"}`}
                                      style={{ backgroundColor: toSolidTone(tone.color) }}
                                    />
                                    <div>
                                      <p className="text-sm font-medium text-bpBlack">{condition.label}</p>
                                      <p className="text-xs text-bpGraphite/78">
                                        {condition.count} regioes / leitura {intensityLevel(condition.peak)}
                                        {matchingPriorityRegion ? ` / mapa ${matchingPriorityRegion.mapIndex}` : ""}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-bpBlack">{Math.round(condition.peak)}</p>
                                    <p className="text-[11px] text-bpGraphite/72">pico</p>
                                  </div>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/6">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.max(8, Math.round(condition.average))}%`,
                                      background: `linear-gradient(90deg, ${toSolidTone(tone.color)} 0%, ${tone.color} 100%)`
                                    }}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-black/10 bg-bpOffWhite/60 p-4 text-sm text-bpGraphite/82">
                          {displayHeatmapUrl
                            ? "O mapa recente foi recuperado, mas os agrupamentos por condicao ainda nao chegaram completos."
                            : "Nenhuma area sensivel destacada no ultimo scan validado."}
                        </div>
                      )
                    ) : (
                      <div className="mt-4 rounded-2xl border border-black/10 bg-bpOffWhite/45 px-4 py-3 text-sm text-bpGraphite/80">
                        Abra para ver acne, pigmentacao, poros, linhas, hidratacao e vermelhidao organizados por intensidade.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-[0_14px_36px_rgba(18,18,18,0.04)]">
                    <button
                      type="button"
                      onClick={() => setPriorityRegionsExpanded((current) => !current)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                      aria-expanded={priorityRegionsExpanded}
                    >
                      <div>
                        <p className="text-sm font-semibold text-bpBlack">Zonas prioritarias</p>
                        <p className="mt-1 text-xs text-bpGraphite/84">top 4 regioes numeradas no mapa</p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-bpGraphite/76 transition-transform ${priorityRegionsExpanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>

                    {priorityRegionsExpanded ? (
                      numberedPriorityRegions.length ? (
                        <div className="mt-4 grid gap-3 2xl:grid-cols-2">
                          {numberedPriorityRegions.map((region) => {
                            const tone = heatmapStyles[region.condition_type];
                            const isActive = activePriorityRegionId === region.id;
                            return (
                              <button
                                key={`${selectedFaceScan?.id ?? "fallback"}-${region.id}`}
                                type="button"
                                onMouseEnter={() => setHoveredPriorityRegionId(region.id)}
                                onMouseLeave={() => setHoveredPriorityRegionId(null)}
                                onFocus={() => setHoveredPriorityRegionId(region.id)}
                                onBlur={() => setHoveredPriorityRegionId(null)}
                                onClick={() =>
                                  setPinnedPriorityRegionId((current) => (current === region.id ? null : region.id))
                                }
                                className={`rounded-[22px] border bg-white p-4 text-left shadow-[0_10px_30px_rgba(18,18,18,0.03)] transition-all duration-200 ${
                                  isActive
                                    ? "border-bpPinkCta shadow-[0_12px_30px_rgba(213,30,113,0.14)]"
                                    : "border-black/10 hover:border-bpPink/30"
                                }`}
                                aria-pressed={pinnedPriorityRegionId === region.id}
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                                      isActive
                                        ? "border-bpPinkCta bg-bpPinkCta text-white"
                                        : "border-black/10 bg-bpBlack text-white"
                                    }`}
                                  >
                                    {region.mapIndex}
                                  </span>
                                  <span
                                    className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]"
                                    style={{
                                      backgroundColor: tone.glow,
                                      color: toSolidTone(tone.color)
                                    }}
                                  >
                                    {tone.label}
                                  </span>
                                  <span className="rounded-full border border-black/10 bg-bpOffWhite/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-bpBlack">
                                    score {Math.round(region.intensity)}
                                  </span>
                                </div>
                                <p className="mt-3 text-base font-semibold text-bpBlack">
                                  {formatHeatmapRegionLabel(region.region_slug)}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="rounded-full border border-black/10 bg-bpOffWhite/45 px-2.5 py-1 text-xs text-bpGraphite/82">
                                    intensidade {intensityLevel(region.intensity)}
                                  </span>
                                  <span className="rounded-full border border-black/10 bg-bpOffWhite/45 px-2.5 py-1 text-xs text-bpGraphite/82">
                                    raio {Math.round(region.radius * 100)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-black/10 bg-bpOffWhite/60 p-4 text-sm text-bpGraphite/82">
                          {displayHeatmapUrl
                            ? "O mapa do rosto ja foi recuperado. As zonas prioritarias aparecem aqui assim que a leitura detalhada terminar de sincronizar."
                            : "As regioes prioritarias aparecem aqui assim que houver um scan validado com leitura suficiente."}
                        </div>
                      )
                    ) : (
                      <div className="mt-4 rounded-2xl border border-black/10 bg-bpOffWhite/45 px-4 py-3 text-sm text-bpGraphite/80">
                        Abra para ver as regioes numeradas do mapa e destacar cada area por toque ou hover.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-black/10 bg-bpOffWhite/60 p-5 text-sm text-bpGraphite/84">
              Execute o primeiro BelaCode para liberar o heatmap visual da pele.
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
          <button
            type="button"
            onClick={() => setHistoryExpanded((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={historyExpanded}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">Historico BelaCode</p>
              <p className="mt-2 text-xl font-semibold text-bpBlack">Diagnosticos recentes</p>
              <p className="mt-2 text-sm text-bpGraphite/80">
                Abra apenas quando quiser comparar scans anteriores e selecionar outra leitura.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-black/10 bg-bpOffWhite/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/82">
                {faceScans.length} scans
              </span>
              <ChevronDown
                className={`h-4 w-4 text-bpGraphite/76 transition-transform ${historyExpanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </div>
          </button>

          {historyExpanded ? (
            faceScans.length ? (
              <div className="mt-5 space-y-3">
                {faceScans.map((scan) => (
                  <div
                    key={scan.id}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedFaceScan?.id === scan.id
                        ? "border-bpPink/45 bg-bpPink/10"
                        : "border-black/10 bg-white hover:border-bpPink/25 hover:bg-bpOffWhite/70"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button type="button" onClick={() => setSelectedFaceScanId(scan.id)} className="min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-bpBlack">
                              {new Date(scan.created_at).toLocaleDateString("pt-BR")} - {scan.scan_status}
                            </p>
                            <p className="mt-1 text-xs text-bpGraphite/78">
                              {formatSkinTypeLabel(scan.score?.skin_type)} / {scan.score?.main_concern ? formatConcernLabel(scan.score.main_concern) : "sem concern dominante"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.18em] text-bpGraphite/72">overall</p>
                            <p className="mt-1 text-lg font-semibold text-bpBlack">
                              {scan.score ? Math.round(scan.score.overall_score) : "--"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em]">
                          <span className="rounded-full border border-black/10 px-2.5 py-1 text-bpGraphite/82">
                            liveness {Math.round((scan.liveness?.confidence ?? scan.liveness_score) * 100)}%
                          </span>
                          {scan.progress ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                              evolucao {scan.progress.improvement_score > 0 ? "+" : ""}
                              {scan.progress.improvement_score.toFixed(1)}
                            </span>
                          ) : null}
                          <span className="rounded-full border border-black/10 px-2.5 py-1 text-bpGraphite/82">
                            {scan.heatmap_regions.length} regioes
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteFaceScan(scan.id)}
                        disabled={deletingScanId === scan.id}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingScanId === scan.id ? "Removendo..." : "Remover scan"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-black/10 bg-bpOffWhite/60 p-5 text-sm text-bpGraphite/84">
                O historico do BelaCode aparece aqui assim que voce registrar o primeiro scan.
              </div>
            )
          ) : null}
        </article>
      </section>

      {similarProfiles.length ? (
        <section id="belacode-scan" className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">Skin data network</p>
              <p className="mt-2 text-xl font-semibold text-bpBlack">Peles parecidas na plataforma</p>
              <p className="mt-2 max-w-3xl text-sm text-bpGraphite/82">
                Casos anonimizados com embedding semelhante ao seu twin atual. Isso ajuda a calibrar recomendacao e expectativa
                de evolucao.
              </p>
            </div>
            <span className="rounded-full border border-black/10 bg-bpOffWhite/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/82">
              {similarProfiles.length} casos
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {similarProfiles.map((item, index) => (
              <article key={`${item.similar_user_id}-${index}`} className="rounded-2xl border border-black/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-bpGraphite/72">caso {index + 1}</p>
                  <span className="rounded-full border border-bpPink/25 bg-bpPinkLux px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpBlackSoft">
                    match {Math.round(item.similarity * 100)}%
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.15em]">
                  {item.skin_type ? (
                    <span className="rounded-full border border-black/10 px-2.5 py-1 text-bpGraphite/84">
                      {formatSkinTypeLabel(item.skin_type)}
                    </span>
                  ) : null}
                  {item.main_concern ? (
                    <span className="rounded-full border border-black/10 px-2.5 py-1 text-bpGraphite/84">{formatConcernLabel(item.main_concern)}</span>
                  ) : null}
                  {item.latest_improvement_score !== null ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                      evolucao {item.latest_improvement_score > 0 ? "+" : ""}
                      {item.latest_improvement_score.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-bpGraphite/82">Score geral</span>
                    <span className="font-medium text-bpBlack">
                      {item.overall_score !== null ? Math.round(item.overall_score) : "--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-bpGraphite/82">Hidratacao</span>
                    <span className="font-medium text-bpBlack">
                      {item.hydration_level !== null ? Math.round(item.hydration_level) : "--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-bpGraphite/82">Pigmentacao</span>
                    <span className="font-medium text-bpBlack">
                      {item.pigmentation_level !== null ? Math.round(item.pigmentation_level) : "--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-bpGraphite/82">Acne</span>
                    <span className="font-medium text-bpBlack">
                      {item.acne_level !== null ? Math.round(item.acne_level) : "--"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section id="belacode-scan" className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">Simulacao de rotina</p>
            <p className="mt-2 text-xl font-semibold text-bpBlack">Sua pele em 30, 60 e 90 dias</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-black/10 bg-bpOffWhite/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/82">
              {simulationTopProducts.length} produtos considerados
            </span>
            <button
              type="button"
              onClick={handleSaveSimulationSnapshot}
              disabled={savingSimulationSnapshot || !simulations.length || !skinTwin}
              className="rounded-full border border-bpPink/40 bg-bpPinkLux px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-bpBlackSoft disabled:opacity-50"
            >
              {savingSimulationSnapshot ? "Salvando..." : "Salvar simulacao"}
            </button>
          </div>
        </div>

        {simulations.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {simulations.map((scenario) => (
              <article key={scenario.days} className="rounded-2xl border border-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-bpGraphite/84">janela</p>
                <p className="mt-2 text-2xl font-semibold text-bpBlack">{scenario.days} dias</p>
                <p className="mt-3 text-sm text-bpGraphite/84">
                  melhora prevista de <span className="font-semibold text-bpBlack">{scenario.predicted_improvement.toFixed(1)}</span>
                </p>
                <p className="mt-1 text-xs text-bpGraphite/84">
                  confianca {Math.round(scenario.confidence_score * 100)}%
                </p>

                <div className="mt-4 grid gap-2">
                  {(["hydration_level", "acne_level", "pigmentation_level"] as SkinMetricKey[]).map((key) => (
                    <div key={key} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-bpGraphite/82">{skinMetricLabels[key]}</span>
                      <span className="font-medium text-bpBlack">{Math.round(scenario.predicted_metrics[key])}</span>
                    </div>
                  ))}
                </div>

                {scenario.key_effects.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {scenario.key_effects.map((effect) => (
                      <span
                        key={`${scenario.days}-${effect.ingredient_name}-${effect.target_metric}`}
                        className="rounded-full border border-bpPink/20 bg-bpPinkLux px-2.5 py-1 text-[11px] uppercase tracking-[0.15em] text-bpBlackSoft"
                      >
                        {effect.ingredient_name} - {skinMetricLabels[effect.target_metric as SkinMetricKey]}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-black/10 bg-bpOffWhite/60 p-5 text-sm text-bpGraphite/84">
            Defina seu perfil e gere uma rotina para liberar a simulacao.
          </div>
        )}

        {simulationTopProducts.length ? (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/84">Produtos mais influentes na simulacao</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {simulationTopProducts.slice(0, 3).map((product) => (
                <div key={product.product_id} className="flex gap-3 rounded-2xl border border-black/10 p-3">
                  <div className="relative h-20 w-16 overflow-hidden rounded-xl bg-bpOffWhite">
                    {product.hero_image_url ? (
                      <Image
                        src={product.hero_image_url}
                        alt={product.product_name}
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized={product.hero_image_url.endsWith(".svg")}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-bpBlack">{product.product_name}</p>
                    <p className="mt-1 text-xs text-bpGraphite/78">{product.routine_step_name}</p>
                    <p className="mt-2 text-sm text-bpBlack">{formatMoneyFromCents(product.price_cents)}</p>
                    {product.effectiveness ? (
                      <p className="mt-1 text-xs text-bpGraphite/84">
                        confianca observada {Math.round(product.effectiveness.confidence_score * 100)}%
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {savedSimulations.length ? (
          <div className="mt-6 rounded-3xl border border-black/10 bg-bpOffWhite/45 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-bpGraphite/72">Historico salvo</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {savedSimulations.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-black/10 bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-bpBlack">{item.simulation_period_days} dias</p>
                    <span className="text-xs text-bpGraphite/84">
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-bpGraphite/84">
                    melhora prevista <span className="font-semibold text-bpBlack">{item.predicted_improvement.toFixed(1)}</span>
                  </p>
                  <p className="mt-1 text-xs text-bpGraphite/84">
                    confianca {Math.round(item.confidence_score * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {routineCart ? (
        <section id="belacode-scan" className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">Carrinho da rotina</p>
              <p className="mt-2 text-xl font-semibold text-bpBlack">Sua selecao pronta para compra</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/84">Total</p>
              <p className="mt-1 text-lg font-semibold text-bpBlack">
                {formatMoneyFromCents(routineCart.total_price_cents)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {routineCart.items.map((item) => (
              <div
                key={`${item.cart_id}-${item.product_id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-bpBlack">{item.product?.name ?? "Produto"}</p>
                  <p className="text-xs text-bpGraphite/78">
                    {item.routine_step?.name ?? "Etapa"} - posicao {item.position}
                  </p>
                </div>
                <p className="text-sm font-semibold text-bpBlack">
                  {formatMoneyFromCents(item.product?.price_cents ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section id="belacode-scan" className="rounded-3xl border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.58))] p-6 shadow-[0_18px_48px_rgba(91,49,56,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-bpGraphite/84">SkinBela assistant</p>
            <p className="mt-2 text-xl font-semibold text-bpBlack">Conversa guiada pela sua pele</p>
            <p className="mt-2 max-w-3xl text-sm text-bpGraphite/82">
              O SkinBela responde com base no seu perfil, Skin Twin e em uma base priorizada por evidencia dermatologica.
              Quando houver fonte disponivel, ele prioriza revisoes sistematicas, meta-analises, ensaios randomizados e diretrizes, com
              preferencia por Cochrane, AAD, UpToDate, DynaMed, JAMA Dermatology, PubMed e fontes brasileiras ou latino-americanas
              quando o contexto pedir.
            </p>
          </div>
          {assistantAnswer ? (
            <span className="rounded-full border border-black/10 bg-bpOffWhite/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/82">
              modo {assistantAnswer.answer.source_mode}
            </span>
          ) : null}
        </div>

        <form onSubmit={handleAskAssistant} className="mt-5 space-y-4">
          <textarea
            value={assistantQuestion}
            onChange={(event) => setAssistantQuestion(event.target.value)}
            placeholder="Ex.: Minha pele esta mais sensivel e com manchas. O que devo priorizar agora?"
            className="min-h-28 w-full rounded-3xl border border-black/10 bg-white px-5 py-4 text-sm text-bpBlack outline-none transition focus:border-bpPinkCta/40"
          />
          <div className="flex flex-wrap gap-2">
            {[
              "O que devo priorizar para hidratacao e barreira?",
              "Quais ingredientes fazem mais sentido para manchas?",
              "Minha pele esta sensivel. O que evitar?"
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setAssistantQuestion(prompt)}
                className="rounded-full border border-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/82"
              >
                {prompt}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={askingAssistant}
            className="rounded-full border border-bpPinkCta/35 bg-bpPinkCta px-6 py-3 text-xs uppercase tracking-[0.2em] text-white shadow-[0_18px_38px_rgba(213,30,113,0.22)] disabled:opacity-60"
          >
            {askingAssistant ? "Consultando..." : "Perguntar ao SkinBela"}
          </button>
        </form>

        {assistantAnswer ? (
          <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-3xl border border-black/10 bg-bpOffWhite/45 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-bpGraphite/72">Resposta</p>
              <p className="mt-3 text-base leading-7 text-bpBlack">{assistantAnswer.answer.answer}</p>
              {assistantAnswer.answer.highlights.length ? (
                <div className="mt-4 space-y-2">
                  {assistantAnswer.answer.highlights.map((highlight) => (
                    <div key={highlight} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpGraphite/84">
                      {highlight}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>

            <article className="grid gap-4">
              <div className="rounded-3xl border border-black/10 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-bpGraphite/72">Ingredientes sugeridos</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {assistantAnswer.answer.suggested_ingredients.length ? (
                    assistantAnswer.answer.suggested_ingredients.map((ingredient) => (
                      <span
                        key={ingredient}
                        className="rounded-full border border-bpPink/25 bg-bpPinkLux px-3 py-2 text-[11px] uppercase tracking-[0.15em] text-bpBlackSoft"
                      >
                        {ingredient}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-bpGraphite/82">Sem ingrediente dominante nesta pergunta.</span>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-bpGraphite/72">Foco de rotina</p>
                <div className="mt-4 space-y-2">
                  {assistantAnswer.answer.suggested_routine_focus.length ? (
                    assistantAnswer.answer.suggested_routine_focus.map((item) => (
                      <div key={item} className="rounded-2xl border border-black/10 bg-bpOffWhite/45 px-4 py-3 text-sm text-bpBlack">
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-bpGraphite/82">Sem etapa prioritaria identificada.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-800">Cautelas</p>
                <div className="mt-3 space-y-2">
                  {assistantAnswer.answer.disclaimers.map((item) => (
                    <p key={item} className="text-sm text-amber-900">
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              {assistantAnswer.answer.citations.length ? (
                <div className="rounded-3xl border border-black/10 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-bpGraphite/72">Base consultada</p>
                  <div className="mt-4 space-y-2">
                    {assistantAnswer.answer.citations.map((item) => (
                      <div key={item} className="rounded-2xl border border-black/10 bg-bpOffWhite/45 px-4 py-3 text-sm text-bpBlack">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          </div>
        ) : null}
      </section>

      {message ? (
        <div className="rounded-2xl border border-[rgba(216,160,172,0.28)] bg-bpPinkLux/95 px-4 py-3 text-sm text-bpBlackSoft">
          {message}
        </div>
      ) : null}

      {latestScan ? (
        <div className="text-xs uppercase tracking-[0.18em] text-bpGraphite/50">
          ultimo scan registrado em {new Date(latestScan.created_at).toLocaleDateString("pt-BR")}
        </div>
      ) : null}
    </div>
  );
}


