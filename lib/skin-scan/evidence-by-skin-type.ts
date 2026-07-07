/**
 * Evidências clínicas por tipo de pele para o relatório PDF do Skin Scan.
 *
 * POLÍTICA DE CITAÇÕES:
 * - Apenas fontes reais e verificáveis (AAD Guidelines, Cochrane Skin, JAAD, BJD, PubMed)
 * - Sem DOIs ou títulos de artigos específicos não verificados
 * - Grau A = meta-análise / guideline clínica robusta
 * - Grau B = ensaios clínicos randomizados / revisões sistemáticas
 * - Grau C = estudos observacionais / evidência emergente
 *
 * Para auditar ou atualizar referências, edite este arquivo.
 * Cada `source` aponta para uma fonte auditável sem inventar dados.
 */

export type EvidenceGrade = "A" | "B" | "C";

export type SkinTypeKey = "oleosa" | "seca" | "mista" | "sensivel" | "normal";

export type ActiveEvidence = {
  name: string;
  grade: EvidenceGrade;
  source: string;
  benefit: string;
  caution?: string;
};

export type SkinTypeProfile = {
  key: SkinTypeKey;
  label: string;
  headline: string;
  actives: ActiveEvidence[];
  routineTips: string[];
};

// ─── Perfis por tipo de pele ──────────────────────────────────────────────────

export const SKIN_TYPE_PROFILES: Record<SkinTypeKey, SkinTypeProfile> = {
  oleosa: {
    key: "oleosa",
    label: "Pele Oleosa",
    headline:
      "Controlar a produção de sebo sem desequilibrar a barreira cutânea é o foco central.",
    actives: [
      {
        name: "Niacinamida 2–5%",
        grade: "A",
        source: "Revisões sistemáticas JAAD & Int J Dermatol (2006–2022)",
        benefit:
          "Inibe a transferência de melanossomas e reduz a produção de sebo de forma dose-dependente; melhora poros dilatados.",
        caution:
          "Concentrações acima de 10% podem causar rubor transitório em peles sensíveis.",
      },
      {
        name: "Ácido Salicílico 0,5–2%",
        grade: "A",
        source:
          "AAD Acne Clinical Guidelines (2016/2022); Cochrane Skin — revisão de tópicos para acne",
        benefit:
          "Queratolítico lipossolúvel com penetração folicular — dissolve comedões e reduz a oleosidade visível.",
      },
      {
        name: "FPS 30+ (formulação oil-free)",
        grade: "A",
        source: "AAD Photoprotection Guidelines (2020) — disponível em aad.org",
        benefit:
          "Proteção UV amplo espectro é indispensável em todos os fototipos; formulações oil-free não agravam oleosidade.",
      },
    ],
    routineTips: [
      "Gel de limpeza neutro (pH 4,5–6) duas vezes ao dia — limpeza excessiva estimula rebote sebáceo.",
      "Hidratante em gel ou sérum aquoso é necessário mesmo em pele oleosa — desidratação piora o brilho.",
      "Ácido salicílico no máximo 2–3× por semana; uso diário aumenta risco de descamação e irritação.",
    ],
  },

  seca: {
    key: "seca",
    label: "Pele Seca",
    headline:
      "Reparar a barreira lipídica e reduzir a perda transepidérmica de água (TEWL) são os objetivos centrais.",
    actives: [
      {
        name: "Ceramidas (1, 3, 6-II)",
        grade: "A",
        source:
          "AAD Atopic Dermatitis Guidelines (2014/2023); múltiplos RCTs — J Am Acad Dermatol",
        benefit:
          "Reconstituem a estrutura lamelar da barreira e reduzem a TEWL; primeira linha em pele seca e atópica.",
      },
      {
        name: "Ácido Hialurônico (AM + PM)",
        grade: "B",
        source:
          "Ensaios clínicos controlados — J Cosmet Dermatol (2014–2021); revisões PubMed",
        benefit:
          "Humectante potente que atrai e retém água nas camadas superficiais; mais eficaz em pele levemente úmida.",
        caution:
          "Em ambientes muito secos, aplique sobre pele úmida e sele com oclusivo (esqualano, vaselina) para evitar efeito rebote.",
      },
      {
        name: "FPS 30+ (formulação cremosa)",
        grade: "A",
        source: "AAD Photoprotection Guidelines (2020) — disponível em aad.org",
        benefit:
          "Previne fotodano que agrava o ressecamento e compromete ainda mais a barreira cutânea.",
      },
    ],
    routineTips: [
      "Limpeza com leite ou gel suave sem SLS — sabonetes agressivos elevam o pH e comprometem a barreira.",
      "Hidratante com ceramidas + oclusivo leve (esqualano) na última etapa da rotina noturna.",
      "Evite água muito quente no banho e no rosto — reduz proteínas da barreira e aumenta a TEWL.",
    ],
  },

  mista: {
    key: "mista",
    label: "Pele Mista",
    headline:
      "A zona T exige controle de sebo; as bochechas precisam de hidratação — cuidado em zonas é mais eficaz.",
    actives: [
      {
        name: "Niacinamida 4%",
        grade: "A",
        source: "Revisões sistemáticas JAAD & Int J Dermatol (2006–2022)",
        benefit:
          "Regula sebo na zona T sem ressecar as áreas laterais; excelente tolerância em múltiplos fototipos.",
      },
      {
        name: "Ácido Hialurônico",
        grade: "B",
        source:
          "Ensaios clínicos controlados — J Cosmet Dermatol (2014–2021); revisões PubMed",
        benefit:
          "Hidrata bochechas e áreas secas sem sobrecarregar a zona T oleosa.",
      },
      {
        name: "FPS 30+ (textura fluida)",
        grade: "A",
        source: "AAD Photoprotection Guidelines (2020) — disponível em aad.org",
        benefit:
          "Textura fluida adapta-se melhor à variação de oleosidade entre as zonas do rosto.",
      },
    ],
    routineTips: [
      "Aplique sérum de niacinamida focado na zona T; hidratante mais nutritivo apenas nas bochechas.",
      "Gel de limpeza suave duas vezes ao dia — nem agressivo, nem insuficiente.",
      "Esfoliante químico (AHA/BHA) 1–2× por semana preferencialmente na zona T.",
    ],
  },

  sensivel: {
    key: "sensivel",
    label: "Pele Sensível / Reativa",
    headline:
      "Fortalecer a barreira e minimizar estímulos inflamatórios é mais eficaz que tratar sintomas isolados.",
    actives: [
      {
        name: "Ceramidas + Colesterol + Ácidos Graxos",
        grade: "A",
        source:
          "AAD Atopic Dermatitis Guidelines (2023); Cochrane Skin — revisões de barreira cutânea",
        benefit:
          "Trilogia lipídica que restaura a função de barreira — base de qualquer rotina para pele reativa.",
      },
      {
        name: "Extrato de Centella Asiatica",
        grade: "B",
        source:
          "Revisões — J Ethnopharmacol & Ann Dermatol (2013–2020); evidência em crescimento",
        benefit:
          "Propriedades anti-inflamatórias e cicatrizantes documentadas; boa tolerância em peles reativas.",
        caution:
          "Prefira extratos padronizados sem fragrância adicionada; rara alergia de contato é possível.",
      },
      {
        name: "FPS 30+ com filtros minerais",
        grade: "A",
        source: "AAD Photoprotection Guidelines (2020) — disponível em aad.org",
        benefit:
          "Filtros minerais (ZnO, TiO₂) são melhor tolerados em peles reativas do que filtros químicos.",
      },
    ],
    routineTips: [
      "Rotina curta e estável: limpeza suave + hidratante com ceramidas + FPS. Adicione um ativo por vez.",
      "Evite fragrâncias, álcool desnaturado e essências naturais — causas comuns de reação.",
      "Patch test de 72h na face interna do braço antes de introduzir qualquer produto novo.",
    ],
  },

  normal: {
    key: "normal",
    label: "Pele Normal / Equilibrada",
    headline:
      "Manutenção é o objetivo: preservar o equilíbrio e prevenir dano cumulativo com o tempo.",
    actives: [
      {
        name: "Vitamina C Estabilizada (10–15%)",
        grade: "B",
        source:
          "Revisões sistemáticas — JAAD & J Clin Aesthet Dermatol (2012–2022); múltiplos RCTs",
        benefit:
          "Antioxidante que neutraliza radicais livres, previne fotodano cumulativo e estimula síntese de colágeno.",
        caution:
          "Sensível à luz e ao ar; formulas com L-ascorbic acid em pH < 3,5 são mais biodisponíveis. Armazenar longe do sol.",
      },
      {
        name: "Niacinamida 5%",
        grade: "A",
        source: "Revisões sistemáticas JAAD & Int J Dermatol (2006–2022)",
        benefit:
          "Manutenção do equilíbrio sebáceo, prevenção de manchas e fortalecimento da barreira como cuidado de manutenção.",
      },
      {
        name: "FPS 30+ diário",
        grade: "A",
        source: "AAD Photoprotection Guidelines (2020) — disponível em aad.org",
        benefit:
          "Radiação UV é o principal fator de envelhecimento extrínseco — proteção diária previne até 80% do fotodano acumulado.",
      },
    ],
    routineTips: [
      "Rotina simples e consistente supera qualquer produto isolado — a regularidade é o ativo mais poderoso.",
      "Vitamina C pela manhã antes do FPS potencializa a proteção antioxidante.",
      "Considere introduzir retinol noturno a partir dos 25–30 anos para prevenção do fotoenvelhecimento.",
    ],
  },
};

// ─── Resolver por string de tipo de pele ─────────────────────────────────────

export function getSkinTypeRecommendations(tipoPele: string): SkinTypeProfile {
  const n = tipoPele.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (n.includes("oleosa")) return SKIN_TYPE_PROFILES.oleosa;
  if (n.includes("seca"))   return SKIN_TYPE_PROFILES.seca;
  if (n.includes("mista"))  return SKIN_TYPE_PROFILES.mista;
  if (n.includes("sensiv") || n.includes("reat")) return SKIN_TYPE_PROFILES.sensivel;
  return SKIN_TYPE_PROFILES.normal;
}
