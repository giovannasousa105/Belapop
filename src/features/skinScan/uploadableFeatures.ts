// Whitelist FECHADA: só isto pode deixar o dispositivo.
// Regra: escalar derivado ou categoria — nunca imagem, geometria ou vetor de alta dimensão.

export const SKIN_TYPES     = ['seca', 'oleosa', 'mista', 'normal'] as const;
export const CONCERN_VALUES = ['acne', 'manchas', 'barreira', 'antiaging'] as const;
export const QUALITY_FLAGS  = ['ok', 'baixa_luz', 'desfoque'] as const;

export type SkinType    = (typeof SKIN_TYPES)[number];
export type Concern     = (typeof CONCERN_VALUES)[number];
export type QualityFlag = (typeof QUALITY_FLAGS)[number];

export interface UploadableFeatures {
  // Índices de pele — inteiros 0–10, quantizados — SCORE, não mapa
  hydration:      number; // hidratação
  oiliness:       number; // oleosidade / sebo
  texture:        number; // suavidade / textura
  poreVisibility: number; // visibilidade de poros
  redness:        number; // eritema / vermelhidão
  evenness:       number; // uniformidade de tom (score, não mapa de cor)
  fineLines:      number; // linhas finas
  darkSpots:      number; // densidade de hiperpigmentação
  darkCircles:    number; // olheiras
  barrierHealth:  number; // saúde da barreira (composto)

  // Categorias de baixa cardinalidade
  skinType:        SkinType;
  primaryConcerns: Concern[];

  // Metadados (não pessoais)
  modelVersion: string;
  qualityFlag:  QualityFlag;
  createdAt:    string; // ISO; no conjunto coletivo, truncar ao dia
}

export const UPLOADABLE_KEYS: ReadonlyArray<keyof UploadableFeatures> = [
  'hydration', 'oiliness', 'texture', 'poreVisibility', 'redness', 'evenness',
  'fineLines', 'darkSpots', 'darkCircles', 'barrierHealth',
  'skinType', 'primaryConcerns', 'modelVersion', 'qualityFlag', 'createdAt',
];

// RawScanResult é o retorno CRU do modelo. Contém campos PROIBIDOS
// (image, landmarks, embedding, ...) que este módulo jamais lê.
export interface RawScanResult {
  indices?: Partial<Record<
    | 'hydration' | 'oiliness' | 'texture' | 'poreVisibility' | 'redness'
    | 'evenness' | 'fineLines' | 'darkSpots' | 'darkCircles' | 'barrierHealth',
    number
  >>;
  skinType?:       string;
  primaryConcerns?: string[];
  modelVersion?:   string;
  qualityFlag?:    string;
  createdAt?:      string;
  [key: string]: unknown; // campos proibidos podem existir — nunca são copiados
}

const clamp010 = (n: unknown): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return Math.min(10, Math.max(0, Math.round(v)));
};

// Allowlist: constrói um objeto NOVO só com campos permitidos.
// Nunca use spread (...raw) aqui — é o que causaria vazamento.
export function toUploadable(raw: RawScanResult): UploadableFeatures {
  const i = raw.indices ?? {};

  const skinType = (SKIN_TYPES as readonly string[]).includes(raw.skinType ?? '')
    ? (raw.skinType as SkinType)
    : 'normal';

  const qualityFlag = (QUALITY_FLAGS as readonly string[]).includes(raw.qualityFlag ?? '')
    ? (raw.qualityFlag as QualityFlag)
    : 'ok';

  const primaryConcerns = (raw.primaryConcerns ?? []).filter(
    (c): c is Concern => (CONCERN_VALUES as readonly string[]).includes(c),
  );

  return {
    hydration:      clamp010(i.hydration),
    oiliness:       clamp010(i.oiliness),
    texture:        clamp010(i.texture),
    poreVisibility: clamp010(i.poreVisibility),
    redness:        clamp010(i.redness),
    evenness:       clamp010(i.evenness),
    fineLines:      clamp010(i.fineLines),
    darkSpots:      clamp010(i.darkSpots),
    darkCircles:    clamp010(i.darkCircles),
    barrierHealth:  clamp010(i.barrierHealth),
    skinType,
    primaryConcerns,
    modelVersion:   String(raw.modelVersion ?? 'unknown'),
    qualityFlag,
    createdAt:      raw.createdAt ?? new Date().toISOString(),
  };
}

// Guarda de runtime: chame ANTES de qualquer upload/serialização.
// Se lançar, abortar o upload e logar SEM o payload.
export function assertUploadable(obj: unknown): asserts obj is UploadableFeatures {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("UploadableFeatures: payload deve ser um objeto.");
  }
  const extra = Object.keys(obj as Record<string, unknown>).filter(
    (k) => !(UPLOADABLE_KEYS as readonly string[]).includes(k),
  );
  if (extra.length > 0) {
    throw new Error(`UploadableFeatures: campos não permitidos: ${extra.join(', ')}`);
  }
}
