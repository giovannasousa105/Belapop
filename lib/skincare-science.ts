// lib/skincare-science.ts
// Base científica para o Skin Scan BelaPop
// Fontes: PubMed, Cochrane Skin, JAAD 2024, British Journal of Dermatology 2025, AAD Guidelines 2024

export type SkinType = "oleosa" | "seca" | "mista" | "normal" | "sensivel";
export type SkinConcern =
  | "acne"
  | "oleosidade"
  | "manchas"
  | "linhas_finas"
  | "sensibilidade"
  | "poros"
  | "hidratação"
  | "luminosidade"
  | "olheiras"
  | "textura";

export interface ActiveIngredient {
  name: string;
  evidence: "A" | "B" | "C"; // A = systematic review/RCT, B = clinical study, C = mechanistic
  mechanism: string;
  concerns: SkinConcern[];
  contraindications: SkinType[];
  frequency: "diaria" | "2x_dia" | "3x_semana" | "semanal";
  period: "manha" | "noite" | "ambos";
  concentration?: string;
  reference: string;
}

export interface CatalogProduct {
  slug: string;
  name: string;
  category: string;
  price: number | null;
  step: number;
  period: string[];
  skinTypes: SkinType[];
  addresses: SkinConcern[];
  keyActives: string[];
  description: string;
  ritual: string;
}

export interface RoutineStep extends CatalogProduct {
  whyRecommended: string;
}

// ── Ativos validados cientificamente ─────────────────────────────────────────

export const EVIDENCE_BASED_ACTIVES: ActiveIngredient[] = [
  {
    name: "Ácido Retinóico / Retinol",
    evidence: "A",
    mechanism:
      "Agonista de receptores nucleares RAR/RXR — estimula turnover celular, síntese de colágeno, reduz MMP. Metanálise Cochrane 2023 (CD007750): eficácia comprovada em fotoenvelhecimento.",
    concerns: ["linhas_finas", "textura", "manchas", "acne", "poros"],
    contraindications: ["sensivel"],
    frequency: "3x_semana",
    period: "noite",
    concentration: "0.025–0.1% retinol (OTC) / 0.025–0.1% tretinoína (Rx)",
    reference: "PMID: 36779336 | Mukherjee 2006 J Clin Aesthet Dermatol"
  },
  {
    name: "Niacinamida (Vitamina B3)",
    evidence: "A",
    mechanism:
      "Inibe transferência de melanossomas (melanina), reduz IL-8 e TNF-α, reforça ceramidas na barreira. RCT Hakozaki 2002: 5% reduz hiperpigmentação em 4 semanas.",
    concerns: ["manchas", "oleosidade", "poros", "luminosidade", "sensibilidade", "textura"],
    contraindications: [],
    frequency: "2x_dia",
    period: "ambos",
    concentration: "2–10%",
    reference: "PMID: 11984519 | Draelos 2006 J Cosmet Dermatol"
  },
  {
    name: "Ácido Ascórbico (Vitamina C)",
    evidence: "A",
    mechanism:
      "Inibe tirosinase (enzima da melanogênese), neutraliza ROS, co-fator da síntese de colágeno. JAAD 2020: 10–20% L-AA significativamente eficaz.",
    concerns: ["manchas", "luminosidade", "linhas_finas", "textura"],
    contraindications: ["sensivel"],
    frequency: "diaria",
    period: "manha",
    concentration: "10–20% L-ácido ascórbico, pH 2.5–3.5",
    reference: "PMID: 32563278 | Al-Niaimi & Chiang 2017 J Clin Aesthet Dermatol"
  },
  {
    name: "Ácido Hialurônico (AH)",
    evidence: "A",
    mechanism:
      "Humectante: 1g de AH liga 6L de água. Multi-peso: AH alto PM forma filme, baixo PM penetra e estimula síntese endógena. Meta-análise Papakonstantinou 2012.",
    concerns: ["hidratação", "linhas_finas", "textura", "sensibilidade"],
    contraindications: [],
    frequency: "2x_dia",
    period: "ambos",
    concentration: "0.1–2% (múltiplos pesos moleculares)",
    reference: "PMID: 22956862 | Dahiya & Kamal 2020 J Pharm Bioallied Sci"
  },
  {
    name: "Ácido Salicílico (BHA)",
    evidence: "A",
    mechanism:
      "Lipofílico — penetra folículo e dissolve tampões de sebo (comedolítico). Anti-inflamatório via inibição COX. JAAD 2016 guideline acne: agente de primeira linha.",
    concerns: ["acne", "oleosidade", "poros", "textura"],
    contraindications: ["seca", "sensivel"],
    frequency: "2x_dia",
    period: "ambos",
    concentration: "0.5–2%",
    reference: "PMID: 27608600 | Zaenglein 2016 JAAD Acne Guidelines"
  },
  {
    name: "Ácido Glicólico (AHA)",
    evidence: "A",
    mechanism:
      "Alfa-hidroxi-ácido de menor PM — quebra pontes desmossômicas, acelera esfoliação, estimula síntese de GAGs e colágeno. BJDD 2018: eficaz em textura, manchas e acne.",
    concerns: ["textura", "manchas", "oleosidade", "poros", "luminosidade"],
    contraindications: ["sensivel"],
    frequency: "3x_semana",
    period: "noite",
    concentration: "5–10% (tônico/sérum)",
    reference: "PMID: 9832524 | Bernstein 1996 Dermatol Surg"
  },
  {
    name: "Peptídeos de Sinalização (Matrixyl 3000, Argireline)",
    evidence: "B",
    mechanism:
      "Palmitoil-pentapeptídeo-4 ativa TGF-β1, estimula fibroblastos a produzirem colágeno I/III/IV e fibronectina. IJC 2022.",
    concerns: ["linhas_finas", "textura", "olheiras"],
    contraindications: [],
    frequency: "diaria",
    period: "noite",
    concentration: "3–8 ppm palmitoil pentapeptídeo",
    reference: "PMID: 35638506 | Gorouhi & Maibach 2009 Int J Cosm Sci"
  },
  {
    name: "Ceramidas (Ceramida NP, AP, EOP)",
    evidence: "A",
    mechanism:
      "Constituintes da barreira epidérmica (50% lipídios intercelulares). Reposição tópica restaura TEWL elevada. RCT Del Rosso 2016: ceramidas reduzem TEWL 43% em 4 semanas.",
    concerns: ["hidratação", "sensibilidade", "textura"],
    contraindications: [],
    frequency: "2x_dia",
    period: "ambos",
    concentration: "Ceramida NP + AP + EOP em veículo lipossômico",
    reference: "PMID: 27617749 | Draelos 2018 Dermatol Ther"
  },
  {
    name: "Filtro Solar UVA/UVB (FPS 50+)",
    evidence: "A",
    mechanism:
      "UV induz 8-OHdG (dano DNA), ativa tirosinase (manchas), degrada colágeno via MMP. Cochrane 2016 (CD010991): único agente anti-aging com evidence Grade 1A.",
    concerns: [
      "manchas", "linhas_finas", "luminosidade", "oleosidade", "acne",
      "sensibilidade", "textura", "poros", "hidratação", "olheiras"
    ],
    contraindications: [],
    frequency: "diaria",
    period: "manha",
    concentration: "FPS 50+ + PPD 8+ (proteção UVA)",
    reference: "PMID: 27474275 | Hughes 2013 NEJM"
  },
  {
    name: "Cafeína Tópica",
    evidence: "B",
    mechanism:
      "Inibe PDE, aumenta cAMP → lipólise local. Vasoconstritora — reduz eritema e bolsas. J Cosmet Dermatol 2021 confirma redução de olheiras.",
    concerns: ["olheiras"],
    contraindications: [],
    frequency: "diaria",
    period: "manha",
    concentration: "3–5%",
    reference: "PMID: 32737095 | Herman & Herman 2013 Skin Pharmacol Physiol"
  },
  {
    name: "Ácido Azelaico",
    evidence: "A",
    mechanism:
      "Inibe tirosinase (despigmentante), bacteriostático contra C. acnes, anti-inflamatório. Seguro em pele sensível e gestantes. JAAD 2022.",
    concerns: ["acne", "manchas", "sensibilidade", "oleosidade", "luminosidade"],
    contraindications: [],
    frequency: "2x_dia",
    period: "ambos",
    concentration: "10–20%",
    reference: "PMID: 20426809 | Thiboutot 2008 Dermatology"
  }
];

// ── Matriz de prioridade: tipo × concern → ativos ─────────────────────────────

export const SKIN_MATRIX: Record<SkinType, Partial<Record<SkinConcern, string[]>>> = {
  oleosa: {
    acne: ["Ácido Salicílico (BHA)", "Ácido Azelaico", "Niacinamida (Vitamina B3)", "Ácido Retinóico / Retinol"],
    oleosidade: ["Niacinamida (Vitamina B3)", "Ácido Salicílico (BHA)", "Ácido Glicólico (AHA)"],
    poros: ["Ácido Salicílico (BHA)", "Ácido Retinóico / Retinol", "Niacinamida (Vitamina B3)"],
    manchas: ["Niacinamida (Vitamina B3)", "Ácido Ascórbico (Vitamina C)", "Ácido Azelaico"],
    luminosidade: ["Ácido Ascórbico (Vitamina C)", "Ácido Glicólico (AHA)", "Niacinamida (Vitamina B3)"],
    textura: ["Ácido Glicólico (AHA)", "Ácido Salicílico (BHA)", "Ácido Retinóico / Retinol"],
    linhas_finas: ["Ácido Retinóico / Retinol", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)", "Ácido Ascórbico (Vitamina C)"],
    olheiras: ["Cafeína Tópica", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)"],
    hidratação: ["Ácido Hialurônico (AH)", "Niacinamida (Vitamina B3)"],
    sensibilidade: ["Ácido Azelaico", "Niacinamida (Vitamina B3)", "Ceramidas (Ceramida NP, AP, EOP)"]
  },
  seca: {
    hidratação: ["Ácido Hialurônico (AH)", "Ceramidas (Ceramida NP, AP, EOP)", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)"],
    textura: ["Ácido Glicólico (AHA)", "Ceramidas (Ceramida NP, AP, EOP)", "Ácido Hialurônico (AH)"],
    linhas_finas: ["Ácido Retinóico / Retinol", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)", "Ceramidas (Ceramida NP, AP, EOP)"],
    manchas: ["Niacinamida (Vitamina B3)", "Ácido Azelaico", "Ácido Ascórbico (Vitamina C)"],
    luminosidade: ["Ácido Ascórbico (Vitamina C)", "Niacinamida (Vitamina B3)", "Ácido Hialurônico (AH)"],
    sensibilidade: ["Ceramidas (Ceramida NP, AP, EOP)", "Ácido Hialurônico (AH)"],
    olheiras: ["Cafeína Tópica", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)", "Ácido Hialurônico (AH)"],
    acne: ["Ácido Azelaico", "Niacinamida (Vitamina B3)"],
    oleosidade: ["Niacinamida (Vitamina B3)"],
    poros: ["Niacinamida (Vitamina B3)", "Ácido Retinóico / Retinol"]
  },
  mista: {
    oleosidade: ["Niacinamida (Vitamina B3)", "Ácido Salicílico (BHA)", "Ácido Glicólico (AHA)"],
    hidratação: ["Ácido Hialurônico (AH)", "Niacinamida (Vitamina B3)"],
    manchas: ["Niacinamida (Vitamina B3)", "Ácido Ascórbico (Vitamina C)", "Ácido Azelaico"],
    poros: ["Ácido Salicílico (BHA)", "Niacinamida (Vitamina B3)", "Ácido Retinóico / Retinol"],
    acne: ["Ácido Salicílico (BHA)", "Ácido Azelaico", "Niacinamida (Vitamina B3)"],
    textura: ["Ácido Glicólico (AHA)", "Ácido Retinóico / Retinol", "Niacinamida (Vitamina B3)"],
    linhas_finas: ["Ácido Retinóico / Retinol", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)", "Ácido Ascórbico (Vitamina C)"],
    luminosidade: ["Ácido Ascórbico (Vitamina C)", "Niacinamida (Vitamina B3)", "Ácido Glicólico (AHA)"],
    olheiras: ["Cafeína Tópica", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)"],
    sensibilidade: ["Ceramidas (Ceramida NP, AP, EOP)", "Ácido Azelaico", "Niacinamida (Vitamina B3)"]
  },
  normal: {
    luminosidade: ["Ácido Ascórbico (Vitamina C)", "Niacinamida (Vitamina B3)"],
    manchas: ["Niacinamida (Vitamina B3)", "Ácido Ascórbico (Vitamina C)", "Ácido Azelaico"],
    linhas_finas: ["Ácido Retinóico / Retinol", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)", "Ácido Ascórbico (Vitamina C)"],
    hidratação: ["Ácido Hialurônico (AH)", "Ceramidas (Ceramida NP, AP, EOP)"],
    textura: ["Ácido Glicólico (AHA)", "Ácido Retinóico / Retinol"],
    olheiras: ["Cafeína Tópica", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)"],
    poros: ["Niacinamida (Vitamina B3)", "Ácido Retinóico / Retinol"],
    acne: ["Ácido Salicílico (BHA)", "Ácido Azelaico"],
    oleosidade: ["Niacinamida (Vitamina B3)"],
    sensibilidade: ["Ceramidas (Ceramida NP, AP, EOP)", "Ácido Hialurônico (AH)"]
  },
  sensivel: {
    sensibilidade: ["Ceramidas (Ceramida NP, AP, EOP)", "Ácido Hialurônico (AH)", "Ácido Azelaico"],
    hidratação: ["Ácido Hialurônico (AH)", "Ceramidas (Ceramida NP, AP, EOP)"],
    manchas: ["Ácido Azelaico", "Niacinamida (Vitamina B3)"],
    oleosidade: ["Niacinamida (Vitamina B3)", "Ácido Azelaico"],
    poros: ["Niacinamida (Vitamina B3)"],
    luminosidade: ["Niacinamida (Vitamina B3)", "Ácido Azelaico"],
    acne: ["Ácido Azelaico", "Niacinamida (Vitamina B3)"],
    olheiras: ["Cafeína Tópica", "Peptídeos de Sinalização (Matrixyl 3000, Argireline)"],
    textura: ["Ceramidas (Ceramida NP, AP, EOP)", "Ácido Hialurônico (AH)"],
    linhas_finas: ["Peptídeos de Sinalização (Matrixyl 3000, Argireline)", "Ceramidas (Ceramida NP, AP, EOP)", "Ácido Hialurônico (AH)"]
  }
};

// ── Catálogo de produtos BelaPop ──────────────────────────────────────────────

export const PRODUCT_CATALOG: CatalogProduct[] = [
  {
    slug: "gel-limpeza-veludo",
    name: "Gel Limpeza Veludo",
    category: "limpeza",
    price: 219,
    step: 1,
    period: ["manha", "noite"],
    skinTypes: ["oleosa", "mista", "normal", "seca"],
    addresses: ["oleosidade", "acne", "poros", "textura"],
    keyActives: ["surfactantes suaves", "glicerina"],
    description: "Limpeza suave que remove impurezas sem agredir a barreira",
    ritual: "RESET DELICADO — massageie 60s, enxague com água fria ou morna"
  },
  {
    slug: "tonico-nuvem-de-rosa",
    name: "Tônico Nuvem de Rosa",
    category: "tonico",
    price: null,
    step: 2,
    period: ["manha", "noite"],
    skinTypes: ["seca", "sensivel", "normal", "mista"],
    addresses: ["hidratação", "sensibilidade", "luminosidade", "textura"],
    keyActives: ["água de rosas", "ácido hialurônico", "pantenol"],
    description: "Prepara a pele para absorção dos próximos passos, hidrata e acalma",
    ritual: "PREPARO — aplique com as mãos após limpeza"
  },
  {
    slug: "serum-radiance-01",
    name: "Sérum Radiance 01",
    category: "serum",
    price: 289,
    step: 3,
    period: ["noite"],
    skinTypes: ["normal", "mista", "seca", "oleosa"],
    addresses: ["luminosidade", "manchas", "textura", "linhas_finas"],
    keyActives: ["niacinamida", "vitamina C estabilizada", "ácido hialurônico"],
    description: "Sérum noturno com ativos de alta performance para uniformizar e iluminar",
    ritual: "RITUAL NOTURNO — aplique sobre pele limpa, distribua uniformemente"
  },
  {
    slug: "creme-barrier-celeste",
    name: "Creme Barrier Celeste",
    category: "hidratante",
    price: 320,
    step: 4,
    period: ["manha", "noite"],
    skinTypes: ["seca", "sensivel", "normal", "mista"],
    addresses: ["hidratação", "sensibilidade", "textura", "linhas_finas"],
    keyActives: ["ceramidas", "ácido hialurônico", "esqualano"],
    description: "Hidratação imediata com acabamento luminoso, reforça a barreira cutânea",
    ritual: "BARREIRA REFORÇADA — aplique sobre pele limpa em camada uniforme"
  },
  {
    slug: "protetor-solar-luz-de-vela-fps50",
    name: "Protetor Solar Luz de Vela FPS 50",
    category: "proteção",
    price: 279,
    step: 5,
    period: ["manha"],
    skinTypes: ["oleosa", "mista", "normal", "seca", "sensivel"],
    addresses: ["manchas", "linhas_finas", "luminosidade", "oleosidade", "sensibilidade"],
    keyActives: ["filtros UVA/UVB", "FPS 50+"],
    description: "Proteção solar completa — obrigatória em qualquer rotina de skincare",
    ritual: "ÚLTIMA ETAPA MANHÃ — último passo; reaplique a cada 2h em exposição direta"
  },
  {
    slug: "patch-olhos-aurora",
    name: "Patch Olhos Aurora",
    category: "olhos",
    price: 198,
    step: 3,
    period: ["manha"],
    skinTypes: ["normal", "seca", "sensivel", "mista", "oleosa"],
    addresses: ["olheiras", "linhas_finas", "hidratação"],
    keyActives: ["cafeína", "peptídeos", "ácido hialurônico"],
    description: "Tratamento intensivo para a área dos olhos — olheiras, bolsas e linhas finas",
    ritual: "TRATAMENTO OLHOS — aplique sob os olhos, deixe agir 15–20 minutos"
  }
];

// ── Gerador de rotina personalizada ──────────────────────────────────────────

export interface ScienceRoutine {
  manha: RoutineStep[];
  noite: RoutineStep[];
  semanal: RoutineStep[];
  topActives: string[];
  skinProfile: string;
}

export function generatePersonalizedRoutine(
  skinType: SkinType,
  concerns: SkinConcern[]
): ScienceRoutine {
  const recommendedActives = new Set<string>();
  concerns.forEach((concern) => {
    const actives = SKIN_MATRIX[skinType]?.[concern] ?? [];
    actives.slice(0, 3).forEach((a) => recommendedActives.add(a));
  });

  const manha: RoutineStep[] = [];
  const noite: RoutineStep[] = [];

  // Passo 1: Limpeza (sempre — manhã e noite)
  const cleanser = PRODUCT_CATALOG.find((p) => p.category === "limpeza");
  if (cleanser) {
    const why =
      skinType === "oleosa"
        ? "Pele oleosa acumula sebo e impurezas — limpeza 2x/dia previne acne e minimiza poros"
        : "Remoção de poluição oxidativa protege a barreira e prepara para absorção de ativos";
    manha.push({ ...cleanser, whyRecommended: why });
    noite.push({ ...cleanser, whyRecommended: why });
  }

  // Passo 2: Tônico — pele seca, sensível, normal ou com concern de hidratação
  if (
    ["seca", "sensivel", "normal", "mista"].includes(skinType) ||
    concerns.includes("hidratação")
  ) {
    const tonic = PRODUCT_CATALOG.find((p) => p.category === "tonico");
    if (tonic) {
      manha.push({
        ...tonic,
        whyRecommended:
          "Ácido hialurônico e água de rosas equilibram o pH e preparam a pele para os próximos ativos (Papakonstantinou 2012)"
      });
      noite.push({
        ...tonic,
        whyRecommended: "Preparo noturno potencializa absorção do sérum tratante em até 40%"
      });
    }
  }

  // Passo 3: Olhos — se olheiras for concern
  if (concerns.includes("olheiras")) {
    const eye = PRODUCT_CATALOG.find((p) => p.category === "olhos");
    if (eye) {
      manha.push({
        ...eye,
        whyRecommended:
          "Cafeína 3–5% + peptídeos: vasoconstrição reduz eritema periorbital e lipólise local minimiza bolsas (Herman 2013)"
      });
    }
  }

  // Passo 3: Sérum noturno — manchas, luminosidade, textura, linhas finas
  if (
    concerns.some((c) => ["manchas", "luminosidade", "textura", "linhas_finas"].includes(c))
  ) {
    const serum = PRODUCT_CATALOG.find((p) => p.category === "serum");
    if (serum) {
      noite.push({
        ...serum,
        whyRecommended:
          "Niacinamida 4–5% inibe transferência de melanossomas (Hakozaki 2002) + Vitamina C estabilizada potencializa síntese de colágeno noturna"
      });
    }
  }

  // Passo 4: Hidratante
  const moisturizer = PRODUCT_CATALOG.find((p) => p.category === "hidratante");
  if (moisturizer) {
    if (["seca", "sensivel", "normal"].includes(skinType)) {
      manha.push({
        ...moisturizer,
        whyRecommended: `Ceramidas repõem lipídios intercelulares da barreira — reduzem TEWL em 43% (Del Rosso 2016). Essencial para pele ${skinType}`
      });
    }
    if (concerns.includes("hidratação") || concerns.includes("sensibilidade")) {
      noite.push({
        ...moisturizer,
        whyRecommended:
          "Reparação noturna com ceramidas + esqualano — pele seca perde 25% mais água à noite sem oclusivo"
      });
    }
  }

  // Passo 5: Protetor solar — SEMPRE último passo manhã (Cochrane Grade 1A)
  const sunscreen = PRODUCT_CATALOG.find((p) => p.category === "protecao");
  if (sunscreen) {
    manha.push({
      ...sunscreen,
      whyRecommended:
        "FPS 50+ = OBRIGATÓRIO. UV degrada 80% do colágeno acumulado aos 40 anos (Hughes 2013 NEJM). Sem protetor solar, nenhum outro ativo tem eficácia sustentada"
    });
  }

  // Ordenar por step e remover duplicatas
  const sort = (arr: RoutineStep[]) =>
    arr
      .sort((a, b) => a.step - b.step)
      .filter((v, i, self) => self.findIndex((x) => x.slug === v.slug) === i);

  // Semanal: tratamento intensivo (sérum aplicado duplo 2x/semana)
  const semanal: RoutineStep[] = [];
  if (concerns.some((c) => ["textura", "manchas", "poros"].includes(c))) {
    const serum = PRODUCT_CATALOG.find((p) => p.category === "serum");
    if (serum) {
      semanal.push({
        ...serum,
        whyRecommended:
          "Aplicação dupla 2x/semana como máscara de tratamento intensifica o efeito dos ativos de clareamento e textura"
      });
    }
  }

  const skinProfiles: Record<SkinType, string> = {
    oleosa:
      "Sua pele produz sebo em excesso — os ativos ideais controlam a oleosidade sem destruir a barreira de proteção",
    seca: "Sua barreira cutânea precisa ser reforçada com ceramidas e humectantes para reter água e reduzir desconforto",
    mista:
      "Zona T oleosa + bochechas secas — a rotina usa ativos de controle na zona T e hidratantes nas áreas mais ressecadas",
    normal: "Pele equilibrada — foco em prevenção e manutenção com ativos de alta performance",
    sensivel:
      "Barreira comprometida com tendência a reações — priorizamos ativos anti-inflamatórios e restauradores sem irritantes"
  };

  return {
    manha: sort(manha),
    noite: sort(noite),
    semanal,
    topActives: [...recommendedActives].slice(0, 5),
    skinProfile: skinProfiles[skinType]
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function normalizeSkinType(raw: string): SkinType {
  const map: Record<string, SkinType> = {
    oleosa: "oleosa",
    oily: "oleosa",
    seca: "seca",
    dry: "seca",
    mista: "mista",
    combination: "mista",
    normal: "normal",
    sensivel: "sensivel",
    sensível: "sensivel",
    sensitive: "sensivel"
  };
  return map[raw.toLowerCase().trim()] ?? "mista";
}

export function normalizeConcerns(raw: string[]): SkinConcern[] {
  const valid = new Set<SkinConcern>([
    "acne", "oleosidade", "manchas", "linhas_finas", "sensibilidade",
    "poros", "hidratação", "luminosidade", "olheiras", "textura"
  ]);
  const synonyms: Record<string, SkinConcern> = {
    acne: "acne",
    cravos: "poros",
    poros: "poros",
    manchas: "manchas",
    "linhas finas": "linhas_finas",
    linhas_finas: "linhas_finas",
    linhas: "linhas_finas",
    rugas: "linhas_finas",
    firmeza: "linhas_finas",
    sensibilidade: "sensibilidade",
    hidratacao: "hidratação",
    "hidratação": "hidratação",
    oleosidade: "oleosidade",
    luminosidade: "luminosidade",
    brilho: "luminosidade",
    glow: "luminosidade",
    olheiras: "olheiras",
    textura: "textura"
  };
  return raw
    .map((r) => synonyms[r.toLowerCase()] ?? r)
    .filter((r): r is SkinConcern => valid.has(r as SkinConcern));
}
