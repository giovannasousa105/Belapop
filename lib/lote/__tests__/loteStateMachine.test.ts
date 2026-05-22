/**
 * loteStateMachine.test.ts
 * 24 casos — sem conexão de banco, sem I/O.
 * Compatível com vitest e jest (mesma API describe/it/expect).
 */

import {
  calcularStatusCorreto,
  calcularTransicao,
  validarTransicao,
  calcularDisplayConfig,
  LIMIAR_ESGOTAMENTO_DEFAULT,
} from '../loteStateMachine';
import { toQtd, toLoteId } from '../loteTypes';
import type { LoteStatus } from '../loteTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function params(
  disponivel: number,
  reservada: number,
  total: number,
  limiar = LIMIAR_ESGOTAMENTO_DEFAULT,
  status: LoteStatus = 'ABERTO'
) {
  return {
    qtd_disponivel:    toQtd(disponivel),
    qtd_reservada:     toQtd(reservada),
    qtd_total:         toQtd(total),
    limiar_alerta_pct: limiar,
    status_atual:      status,
  };
}

function lote(
  status: LoteStatus,
  disponivel: number,
  reservada = 0,
  total = 100,
  limiar = LIMIAR_ESGOTAMENTO_DEFAULT,
  data_reposicao: string | null = null
) {
  return {
    id:                toLoteId('lote-1'),
    status,
    qtd_disponivel:    toQtd(disponivel),
    qtd_reservada:     toQtd(reservada),
    qtd_total:         toQtd(total),
    limiar_alerta_pct: limiar,
    abertura_geral_em: null as Date | null,
    data_reposicao,
    produto_id:        'p-1',
    seller_id:         's-1',
    sku_externo:       null,
    verificado_em:     null,
    aberto_em:         null,
    encerrado_em:      null,
    notas_internas:    null,
    criado_em:         new Date(),
    atualizado_em:     new Date(),
  };
}

// ─── calcularStatusCorreto — 8 casos ─────────────────────────────────────────

describe('calcularStatusCorreto', () => {
  it('qtd 80/100 → ABERTO', () => {
    expect(calcularStatusCorreto(params(80, 0, 100))).toBe('ABERTO');
  });

  it('qtd 20/100 (= limiar exato) → EM_ESGOTAMENTO', () => {
    expect(calcularStatusCorreto(params(20, 0, 100))).toBe('EM_ESGOTAMENTO');
  });

  it('qtd 5/100 → EM_ESGOTAMENTO', () => {
    expect(calcularStatusCorreto(params(5, 0, 100))).toBe('EM_ESGOTAMENTO');
  });

  it('qtd 0, reservada 0 → ENCERRADO', () => {
    expect(calcularStatusCorreto(params(0, 0, 100))).toBe('ENCERRADO');
  });

  it('qtd 0, reservada 3 → EM_ESGOTAMENTO (não encerra com reservas ativas)', () => {
    expect(calcularStatusCorreto(params(0, 3, 100))).toBe('EM_ESGOTAMENTO');
  });

  it('status SUSPENSO → SUSPENSO independente das quantidades', () => {
    expect(calcularStatusCorreto(params(0, 0, 100, 20, 'SUSPENSO'))).toBe('SUSPENSO');
  });

  it('status REPOSICAO_PREVISTA → REPOSICAO_PREVISTA independente das quantidades', () => {
    expect(calcularStatusCorreto(params(0, 0, 100, 20, 'REPOSICAO_PREVISTA'))).toBe('REPOSICAO_PREVISTA');
  });

  it('limiar_alerta_pct customizado (30%): qtd 25/100 → EM_ESGOTAMENTO', () => {
    // round(100 * 30 / 100) = 30 → 25 <= 30 → EM_ESGOTAMENTO
    expect(calcularStatusCorreto(params(25, 0, 100, 30))).toBe('EM_ESGOTAMENTO');
  });
});

// ─── calcularTransicao — 5 casos ─────────────────────────────────────────────

describe('calcularTransicao', () => {
  it('status correto → null', () => {
    expect(calcularTransicao(lote('ABERTO', 80))).toBeNull();
  });

  it('ABERTO com qtd baixa → TransicaoResult ABERTO→EM_ESGOTAMENTO', () => {
    const r = calcularTransicao(lote('ABERTO', 15));
    expect(r).not.toBeNull();
    expect(r?.status_anterior).toBe('ABERTO');
    expect(r?.status_novo).toBe('EM_ESGOTAMENTO');
    expect(r?.transitou).toBe(true);
  });

  it('EM_ESGOTAMENTO com qtd 0/0 → TransicaoResult EM_ESGOTAMENTO→ENCERRADO', () => {
    const r = calcularTransicao(lote('EM_ESGOTAMENTO', 0, 0));
    expect(r?.status_anterior).toBe('EM_ESGOTAMENTO');
    expect(r?.status_novo).toBe('ENCERRADO');
  });

  it('EM_ESGOTAMENTO com qtd alta (liberação) → TransicaoResult EM_ESGOTAMENTO→ABERTO', () => {
    const r = calcularTransicao(lote('EM_ESGOTAMENTO', 80));
    expect(r?.status_anterior).toBe('EM_ESGOTAMENTO');
    expect(r?.status_novo).toBe('ABERTO');
  });

  it('SUSPENSO → null independente das quantidades', () => {
    expect(calcularTransicao(lote('SUSPENSO', 0, 0))).toBeNull();
  });
});

// ─── validarTransicao — 6 casos ──────────────────────────────────────────────

describe('validarTransicao', () => {
  it('ABERTO → EM_ESGOTAMENTO: valida', () => {
    expect(validarTransicao('ABERTO', 'EM_ESGOTAMENTO').valida).toBe(true);
  });

  it('EM_ESGOTAMENTO → ENCERRADO: valida', () => {
    expect(validarTransicao('EM_ESGOTAMENTO', 'ENCERRADO').valida).toBe(true);
  });

  it('ENCERRADO → REPOSICAO_PREVISTA: valida', () => {
    expect(validarTransicao('ENCERRADO', 'REPOSICAO_PREVISTA').valida).toBe(true);
  });

  it('ENCERRADO → ABERTO: inválida, motivo contém "novo lote"', () => {
    const r = validarTransicao('ENCERRADO', 'ABERTO');
    expect(r.valida).toBe(false);
    if (!r.valida) expect(r.motivo).toMatch(/novo lote/i);
  });

  it('ABERTO → ABERTO: inválida', () => {
    expect(validarTransicao('ABERTO', 'ABERTO').valida).toBe(false);
  });

  it('SUSPENSO → ENCERRADO: inválida', () => {
    expect(validarTransicao('SUSPENSO', 'ENCERRADO').valida).toBe(false);
  });
});

// ─── calcularDisplayConfig — 5 casos ─────────────────────────────────────────

describe('calcularDisplayConfig', () => {
  it('ABERTO qtd 80: urgencia none, texto_estoque null', () => {
    const cfg = calcularDisplayConfig(lote('ABERTO', 80));
    expect(cfg.urgencia_level).toBe('none');
    expect(cfg.texto_estoque).toBeNull();
    expect(cfg.mostrar_waitlist).toBe(false);
  });

  it('EM_ESGOTAMENTO qtd 15 (15%): urgencia low, texto contém "15"', () => {
    const cfg = calcularDisplayConfig(lote('EM_ESGOTAMENTO', 15));
    expect(cfg.urgencia_level).toBe('low');
    expect(cfg.texto_estoque).toContain('15');
  });

  it('EM_ESGOTAMENTO qtd 8 (8%): urgencia high, texto contém "Últimas"', () => {
    const cfg = calcularDisplayConfig(lote('EM_ESGOTAMENTO', 8));
    expect(cfg.urgencia_level).toBe('high');
    expect(cfg.texto_estoque).toContain('Últimas');
  });

  it("ENCERRADO com data_reposicao '2026-07-14': texto contém '14/07/2026'", () => {
    const cfg = calcularDisplayConfig(lote('ENCERRADO', 0, 0, 100, 20, '2026-07-14'));
    expect(cfg.texto_esgotado).toContain('14/07/2026');
    expect(cfg.mostrar_waitlist).toBe(true);
  });

  it('ENCERRADO sem data: texto contém "Sem reposição"', () => {
    const cfg = calcularDisplayConfig(lote('ENCERRADO', 0));
    expect(cfg.texto_esgotado).toContain('Sem reposição');
  });
});

// ─── Critérios de aceitação — toQtd ──────────────────────────────────────────

describe('toQtd — critérios de aceitação', () => {
  it('toQtd(-1) lança RangeError', () => {
    expect(() => toQtd(-1)).toThrow(RangeError);
  });

  it('toQtd(1.5) lança TypeError', () => {
    expect(() => toQtd(1.5)).toThrow(TypeError);
  });
});
