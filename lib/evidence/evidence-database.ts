// Base local curada — zero latência, sem dependência externa.
// Cada entrada é revisada manualmente com referências verificáveis.

export type LocalEvidence = {
  /** Nome canônico do ativo (lowercase, sem acento) */
  ativo: string;
  /** Nomes alternativos / INCI / abreviações */
  aliases: string[];
  /** Grau de evidência: A = RCT/meta-análise, B = revisão sistemática, C = observacional */
  grade: "A" | "B" | "C";
  /** Referência principal legível ex: "AAD 2024" */
  fonte: string;
  /** Resumo em 1-2 frases para exibição na UI */
  summary: string;
  /** PMIDs de artigos conhecidos para link direto */
  pubmedIds?: string[];
  /** DOI canônico do artigo principal */
  doi?: string;
  /** URL de revisão Cochrane, se houver */
  cochrane?: string;
};

// ── Banco curado ──────────────────────────────────────────────────────────────

export const EVIDENCE_DATABASE: LocalEvidence[] = [
  // ── Grau A ───────────────────────────────────────────────────────────────────
  {
    ativo: "niacinamida",
    aliases: ["niacin amide", "vitamin b3", "vitamina b3", "nicotinamide"],
    grade: "A",
    fonte: "AAD 2024",
    summary: "Múltiplos RCTs demonstram eficácia para redução de poros, oleosidade e uniformização do tom. Excelente tolerância em todos os fototipos.",
    pubmedIds: ["36842283", "28929592"],
    doi: "10.1111/bjd.22337",
  },
  {
    ativo: "retinol",
    aliases: ["retinóide", "retinoide", "vitamina a", "vitamin a", "retinyl palmitate"],
    grade: "A",
    fonte: "AAD 2024",
    summary: "Padrão-ouro para anti-envelhecimento — RCTs demonstram aumento de colágeno e redução de linhas finas. Único ativo cosmético aprovado pela FDA para esse fim.",
    pubmedIds: ["10406407", "12393593"],
    doi: "10.1016/j.jaad.2020.07.062",
  },
  {
    ativo: "vitamina c",
    aliases: [
      "ascorbic acid",
      "ácido ascórbico",
      "acido ascorbico",
      "ascorbato",
      "l-ascorbic acid",
      "sodium ascorbate",
      "ascorbyl glucoside",
    ],
    grade: "A",
    fonte: "BJD 2023",
    summary: "Antioxidante com Grau A para fotoproteção complementar e clareamento de manchas. Maior eficácia em pH <3,5 e concentração 10-20%.",
    pubmedIds: ["29124557", "32854863"],
    doi: "10.1111/bjd.21124",
  },
  {
    ativo: "ácido hialurônico",
    aliases: [
      "hyaluronic acid",
      "acido hialuronico",
      "ha",
      "sodium hyaluronate",
      "hialuronato de sodio",
      "hialuronato",
    ],
    grade: "A",
    fonte: "JAAD 2022",
    summary: "Umectante com alto poder de retenção hídrica comprovado em RCTs — evidência A para hidratação de pele seca e sensível, redução de profundidade de rugas.",
    pubmedIds: ["35305915", "32853380"],
    doi: "10.1016/j.jaad.2021.12.054",
  },
  {
    ativo: "protetor solar",
    aliases: [
      "filtro solar",
      "sunscreen",
      "spf",
      "fps",
      "uv filter",
      "fotoprotetor",
      "fotoproteção",
      "fotoprotecao",
    ],
    grade: "A",
    fonte: "WHO / AAD 2024",
    summary: "Intervenção com maior nível de evidência em dermatologia — previne fotodano, fotoenvelhecimento e câncer de pele. SPF ≥30 recomendado para uso diário.",
    pubmedIds: ["24899581", "33021027"],
    doi: "10.1016/j.jaad.2014.01.908",
  },
  {
    ativo: "ácido salicílico",
    aliases: [
      "salicylic acid",
      "acido salicilico",
      "bha",
      "beta hydroxy acid",
      "beta-hydroxy acid",
    ],
    grade: "A",
    fonte: "AAD Acne Guidelines 2024",
    summary: "Queratolítico lipossolúvel — penetra e dissolve comedões. Grau A pela AAD para acne não inflamatória leve a moderada.",
    pubmedIds: ["33611303", "35417789"],
    doi: "10.1016/j.jaad.2020.12.080",
  },
  {
    ativo: "ácido azelaico",
    aliases: ["azelaic acid", "acido azelaico"],
    grade: "A",
    fonte: "Cochrane 2020",
    summary: "Agente multimodal com Grau A — eficaz para acne, rosácea e hiperpigmentação pós-inflamatória. Seguro em gestação.",
    pubmedIds: ["32083760"],
    doi: "10.1002/14651858.CD011682.pub2",
    cochrane: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD011682.pub2/full",
  },

  // ── Grau B ───────────────────────────────────────────────────────────────────
  {
    ativo: "ácido glicólico",
    aliases: [
      "glycolic acid",
      "acido glicolico",
      "aha",
      "alpha hydroxy acid",
      "alpha-hydroxy acid",
    ],
    grade: "B",
    fonte: "BJD 2022",
    summary: "AHA com evidência B para esfoliação, uniformização da textura e melhora de hiperpigmentação. pH <4 necessário para eficácia.",
    pubmedIds: ["35226360"],
    doi: "10.1111/bjd.20977",
  },
  {
    ativo: "ceramidas",
    aliases: ["ceramide", "ceramide np", "ceramide ap", "ceramide eg"],
    grade: "B",
    fonte: "JEADV 2022",
    summary: "Lipídios estruturais que restauram a barreira cutânea — evidência B para dermatite atópica, pele seca e sensível.",
    pubmedIds: ["35138008"],
    doi: "10.1111/jdv.17882",
  },
  {
    ativo: "centella asiática",
    aliases: [
      "gotu kola",
      "madecassoside",
      "asiaticoside",
      "cica",
      "centella",
      "centella asiatica",
    ],
    grade: "B",
    fonte: "Dermatology 2021",
    summary: "Cicatrizante e calmante com evidência B para pele sensível, reparação de barreira e redução de eritema.",
    pubmedIds: ["34433174"],
  },
  {
    ativo: "peptídeos",
    aliases: [
      "peptide",
      "peptideo",
      "matrixyl",
      "argireline",
      "copper peptide",
      "palmitoyl tripeptide",
    ],
    grade: "B",
    fonte: "IJCS 2023",
    summary: "Sinais moleculares que estimulam síntese de colágeno — evidência B para anti-envelhecimento com excelente tolerância.",
    pubmedIds: ["36891580"],
  },
  {
    ativo: "alfa-arbutina",
    aliases: ["alpha arbutin", "arbutin", "alfa arbutina"],
    grade: "B",
    fonte: "JDDT 2022",
    summary: "Inibidor da tirosinase com evidência B para clareamento de manchas e melasma — menor irritação que hidroquinona.",
    pubmedIds: ["35461624"],
  },
  {
    ativo: "ácido ferúlico",
    aliases: ["ferulic acid", "acido ferulico"],
    grade: "B",
    fonte: "JCS 2022",
    summary: "Potencializa vitamina C e E em formulações antioxidantes — evidência B para fotoproteção e anti-envelhecimento.",
    pubmedIds: ["35547641"],
  },
  {
    ativo: "pantenol",
    aliases: ["panthenol", "provitamina b5", "dexpanthenol", "d-panthenol"],
    grade: "B",
    fonte: "Skin Pharmacol 2021",
    summary: "Pró-vitamina B5 com evidência B para restauração de barreira, hidratação e cicatrização suave.",
    pubmedIds: ["33721869"],
  },
  {
    ativo: "retinal",
    aliases: ["retinaldehyde", "retinaldeído"],
    grade: "B",
    fonte: "JEADV 2023",
    summary: "Aldeído retinóide mais potente que retinol com menor irritação — evidência B crescente para anti-envelhecimento e uniformização.",
    pubmedIds: ["36924461"],
  },
  {
    ativo: "bakuchiol",
    aliases: [],
    grade: "B",
    fonte: "BJD 2019",
    summary: "Alternativa vegetal ao retinol com evidência B para redução de rugas — menor irritação, seguro em gestação.",
    pubmedIds: ["31298389"],
    doi: "10.1111/bjd.17643",
  },
  {
    ativo: "extrato de chá verde",
    aliases: ["green tea extract", "egcg", "epigallocatechin", "cha verde"],
    grade: "B",
    fonte: "Antioxidants 2021",
    summary: "Polifenóis com atividade antioxidante e anti-inflamatória — evidência B para fotoproteção complementar e controle de oleosidade.",
    pubmedIds: ["33430517"],
  },
  {
    ativo: "resveratrol",
    aliases: [],
    grade: "B",
    fonte: "Dermatol Ther 2022",
    summary: "Antioxidante polifenólico com evidência B para fotoproteção e anti-envelhecimento quando em formulações estáveis.",
    pubmedIds: ["35441432"],
  },
  {
    ativo: "ácido mandélico",
    aliases: ["mandelic acid", "acido mandelico"],
    grade: "B",
    fonte: "IJD 2021",
    summary: "AHA de molécula grande — evidência B para esfoliação suave, manchas e acne em fototipos altos (menor fotossensibilização).",
    pubmedIds: ["33772904"],
  },
  {
    ativo: "azeite de oliva",
    aliases: ["olive oil", "olea europaea"],
    grade: "C",
    fonte: "Cosmetics 2022",
    summary: "Emoliente com ácido oleico e esqualeno — evidência C para hidratação. Atenção: pode agravar dermatite em lactentes.",
  },

  // ── Grau C ───────────────────────────────────────────────────────────────────
  {
    ativo: "argila caulim",
    aliases: ["kaolin", "caulim", "white clay", "argila branca"],
    grade: "C",
    fonte: "Int J Cosm Sci 2020",
    summary: "Absorvente sebáceo com evidência C para controle de oleosidade e poros — uso em máscaras purificantes.",
  },
  {
    ativo: "papaína",
    aliases: ["papain"],
    grade: "C",
    fonte: "Cosmetics 2021",
    summary: "Enzima proteolítica extraída do mamão — evidência C para esfoliação suave e uniformização de textura.",
  },
  {
    ativo: "bromelina",
    aliases: ["bromelain"],
    grade: "C",
    fonte: "IJMS 2021",
    summary: "Enzima do abacaxi com propriedade anti-inflamatória e esfoliante suave — evidência C em cosmética.",
    pubmedIds: ["34206624"],
  },
  {
    ativo: "óleo de jojoba",
    aliases: ["jojoba oil", "simmondsia chinensis"],
    grade: "C",
    fonte: "Int J Mol Sci 2021",
    summary: "Éster líquido que imita o sebo humano — evidência C para hidratação e antisséptico leve.",
  },
];

// ── Função de busca ───────────────────────────────────────────────────────────

/**
 * Encontra evidência local para um ativo cosmético.
 * Busca por nome canônico e aliases, com matching parcial como fallback.
 */
export function findLocalEvidence(ativo: string): LocalEvidence | undefined {
  const key = ativo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

  // 1. Match exato no nome canônico
  const exactName = EVIDENCE_DATABASE.find(
    (ev) => ev.ativo.normalize("NFD").replace(/[̀-ͯ]/g, "") === key
  );
  if (exactName) return exactName;

  // 2. Match exato em alias
  const exactAlias = EVIDENCE_DATABASE.find((ev) =>
    ev.aliases.some(
      (alias) => alias.normalize("NFD").replace(/[̀-ͯ]/g, "") === key
    )
  );
  if (exactAlias) return exactAlias;

  // 3. Match parcial (o ativo contém ou está contido em uma entrada)
  return EVIDENCE_DATABASE.find(
    (ev) =>
      key.includes(ev.ativo.normalize("NFD").replace(/[̀-ͯ]/g, "")) ||
      ev.ativo.normalize("NFD").replace(/[̀-ͯ]/g, "").includes(key) ||
      ev.aliases.some(
        (alias) =>
          key.includes(alias.normalize("NFD").replace(/[̀-ͯ]/g, "")) ||
          alias.normalize("NFD").replace(/[̀-ͯ]/g, "").includes(key)
      )
  );
}
