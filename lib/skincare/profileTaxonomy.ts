import type { SkinConcernOption, SkinToneOption, SkinTypeOption } from "@/lib/skincare/routine";

const SKIN_TYPE_COPY: Record<string, { name: string; description: string }> = {
  normal: {
    name: "Normal ou equilibrada",
    description: "Costuma ficar estavel ao longo do dia, sem excesso importante de oleosidade ou ressecamento."
  },
  oily: {
    name: "Oleosa",
    description: "Produz mais oleosidade, com brilho frequente e maior chance de poros aparentes ou acne."
  },
  dry: {
    name: "Seca",
    description: "Pode repuxar, descamar ou perder conforto com facilidade, principalmente apos a limpeza."
  },
  combination: {
    name: "Mista",
    description: "Geralmente tem mais oleosidade na zona T e mais ressecamento ou conforto reduzido em outras areas."
  },
  sensitive: {
    name: "Sensivel",
    description: "Reage mais facil com ardor, vermelhidao ou desconforto quando a barreira da pele fica fragilizada."
  },
  acne_prone: {
    name: "Com tendencia a acne",
    description: "Tem maior facilidade para desenvolver cravos, espinhas e inflamacao, mesmo em fases de melhora."
  }
};

const SKIN_TONE_COPY: Record<string, { name: string; description: string }> = {
  fair: {
    name: "Pele clara",
    description: "Ajuda a calibrar leitura de vermelhidao, fotossensibilidade e marcadores visuais de manchas."
  },
  medium: {
    name: "Tom medio",
    description: "Importante para ajustar recomendacoes de fotoprotecao e leitura de manchas ou textura."
  },
  tan: {
    name: "Pele morena",
    description: "Ajuda a observar melhor marcacoes pos-inflamatorias e necessidades de uniformizacao do tom."
  },
  deep: {
    name: "Pele negra",
    description: "Importante para priorizar fotoprotecao, leitura de hiperpigmentacao e cuidado com a barreira."
  },
  rich: {
    name: "Pele retinta",
    description: "Refina a leitura de manchas, inflamacao e respostas pos-procedimento com foco em seguranca de rotina."
  }
};

const CONCERN_COPY: Record<string, { name: string; description: string }> = {
  acne: {
    name: "Acne e cravos",
    description: "Para quem quer controlar inflamacao, cravos, espinhas e marcas recentes."
  },
  oiliness: {
    name: "Oleosidade excessiva",
    description: "Foco em brilho, controle de sebo e sensacao de pele pesada ao longo do dia."
  },
  visible_pores: {
    name: "Poros aparentes",
    description: "Para melhorar textura, poros dilatados e acabamento da pele."
  },
  dark_spots: {
    name: "Manchas e marcas",
    description: "Inclui manchas de acne, marcas pos-inflamatorias e tom irregular."
  },
  dehydration: {
    name: "Desidratacao",
    description: "Para pele opaca, desconfortavel, com perda de viço e sensacao de repuxamento."
  },
  barrier_damage: {
    name: "Barreira sensibilizada",
    description: "Para pele fragilizada, com ardor, irritacao ou desconforto facil."
  },
  rosacea: {
    name: "Vermelhidao e rosacea",
    description: "Quando a pele fica ruborizada, mais reativa ou com desconforto persistente."
  },
  aging: {
    name: "Linhas finas e firmeza",
    description: "Foco em textura, elasticidade, linhas de expressao e suporte da pele."
  },
  uneven_texture: {
    name: "Textura irregular",
    description: "Para pele sem uniformidade ao toque, com relevo irregular ou acabamento opaco."
  },
  under_eye: {
    name: "Olheiras e area dos olhos",
    description: "Cuida de aspecto cansado, linhas finas e ressecamento na regiao dos olhos."
  }
};

function normalizeSlug(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replaceAll("-", "_");
}

export function normalizeSkinTypeOption(option: SkinTypeOption): SkinTypeOption {
  const copy = SKIN_TYPE_COPY[normalizeSlug(option.slug || option.name)];
  return copy
    ? {
        ...option,
        name: copy.name,
        description: copy.description
      }
    : option;
}

export function normalizeSkinToneOption(option: SkinToneOption): SkinToneOption {
  const copy = SKIN_TONE_COPY[normalizeSlug(option.slug || option.name)];
  return copy
    ? {
        ...option,
        name: copy.name,
        description: copy.description
      }
    : option;
}

export function normalizeSkinConcernOption(option: SkinConcernOption): SkinConcernOption {
  const copy = CONCERN_COPY[normalizeSlug(option.slug || option.name)];
  return copy
    ? {
        ...option,
        name: copy.name,
        description: copy.description
      }
    : option;
}

export function normalizeSkinTypeOptions(options: SkinTypeOption[]) {
  return options.map(normalizeSkinTypeOption);
}

export function normalizeSkinToneOptions(options: SkinToneOption[]) {
  return options.map(normalizeSkinToneOption);
}

export function normalizeSkinConcernOptions(options: SkinConcernOption[]) {
  return options.map(normalizeSkinConcernOption);
}
