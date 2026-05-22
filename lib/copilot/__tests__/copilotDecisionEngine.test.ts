/**
 * copilotDecisionEngine.test.ts
 *
 * Testa a lógica de prioridade do decidirInteracaoDoDia.
 * Redis é mockado — o teste foca em QUAL tipo é selecionado,
 * não no comportamento do cooldown (coberto pelo cooldownGuard.test.ts).
 *
 * Prioridade testada (ordem estrita):
 *   1. ALERTA_REGRESSAO  (seed.alertaAtivo)
 *   2. MARCO_ALCANCADO   (seed.ultimoInsightTipo)
 *   3. LEMBRETE_SCAN     (diasDesdeUltimoScan >= 38)
 *   4. CHECKIN_SEMANAL   (diasDesdeUltimoCheckin >= 7)
 *   5. NUDGE_RECOMPRA    (produtosAcabando não-vazio)
 *   6. LEMBRETE_MANHA/NOITE
 *   → null se nenhuma condição passou
 */

jest.mock("../cooldownGuard", () => ({
  podeEnviar:             jest.fn(),
  podeEnviarNudgeProduto: jest.fn(),
}));

import { decidirInteracaoDoDia } from "../copilotDecisionEngine";
import { podeEnviar, podeEnviarNudgeProduto } from "../cooldownGuard";
import type { CopilotConfig, DecisaoContexto } from "../copilotTypes";
import type { CopilotSeed } from "@/lib/digitalTwin/invariants";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const AGORA = new Date("2026-05-18T10:00:00Z"); // hora UTC 10 → faixa manhã (3–15)

const CONFIG: CopilotConfig = {
  id: "config-1",
  user_id: "user-1",
  twin_id: "twin-1",
  ativo: true,
  horario_manha: "07:30",
  horario_noite: "21:00",
  timezone: "America/Sao_Paulo",
  canal_preferido: "in_app",
  aceita_push: false,
  aceita_email: true,
};

function makeSeed(overrides: Partial<CopilotSeed> = {}): CopilotSeed {
  return {
    ultimoInsightTipo:         "ESTAVEL",
    marcadorFoco:              "acne",
    diasDesdeUltimoScan:       10,
    proximoScanRecomendadoEm:  "2026-05-13",
    alertaAtivo:               false,
    rotinaPrecisaRevisao:      false,
    mensagemMotivacionalCurta: "Estabilidade é progresso. Continue.",
    ...overrides,
  };
}

function makeContexto(overrides: Partial<DecisaoContexto> = {}): DecisaoContexto {
  return {
    diasDesdeUltimoCheckin:      0,
    produtosAcabando:            [],
    ultimoInsightTipoNotificado: null,
    consistenciaSemanalPct:      80,
    ...overrides,
  };
}

const mockPodeEnviar     = podeEnviar as jest.MockedFunction<typeof podeEnviar>;
const mockNudgeProduto   = podeEnviarNudgeProduto as jest.MockedFunction<typeof podeEnviarNudgeProduto>;
const REDIS_MOCK         = {} as never; // nunca chamado diretamente nos testes

beforeEach(() => {
  jest.clearAllMocks();
  // Default: tudo permitido — cada teste restringe o que precisar
  mockPodeEnviar.mockResolvedValue({ permitido: true });
  mockNudgeProduto.mockResolvedValue(false);
});

// ─── Prioridade 1: ALERTA_REGRESSAO ──────────────────────────────────────────

describe("ALERTA_REGRESSAO (prioridade 1)", () => {
  test("seed.alertaAtivo = true → retorna ALERTA_REGRESSAO", async () => {
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ alertaAtivo: true }),
      makeContexto(),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).toBe("ALERTA_REGRESSAO");
  });

  test("seed.alertaAtivo = false → não retorna ALERTA_REGRESSAO", async () => {
    // cooldowns todos bloqueados para não retornar nada
    mockPodeEnviar.mockResolvedValue({ permitido: false });
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ alertaAtivo: false }),
      makeContexto(),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).not.toBe("ALERTA_REGRESSAO");
  });

  test("ALERTA_REGRESSAO tem prioridade sobre LEMBRETE_SCAN", async () => {
    // Ambas condições satisfeitas — ALERTA_REGRESSAO deve vencer
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ alertaAtivo: true, diasDesdeUltimoScan: 40 }),
      makeContexto(),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).toBe("ALERTA_REGRESSAO");
  });
});

// ─── Prioridade 2: MARCO_ALCANCADO ────────────────────────────────────────────

describe("MARCO_ALCANCADO (prioridade 1, não repetido)", () => {
  test("insight MARCO_ALCANCADO não-notificado → retorna MARCO_ALCANCADO", async () => {
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ ultimoInsightTipo: "MARCO_ALCANCADO", alertaAtivo: false }),
      makeContexto({ ultimoInsightTipoNotificado: null }),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).toBe("MARCO_ALCANCADO");
  });

  test("insight MARCO_ALCANCADO já notificado → NÃO retorna MARCO_ALCANCADO", async () => {
    // Bloquear todos para não retornar outro tipo
    mockPodeEnviar.mockResolvedValue({ permitido: false });
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ ultimoInsightTipo: "MARCO_ALCANCADO", alertaAtivo: false }),
      makeContexto({ ultimoInsightTipoNotificado: "MARCO_ALCANCADO" }),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).not.toBe("MARCO_ALCANCADO");
  });
});

// ─── Prioridade 3: LEMBRETE_SCAN ─────────────────────────────────────────────

describe("LEMBRETE_SCAN (prioridade 2)", () => {
  test("diasDesdeUltimoScan = 40 (>= 38) → retorna LEMBRETE_SCAN", async () => {
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ diasDesdeUltimoScan: 40, alertaAtivo: false }),
      makeContexto(),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).toBe("LEMBRETE_SCAN");
  });

  test("diasDesdeUltimoScan = 38 (exato) → retorna LEMBRETE_SCAN", async () => {
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ diasDesdeUltimoScan: 38, alertaAtivo: false }),
      makeContexto(),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).toBe("LEMBRETE_SCAN");
  });

  test("diasDesdeUltimoScan = 37 (< 38) → NÃO retorna LEMBRETE_SCAN", async () => {
    // Bloquear todos exceto LEMBRETE_MANHA para isolar o teste
    mockPodeEnviar.mockImplementation(async (_uid, tipo) => {
      if (tipo === "LEMBRETE_MANHA" || tipo === "LEMBRETE_NOITE") {
        return { permitido: true };
      }
      return { permitido: false };
    });
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ diasDesdeUltimoScan: 37, alertaAtivo: false }),
      makeContexto(),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).not.toBe("LEMBRETE_SCAN");
  });

  test("LEMBRETE_SCAN tem prioridade sobre LEMBRETE_MANHA", async () => {
    // Ambas condições satisfeitas — LEMBRETE_SCAN deve vencer
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ diasDesdeUltimoScan: 40, alertaAtivo: false }),
      makeContexto(),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).toBe("LEMBRETE_SCAN");
    expect(result?.tipo).not.toBe("LEMBRETE_MANHA");
  });
});

// ─── Prioridade 4: CHECKIN_SEMANAL ────────────────────────────────────────────

describe("CHECKIN_SEMANAL (prioridade 2)", () => {
  test("diasDesdeUltimoCheckin >= 7 → retorna CHECKIN_SEMANAL", async () => {
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ alertaAtivo: false, diasDesdeUltimoScan: 10 }),
      makeContexto({ diasDesdeUltimoCheckin: 8 }),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).toBe("CHECKIN_SEMANAL");
  });

  test("diasDesdeUltimoCheckin = 6 (< 7) → NÃO retorna CHECKIN_SEMANAL", async () => {
    mockPodeEnviar.mockImplementation(async (_uid, tipo) => {
      if (tipo === "LEMBRETE_MANHA" || tipo === "LEMBRETE_NOITE") {
        return { permitido: true };
      }
      return { permitido: false };
    });
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ alertaAtivo: false, diasDesdeUltimoScan: 10 }),
      makeContexto({ diasDesdeUltimoCheckin: 6 }),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).not.toBe("CHECKIN_SEMANAL");
  });
});

// ─── Prioridade 5: NUDGE_RECOMPRA ─────────────────────────────────────────────

describe("NUDGE_RECOMPRA (prioridade 4)", () => {
  test("produto acabando → retorna NUDGE_RECOMPRA", async () => {
    // Bloquear tipos mais prioritários
    mockPodeEnviar.mockResolvedValue({ permitido: false });
    mockNudgeProduto.mockResolvedValue(true);
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ alertaAtivo: false }),
      makeContexto({ produtosAcabando: ["prod-1"] }),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).toBe("NUDGE_RECOMPRA");
  });

  test("produtosAcabando vazio → NÃO retorna NUDGE_RECOMPRA", async () => {
    mockPodeEnviar.mockImplementation(async (_uid, tipo) =>
      tipo === "LEMBRETE_MANHA" || tipo === "LEMBRETE_NOITE"
        ? { permitido: true }
        : { permitido: false }
    );
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ alertaAtivo: false }),
      makeContexto({ produtosAcabando: [] }),
      REDIS_MOCK,
      AGORA
    );
    expect(result?.tipo).not.toBe("NUDGE_RECOMPRA");
  });
});

// ─── Fallback: LEMBRETE_MANHA/NOITE ──────────────────────────────────────────

describe("LEMBRETE_MANHA/NOITE (prioridade 3 — fallback)", () => {
  test("hora UTC 10 (manhã) → retorna LEMBRETE_MANHA", async () => {
    // Bloquear todos os tipos mais prioritários
    mockPodeEnviar.mockImplementation(async (_uid, tipo) =>
      tipo === "LEMBRETE_MANHA" ? { permitido: true } : { permitido: false }
    );
    const agoraManha = new Date("2026-05-18T10:00:00Z"); // hora 10 UTC
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ alertaAtivo: false }),
      makeContexto(),
      REDIS_MOCK,
      agoraManha
    );
    expect(result?.tipo).toBe("LEMBRETE_MANHA");
  });

  test("hora UTC 20 (noite) → retorna LEMBRETE_NOITE", async () => {
    mockPodeEnviar.mockImplementation(async (_uid, tipo) =>
      tipo === "LEMBRETE_NOITE" ? { permitido: true } : { permitido: false }
    );
    const agoraNoite = new Date("2026-05-18T20:00:00Z"); // hora 20 UTC
    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({ alertaAtivo: false }),
      makeContexto(),
      REDIS_MOCK,
      agoraNoite
    );
    expect(result?.tipo).toBe("LEMBRETE_NOITE");
  });
});

// ─── null quando nenhuma condição passa ───────────────────────────────────────

describe("null — nenhuma interação neste ciclo", () => {
  test("todas as condições bloqueadas → retorna null", async () => {
    mockPodeEnviar.mockResolvedValue({ permitido: false });
    mockNudgeProduto.mockResolvedValue(false);

    const result = await decidirInteracaoDoDia(
      CONFIG,
      makeSeed({
        alertaAtivo:         false,
        diasDesdeUltimoScan: 10,
        ultimoInsightTipo:   "ESTAVEL",
      }),
      makeContexto({
        diasDesdeUltimoCheckin:      3,
        produtosAcabando:            [],
        ultimoInsightTipoNotificado: null,
      }),
      REDIS_MOCK,
      AGORA
    );
    expect(result).toBeNull();
  });
});
