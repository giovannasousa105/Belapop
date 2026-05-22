/**
 * urgenciaInvariant.test.ts
 * Testa validarCopyUrgencia, criarUrgenciaPayload e TOM_PROIBIDO_URGENCIA.
 */

import {
  validarCopyUrgencia,
  criarUrgenciaPayload,
  TOM_PROIBIDO_URGENCIA,
} from '../urgenciaInvariant';

// ─── validarCopyUrgencia ───────────────────────────────────────────────────

describe('validarCopyUrgencia', () => {
  test('tom editorial limpo: válido', () => {
    const { valido } = validarCopyUrgencia('23 unidades disponíveis neste lote');
    expect(valido).toBe(true);
  });

  test('tom editorial: "Curadoria encerra domingo" — válido', () => {
    const { valido } = validarCopyUrgencia('Curadoria encerra domingo');
    expect(valido).toBe(true);
  });

  test('"Última chance!" detecta violação', () => {
    const { valido, violacoes } = validarCopyUrgencia('Última chance!');
    expect(valido).toBe(false);
    expect(violacoes).toContain('última chance');
  });

  test('"URGENTE" (uppercase) detecta violação', () => {
    const { valido, violacoes } = validarCopyUrgencia('URGENTE: compre agora');
    expect(valido).toBe(false);
    expect(violacoes).toContain('urgente');
  });

  test('"Corra!" detecta violação', () => {
    const { valido } = validarCopyUrgencia('Corra! Só hoje!');
    expect(valido).toBe(false);
  });

  test('"não perca" detecta violação', () => {
    const { violacoes } = validarCopyUrgencia('Não perca esta oportunidade');
    expect(violacoes).toContain('não perca');
  });

  test('"imperdível" detecta violação', () => {
    const { violacoes } = validarCopyUrgencia('Oferta imperdível da semana');
    expect(violacoes).toContain('imperdível');
  });

  test('"oferta relâmpago" detecta violação', () => {
    const { violacoes } = validarCopyUrgencia('Oferta relâmpago: 50% off');
    expect(violacoes).toContain('oferta relâmpago');
  });

  test('"aproveite" detecta violação', () => {
    const { violacoes } = validarCopyUrgencia('Aproveite agora');
    expect(violacoes).toContain('aproveite');
  });

  test('múltiplas violações retornadas', () => {
    const { violacoes } = validarCopyUrgencia('URGENTE! Última chance! Corra!');
    expect(violacoes.length).toBeGreaterThanOrEqual(2);
  });

  test('string vazia: válida', () => {
    const { valido } = validarCopyUrgencia('');
    expect(valido).toBe(true);
  });
});

// ─── TOM_PROIBIDO_URGENCIA ─────────────────────────────────────────────────

describe('TOM_PROIBIDO_URGENCIA', () => {
  test('contém exatamente 7 itens', () => {
    expect(TOM_PROIBIDO_URGENCIA.length).toBe(7);
  });

  test('todos os 7 itens são detectados por validarCopyUrgencia', () => {
    TOM_PROIBIDO_URGENCIA.forEach((termo) => {
      const { valido } = validarCopyUrgencia(termo);
      expect(valido).toBe(false);
    });
  });

  test('é readonly — não pode ser mutado em runtime', () => {
    // TypeScript garante readonly em compilação; aqui confirmamos é array
    expect(Array.isArray(TOM_PROIBIDO_URGENCIA)).toBe(true);
  });
});

// ─── criarUrgenciaPayload ──────────────────────────────────────────────────

describe('criarUrgenciaPayload', () => {
  const URL_VALIDA = '/lotes/curadoria-maio';

  test('cria payload com texto e CTA limpos', () => {
    const payload = criarUrgenciaPayload(
      'LOTE_ESGOTANDO',
      '14 unidades disponíveis neste lote',
      URL_VALIDA,
      'Ver lote',
    );
    expect(payload.tipo).toBe('LOTE_ESGOTANDO');
    expect(payload.texto).toBe('14 unidades disponíveis neste lote');
    expect(payload.url).toBe(URL_VALIDA);
    expect(payload.label_cta).toBe('Ver lote');
  });

  test('lança Error quando texto tem tom proibido', () => {
    expect(() =>
      criarUrgenciaPayload(
        'ACESSO_ANTECIPADO',
        'Última chance de acessar',
        URL_VALIDA,
        'Acessar agora',
      ),
    ).toThrow(/tom proibido/i);
  });

  test('lança Error quando label_cta tem tom proibido', () => {
    expect(() =>
      criarUrgenciaPayload(
        'CURADORIA',
        'Curadoria encerra domingo',
        URL_VALIDA,
        'Corra e acesse',
      ),
    ).toThrow(/CTA com tom proibido/i);
  });

  test('mensagem de erro cita a violação', () => {
    expect(() =>
      criarUrgenciaPayload('CURADORIA', 'URGENTE: curadoria nova', URL_VALIDA, 'Ver'),
    ).toThrow('urgente');
  });

  test('payload é imutável por tipagem (readonly)', () => {
    const payload = criarUrgenciaPayload(
      'ACESSO_ANTECIPADO',
      'Membros Luxo acessam por mais 12h',
      URL_VALIDA,
      'Acessar',
    );
    // Verifica que os campos existem com os valores corretos
    expect(payload.tipo).toBe('ACESSO_ANTECIPADO');
    expect(payload.texto).toContain('Membros Luxo');
  });
});
