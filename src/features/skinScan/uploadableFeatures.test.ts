// Jest — globals (describe/it/expect) disponíveis via @types/jest, sem import

import {
  toUploadable,
  assertUploadable,
  UPLOADABLE_KEYS,
  type RawScanResult,
} from './uploadableFeatures';

const FORBIDDEN = ['image', 'landmarks', 'embedding', 'faceMesh'];

const rawWithForbidden: RawScanResult = {
  indices: { hydration: 7.8, oiliness: 3.2, redness: 11, darkSpots: -2 },
  skinType: 'mista',
  primaryConcerns: ['acne', 'inexistente', 'manchas'],
  modelVersion: 'v1.2.0',
  qualityFlag: 'ok',
  image: 'data:image/png;base64,AAAA',
  landmarks: [[1, 2], [3, 4]],
  embedding: new Array(512).fill(0.123),
  faceMesh: { verts: [] },
};

describe('toUploadable — fronteira de dados', () => {
  it('emite apenas as chaves da whitelist', () => {
    const out = toUploadable(rawWithForbidden);
    expect(Object.keys(out).sort()).toEqual([...UPLOADABLE_KEYS].sort());
  });

  it('nunca inclui campos proibidos', () => {
    const out = toUploadable(rawWithForbidden) as Record<string, unknown>;
    for (const k of FORBIDDEN) expect(out).not.toHaveProperty(k);
  });

  it('serialização não contém rastro biométrico', () => {
    const json = JSON.stringify(toUploadable(rawWithForbidden));
    for (const k of FORBIDDEN) expect(json).not.toContain(k);
    expect(json).not.toContain('base64');
  });

  it('índices são inteiros quantizados em 0–10', () => {
    const out = toUploadable(rawWithForbidden);
    expect(out.redness).toBe(10);               // 11 → clamp
    expect(out.darkSpots).toBe(0);              // -2 → clamp
    expect(Number.isInteger(out.hydration)).toBe(true);
    expect(out.hydration).toBe(8);              // 7.8 → round
  });

  it('descarta concerns fora do enum', () => {
    expect(toUploadable(rawWithForbidden).primaryConcerns).toEqual(['acne', 'manchas']);
  });

  it('assertUploadable trava objeto com campo extra', () => {
    const bad = { ...toUploadable(rawWithForbidden), embedding: [0.1] };
    expect(() => assertUploadable(bad as Record<string, unknown>)).toThrow();
  });

  it('assertUploadable não lança para objeto limpo', () => {
    const good = toUploadable(rawWithForbidden) as Record<string, unknown>;
    expect(() => assertUploadable(good)).not.toThrow();
  });

  it('skinType inválido cai para "normal"', () => {
    const out = toUploadable({ skinType: 'extraterrestre' });
    expect(out.skinType).toBe('normal');
  });

  it('qualityFlag inválido cai para "ok"', () => {
    const out = toUploadable({ qualityFlag: 'perfeita' });
    expect(out.qualityFlag).toBe('ok');
  });

  it('índices ausentes resultam em 0', () => {
    const out = toUploadable({});
    expect(out.hydration).toBe(0);
    expect(out.fineLines).toBe(0);
    expect(out.darkCircles).toBe(0);
  });

  it('modelVersion padrão é "unknown" quando ausente', () => {
    const out = toUploadable({});
    expect(out.modelVersion).toBe('unknown');
  });
});
