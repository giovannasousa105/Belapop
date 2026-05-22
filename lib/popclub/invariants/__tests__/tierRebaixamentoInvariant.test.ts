/**
 * Testes da Invariante 3: Rebaixamento nunca silencioso.
 *
 * Cobertura 100% das branches de avaliarRebaixamento:
 *   PONTOS_SUFICIENTES | AVISO_NAO_ENVIADO | DATA_NAO_CHEGOU | rebaixado: true
 *
 * Executar: npx jest lib/popclub/invariants/__tests__/tierRebaixamentoInvariant.test.ts
 */

import {
  avaliarRebaixamento,
  calcularDatasRebaixamento,
  calcularAvisoPayload,
  type RebaixamentoInput,
} from "../tierRebaixamentoInvariant";
import {
  toPontosAcumulados12m,
} from "../pontosInvariant";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const HOJE = new Date("2026-05-16T00:00:00.000Z");
const ONTEM = new Date("2026-05-15T00:00:00.000Z");
const AMANHA = new Date("2026-05-17T00:00:00.000Z");
const DAQUI_60_DIAS = new Date("2026-07-15T00:00:00.000Z"); // ~60 dias

function makeInput(
  overrides: Partial<RebaixamentoInput>
): RebaixamentoInput {
  return {
    membro_id:               "membro-uuid",
    tier_atual:              "PREMIUM",
    pontos_acumulados_12m:   toPontosAcumulados12m(300), // insuficiente para Premium (500)
    data_rebaixamento_aviso: ONTEM,
    data_avaliacao_tier:     HOJE,
    ...overrides,
  };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("avaliarRebaixamento — branches completas", () => {

  it("pontos suficientes → rebaixado: false, PONTOS_SUFICIENTES", () => {
    const input = makeInput({
      tier_atual: "PREMIUM",
      pontos_acumulados_12m: toPontosAcumulados12m(600), // >= 500 (limiar PREMIUM)
    });
    const resultado = avaliarRebaixamento(input, HOJE);
    expect(resultado.rebaixado).toBe(false);
    if (!resultado.rebaixado) {
      expect(resultado.motivo).toBe("PONTOS_SUFICIENTES");
    }
  });

  it("sem aviso enviado → rebaixado: false, AVISO_NAO_ENVIADO (mesmo com pontos insuficientes e data chegou)", () => {
    const input = makeInput({
      data_rebaixamento_aviso: null, // aviso NÃO enviado
      data_avaliacao_tier: ONTEM,   // data já passou
      pontos_acumulados_12m: toPontosAcumulados12m(100), // muito insuficiente
    });
    const resultado = avaliarRebaixamento(input, HOJE);
    expect(resultado.rebaixado).toBe(false);
    if (!resultado.rebaixado) {
      expect(resultado.motivo).toBe("AVISO_NAO_ENVIADO");
    }
  });

  it("aviso enviado mas data futura → rebaixado: false, DATA_NAO_CHEGOU", () => {
    const input = makeInput({
      data_rebaixamento_aviso: ONTEM, // aviso enviado
      data_avaliacao_tier: AMANHA,   // data não chegou ainda
    });
    const resultado = avaliarRebaixamento(input, HOJE);
    expect(resultado.rebaixado).toBe(false);
    if (!resultado.rebaixado) {
      expect(resultado.motivo).toBe("DATA_NAO_CHEGOU");
    }
  });

  it("todos os guards passados → rebaixado: true", () => {
    const input = makeInput({
      tier_atual: "PREMIUM",
      pontos_acumulados_12m: toPontosAcumulados12m(300), // insuficiente
      data_rebaixamento_aviso: ONTEM,                    // aviso enviado
      data_avaliacao_tier: HOJE,                         // data chegou
    });
    const resultado = avaliarRebaixamento(input, HOJE);
    expect(resultado.rebaixado).toBe(true);
    if (resultado.rebaixado) {
      expect(resultado.tier_anterior).toBe("PREMIUM");
      expect(resultado.tier_novo).toBe("ESSENCIAL");
    }
  });

  it("Luxo → Premium com aviso + data chegada", () => {
    const input = makeInput({
      tier_atual: "LUXO",
      pontos_acumulados_12m: toPontosAcumulados12m(600), // insuficiente para Luxo (1500)
      data_rebaixamento_aviso: ONTEM,
      data_avaliacao_tier: HOJE,
    });
    const resultado = avaliarRebaixamento(input, HOJE);
    expect(resultado.rebaixado).toBe(true);
    if (resultado.rebaixado) {
      expect(resultado.tier_novo).toBe("PREMIUM");
    }
  });

  it("guard AVISO_NAO_ENVIADO tem prioridade sobre DATA_NAO_CHEGOU", () => {
    const input = makeInput({
      data_rebaixamento_aviso: null,   // aviso não enviado
      data_avaliacao_tier: AMANHA,     // data não chegou também
    });
    const resultado = avaliarRebaixamento(input, HOJE);
    if (!resultado.rebaixado) {
      expect(resultado.motivo).toBe("AVISO_NAO_ENVIADO");
    }
  });
});

// ─── calcularDatasRebaixamento ────────────────────────────────────────────────

describe("calcularDatasRebaixamento", () => {
  it("data_avaliacao_tier = hoje + 60 dias exatos", () => {
    const hoje = new Date("2026-05-16T00:00:00.000Z");
    const { data_avaliacao_tier } = calcularDatasRebaixamento(hoje);

    const diffDias = (data_avaliacao_tier.getTime() - hoje.getTime()) / 86400000;
    expect(diffDias).toBe(60);
  });

  it("data_rebaixamento_aviso = hoje (data de envio do aviso)", () => {
    const hoje = new Date("2026-05-16T00:00:00.000Z");
    const { data_rebaixamento_aviso } = calcularDatasRebaixamento(hoje);
    expect(data_rebaixamento_aviso.getTime()).toBe(hoje.getTime());
  });
});

// ─── calcularAvisoPayload ─────────────────────────────────────────────────────

describe("calcularAvisoPayload", () => {
  const membro = {
    id:                    "m-1",
    email:                 "ana@example.com",
    nome:                  "Ana",
    tier_atual:            "PREMIUM" as const,
    pontos_acumulados_12m: toPontosAcumulados12m(350),
  };

  it("pts_faltando = pts_necessarios - pts_atuais (nunca negativo)", () => {
    const payload = calcularAvisoPayload(membro, DAQUI_60_DIAS, HOJE);
    expect(payload.pontos_faltando).toBe(500 - 350);
    expect(payload.pontos_faltando).toBeGreaterThanOrEqual(0);
  });

  it("pts_faltando é 0 quando pontos são suficientes", () => {
    const membroOk = { ...membro, pontos_acumulados_12m: toPontosAcumulados12m(600) };
    const payload = calcularAvisoPayload(membroOk, DAQUI_60_DIAS, HOJE);
    expect(payload.pontos_faltando).toBe(0);
  });

  it("dias_para_avaliacao arredondado para cima (Math.ceil)", () => {
    const hoje = new Date("2026-05-16T12:00:00.000Z"); // meio do dia
    const avaliacao = new Date("2026-05-17T00:00:00.000Z"); // amanhã meia-noite
    const payload = calcularAvisoPayload(membro, avaliacao, hoje);
    // diff = 12h = 0.5 dias → Math.ceil(0.5) = 1
    expect(payload.dias_para_avaliacao).toBe(1);
  });

  it("tier_risco calculado por pontos_acumulados_12m (não por pontos_disponiveis)", () => {
    const payload = calcularAvisoPayload(membro, DAQUI_60_DIAS, HOJE);
    // 350 pts → ESSENCIAL
    expect(payload.tier_risco).toBe("ESSENCIAL");
    expect(payload.tier_atual).toBe("PREMIUM");
  });
});
