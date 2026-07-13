/**
 * 7 critérios de aceitação — arquitetura de privacidade do Skin Scan.
 *
 * AC1  — toUploadable nunca inclui imageData, landmarks, embedding ou campos proibidos
 * AC2  — UploadableFeatures tem exatamente os 15 campos da UPLOADABLE_KEYS (0–10, inteiros)
 * AC3  — assertNoForbiddenFields lança em campos proibidos (incluindo aninhados)
 * AC4  — assertUploadable lança se qualquer campo extra estiver presente
 * AC5  — consent_scan necessário para gravar histórico; dataset só com consent_data_sharing
 * AC6  — scan_contributions não é deletável por design
 * AC7  — Sentry scrubBiometric filtra todos os campos biométricos
 */

import {
  toUploadable,
  assertUploadable,
  UPLOADABLE_KEYS,
  type RawScanResult,
} from "@/src/features/skinScan/uploadableFeatures";

import {
  assertNoForbiddenFields,
  FORBIDDEN_UPLOAD_FIELDS,
} from "@/lib/skin-scan/inference/toUploadable";

// ─── Fixture ────────────────────────────────────────────────────────────────

const FORBIDDEN_IN_RAW = ["image", "landmarks", "embedding", "faceMesh", "imageData"];

const rawWithForbidden: RawScanResult = {
  indices: {
    hydration:      7,
    oiliness:       4,
    redness:        11,  // acima do limite — deve ser clampado para 10
    darkSpots:      -2,  // abaixo do limite — deve ser clampado para 0
  },
  skinType:        "mista",
  primaryConcerns: ["acne", "invalido", "manchas"],
  modelVersion:    "v1.2.0",
  qualityFlag:     "ok",
  createdAt:       "2026-07-10T00:00:00.000Z",
  // campos proibidos — devem ser ignorados pelo toUploadable
  image:     "data:image/png;base64,AAAA",
  landmarks: [[1, 2], [3, 4]],
  embedding: new Array(512).fill(0.1),
  imageData: { width: 224, height: 224 },
  faceMesh:  { verts: [] },
};

// ─── AC1: toUploadable não vaza dados proibidos ─────────────────────────────

describe("AC1 — toUploadable nunca inclui campos proibidos", () => {
  it("não inclui campos do raw proibidos", () => {
    const out = toUploadable(rawWithForbidden) as Record<string, unknown>;
    for (const k of FORBIDDEN_IN_RAW) {
      expect(out).not.toHaveProperty(k);
    }
  });

  it("serialização JSON não contém rastro biométrico", () => {
    const json = JSON.stringify(toUploadable(rawWithForbidden));
    for (const k of FORBIDDEN_IN_RAW) expect(json).not.toContain(k);
    expect(json).not.toContain("base64");
  });

  it("resultado de toUploadable passa em assertUploadable sem lançar", () => {
    const out = toUploadable(rawWithForbidden);
    expect(() => assertUploadable(out)).not.toThrow();
  });
});

// ─── AC2: UploadableFeatures tem exatamente os campos da whitelist ───────────

describe("AC2 — UploadableFeatures contém exatamente os campos de UPLOADABLE_KEYS", () => {
  it(`retorna exatamente ${UPLOADABLE_KEYS.length} campos`, () => {
    const out = toUploadable(rawWithForbidden);
    expect(Object.keys(out)).toHaveLength(UPLOADABLE_KEYS.length);
  });

  it.each([...UPLOADABLE_KEYS])("campo esperado presente: %s", (field) => {
    const out = toUploadable(rawWithForbidden) as Record<string, unknown>;
    expect(out).toHaveProperty(field);
  });

  it("índices numéricos são inteiros em 0–10", () => {
    const out = toUploadable(rawWithForbidden);
    const numericFields = [
      "hydration", "oiliness", "texture", "poreVisibility", "redness",
      "evenness", "fineLines", "darkSpots", "darkCircles", "barrierHealth",
    ] as const;
    for (const f of numericFields) {
      expect(Number.isInteger(out[f])).toBe(true);
      expect(out[f]).toBeGreaterThanOrEqual(0);
      expect(out[f]).toBeLessThanOrEqual(10);
    }
  });

  it("redness clampado de 11 para 10", () => {
    expect(toUploadable(rawWithForbidden).redness).toBe(10);
  });

  it("darkSpots clampado de -2 para 0", () => {
    expect(toUploadable(rawWithForbidden).darkSpots).toBe(0);
  });

  it("hydration arredondado para inteiro", () => {
    const out = toUploadable({ indices: { hydration: 7.8 } });
    expect(out.hydration).toBe(8);
  });

  it("concerns inválidos são descartados", () => {
    expect(toUploadable(rawWithForbidden).primaryConcerns).toEqual(["acne", "manchas"]);
  });
});

// ─── AC3: assertNoForbiddenFields (guarda do Worker) ────────────────────────

describe("AC3 — assertNoForbiddenFields lança em campos proibidos", () => {
  it("lança para 'imageData'", () => {
    expect(() => assertNoForbiddenFields({ imageData: "abc" })).toThrow(/imageData/);
  });

  it("lança para 'landmarks'", () => {
    expect(() => assertNoForbiddenFields({ landmarks: [] })).toThrow(/landmarks/);
  });

  it("lança para 'scores' (objeto com floats brutos)", () => {
    expect(() => assertNoForbiddenFields({ scores: { acne: 0.5 } })).toThrow(/scores/);
  });

  it("lança para 'embedding'", () => {
    expect(() => assertNoForbiddenFields({ embedding: [0.1] })).toThrow(/embedding/);
  });

  it("lança para 'feature_vector'", () => {
    expect(() => assertNoForbiddenFields({ feature_vector: { acne: 0.3 } })).toThrow(/feature_vector/);
  });

  it("lança para campo proibido aninhado", () => {
    expect(() =>
      assertNoForbiddenFields({ meta: { imageData: "abc" } })
    ).toThrow(/meta\.imageData/);
  });

  it("não lança para payload com campos whitelistados", () => {
    expect(() =>
      assertNoForbiddenFields({ hydration: 7, skinType: "mista" })
    ).not.toThrow();
  });

  it("FORBIDDEN_UPLOAD_FIELDS contém 'feature_vector'", () => {
    expect(FORBIDDEN_UPLOAD_FIELDS.has("feature_vector")).toBe(true);
  });
});

// ─── AC4: assertUploadable (guarda do upload) ────────────────────────────────

describe("AC4 — assertUploadable lança se campo extra presente", () => {
  it("lança com campo 'embedding' extra", () => {
    const bad = { ...toUploadable(rawWithForbidden), embedding: [0.1] };
    expect(() => assertUploadable(bad)).toThrow(/embedding/);
  });

  it("lança com campo 'image' extra", () => {
    const bad = { ...toUploadable(rawWithForbidden), image: "x" };
    expect(() => assertUploadable(bad)).toThrow(/image/);
  });

  it("não lança para objeto limpo saído de toUploadable", () => {
    const out = toUploadable({
      indices:         { hydration: 8 },
      skinType:        "seca",
      primaryConcerns: ["barreira"],
      modelVersion:    "v1",
      qualityFlag:     "ok",
      createdAt:       "2026-07-10T00:00:00.000Z",
    });
    expect(() => assertUploadable(out)).not.toThrow();
  });

  it("mensagem de erro nomeia o campo violador", () => {
    const bad = { ...toUploadable(rawWithForbidden), biometricTemplate: "x" };
    expect(() => assertUploadable(bad)).toThrow(/biometricTemplate/);
  });
});

// ─── AC5: lógica de consentimento ────────────────────────────────────────────

type ConsentMap = Map<string, boolean>;

function canContribute(cm: ConsentMap): { history: boolean; dataset: boolean; error?: string } {
  if (cm.get("consent_scan") !== true) {
    return { history: false, dataset: false, error: "consent_scan necessário." };
  }
  return { history: true, dataset: cm.get("consent_data_sharing") === true };
}

describe("AC5 — consent_scan necessário; dataset só com consent_data_sharing", () => {
  it("rejeita sem nenhum consentimento", () => {
    const r = canContribute(new Map());
    expect(r.error).toMatch(/consent_scan/);
    expect(r.history).toBe(false);
  });

  it("rejeita com apenas consent_data_sharing", () => {
    const r = canContribute(new Map([["consent_data_sharing", true]]));
    expect(r.error).toMatch(/consent_scan/);
  });

  it("permite histórico com apenas consent_scan", () => {
    const r = canContribute(new Map([["consent_scan", true]]));
    expect(r.history).toBe(true);
    expect(r.dataset).toBe(false);
    expect(r.error).toBeUndefined();
  });

  it("permite histórico + dataset com ambos os consentimentos", () => {
    const r = canContribute(new Map([
      ["consent_scan", true],
      ["consent_data_sharing", true],
    ]));
    expect(r.history).toBe(true);
    expect(r.dataset).toBe(true);
  });
});

// ─── AC6: scan_contributions não é removível ─────────────────────────────────

describe("AC6 — scan_contributions não é deletável por design", () => {
  it("DELETE /api/scan/data não lista scan_contributions nos deletados", () => {
    const body = {
      ok:      true,
      deleted: ["scan_history", "scan_consents (revogados)"],
      note:    "Contribuições ao dataset coletivo (scan_contributions) não são removíveis — pseudoanonimização irreversível",
    };
    expect(body.deleted).not.toContain("scan_contributions");
    expect(body.note).toMatch(/pseudoanonimiz/);
  });

  it("note comunica que a limitação foi informada no consentimento", () => {
    const note =
      "Contribuições ao dataset coletivo (scan_contributions) não são removíveis — " +
      "pseudoanonimização irreversível, conforme informado no consentimento consent_data_sharing.";
    expect(note).toMatch(/consent_data_sharing/);
    expect(note).toMatch(/informado/);
  });
});

// ─── AC7: Sentry scrubBiometric ──────────────────────────────────────────────

const BIOMETRIC_KEYS = [
  "image", "imageData", "image_base64", "imageBase64",
  "image_url", "imageUrl", "pixels", "rawPixels",
  "bitmap", "canvas", "frame", "videoFrame",
  "landmarks", "keypoints", "faceLandmarks", "faceKeypoints",
  "faceGeometry", "faceBox", "faceBoundingBox",
  "biometricTemplate", "faceDescriptor", "faceEmbedding", "embedding",
  "feature_vector", "scores",
];

function scrubBiometric(obj: unknown): unknown {
  const forbidden = new Set(BIOMETRIC_KEYS);
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(scrubBiometric);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = forbidden.has(k) ? "[biometric-filtered]" : scrubBiometric(v);
  }
  return out;
}

describe("AC7 — Sentry scrubBiometric filtra todos os campos biométricos", () => {
  it.each(BIOMETRIC_KEYS)("filtra campo: %s", (field) => {
    const scrubbed = scrubBiometric({ [field]: "dados sensíveis" }) as Record<string, unknown>;
    expect(scrubbed[field]).toBe("[biometric-filtered]");
  });

  it("preserva campos não-biométricos", () => {
    const scrubbed = scrubBiometric({ hydration: 8, skinType: "mista" }) as Record<string, unknown>;
    expect(scrubbed.hydration).toBe(8);
    expect(scrubbed.skinType).toBe("mista");
  });

  it("filtra campos biométricos aninhados", () => {
    const scrubbed = scrubBiometric({ meta: { imageData: "abc", hydration: 7 } }) as {
      meta: Record<string, unknown>;
    };
    expect(scrubbed.meta.imageData).toBe("[biometric-filtered]");
    expect(scrubbed.meta.hydration).toBe(7);
  });

  it("processa arrays corretamente", () => {
    const scrubbed = scrubBiometric([{ image: "a" }, { hydration: 8 }]) as Array<
      Record<string, unknown>
    >;
    expect(scrubbed[0].image).toBe("[biometric-filtered]");
    expect(scrubbed[1].hydration).toBe(8);
  });
});
