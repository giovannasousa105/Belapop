/**
 * quizInvariant.test.ts
 * Testa assertQuizResultadoValido e inferirResultadoValido.
 */

import {
  assertQuizResultadoValido,
  inferirResultadoValido,
  MAPA_PREOCUPACAO,
  OPCOES_INVESTIMENTO,
} from '../quizInvariant';
import type { QuizResultadoValido } from '../quizInvariant';

// ─── assertQuizResultadoValido ─────────────────────────────────────────────

describe('assertQuizResultadoValido', () => {
  function resultadoValido(): QuizResultadoValido {
    return {
      tipo_pele_inferido: 'MISTA',
      necessidades:       ['hidratacao_profunda'],
      produtos_sugeridos: [],
      skin_scan_cta:      true,
      faixa_preco_max:    25000,
    };
  }

  test('não lança com skin_scan_cta: true', () => {
    expect(() => assertQuizResultadoValido(resultadoValido())).not.toThrow();
  });

  test('lança com skin_scan_cta: false', () => {
    const invalido = { ...resultadoValido(), skin_scan_cta: false };
    expect(() => assertQuizResultadoValido(invalido)).toThrow(
      /skin_scan_cta: true/,
    );
  });

  test('lança sem campo skin_scan_cta', () => {
    const { skin_scan_cta: _, ...semCta } = resultadoValido();
    expect(() => assertQuizResultadoValido(semCta)).toThrow(
      /skin_scan_cta: true/,
    );
  });

  test('lança com skin_scan_cta: null', () => {
    expect(() =>
      assertQuizResultadoValido({ ...resultadoValido(), skin_scan_cta: null }),
    ).toThrow();
  });

  test('lança com skin_scan_cta: 1 (número, não boolean)', () => {
    expect(() =>
      assertQuizResultadoValido({ ...resultadoValido(), skin_scan_cta: 1 }),
    ).toThrow();
  });

  test('lança quando resultado não é objeto', () => {
    expect(() => assertQuizResultadoValido(null)).toThrow(/não é objeto/);
    expect(() => assertQuizResultadoValido(undefined)).toThrow();
    expect(() => assertQuizResultadoValido('string')).toThrow();
  });

  test('mensagem de erro menciona funil', () => {
    expect(() => assertQuizResultadoValido({ skin_scan_cta: false })).toThrow(
      /Skin Scan/,
    );
  });
});

// ─── inferirResultadoValido ────────────────────────────────────────────────

describe('inferirResultadoValido', () => {
  const RESPOSTAS_BASE = {
    preocupacao:  'acne',
    tipo_pele:    'OLEOSA',
    investimento: 'ate_250',
  };

  test('skin_scan_cta é sempre true', () => {
    const resultado = inferirResultadoValido(RESPOSTAS_BASE, []);
    expect(resultado.skin_scan_cta).toBe(true);
  });

  test('resultado passa assertQuizResultadoValido', () => {
    const resultado = inferirResultadoValido(RESPOSTAS_BASE, []);
    expect(() => assertQuizResultadoValido(resultado)).not.toThrow();
  });

  test('tipo_pele_inferido vem de respostas', () => {
    const resultado = inferirResultadoValido(RESPOSTAS_BASE, []);
    expect(resultado.tipo_pele_inferido).toBe('OLEOSA');
  });

  test('necessidades mapeadas corretamente para acne', () => {
    const resultado = inferirResultadoValido(RESPOSTAS_BASE, []);
    expect(resultado.necessidades).toEqual(MAPA_PREOCUPACAO['acne']);
  });

  test('preco_max mapeado corretamente para ate_250', () => {
    const resultado = inferirResultadoValido(RESPOSTAS_BASE, []);
    expect(resultado.faixa_preco_max).toBe(OPCOES_INVESTIMENTO['ate_250']);
  });

  test('preocupacao desconhecida: necessidades vazio, sem crash', () => {
    const resultado = inferirResultadoValido(
      { ...RESPOSTAS_BASE, preocupacao: 'DESCONHECIDA' },
      [],
    );
    expect(resultado.necessidades).toEqual([]);
    expect(resultado.skin_scan_cta).toBe(true);
  });

  test('investimento desconhecido: preco_max é 999999, sem crash', () => {
    const resultado = inferirResultadoValido(
      { ...RESPOSTAS_BASE, investimento: 'DESCONHECIDO' },
      [],
    );
    expect(resultado.faixa_preco_max).toBe(999999);
  });

  test('produtos_sugeridos recebe o array passado', () => {
    const produtos = [{ id: 'p1' }, { id: 'p2' }];
    const resultado = inferirResultadoValido(RESPOSTAS_BASE, produtos);
    expect(resultado.produtos_sugeridos).toBe(produtos);
  });
});

// ─── MAPA_PREOCUPACAO ──────────────────────────────────────────────────────

describe('MAPA_PREOCUPACAO', () => {
  test('não é vazio', () => {
    expect(Object.keys(MAPA_PREOCUPACAO).length).toBeGreaterThan(0);
  });

  test('todos os valores são arrays', () => {
    Object.values(MAPA_PREOCUPACAO).forEach((v) => {
      expect(Array.isArray(v)).toBe(true);
    });
  });
});

// ─── OPCOES_INVESTIMENTO ───────────────────────────────────────────────────

describe('OPCOES_INVESTIMENTO', () => {
  test('todos os valores são centavos positivos ou 999999', () => {
    Object.values(OPCOES_INVESTIMENTO).forEach((v) => {
      expect(v).toBeGreaterThan(0);
    });
  });
});
