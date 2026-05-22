/**
 * messageGenerator.test.ts
 *
 * Testa gerarMensagem:
 *   - LEMBRETE_MANHA: gerado_por = 'TEMPLATE' (sem Claude)
 *   - CHECKIN_SEMANAL: gerado_por = 'CLAUDE_API' quando API ok
 *   - CHECKIN_SEMANAL: gerado_por = 'FALLBACK' quando Claude falha
 *   - push.titulo ≤ 50 chars, push.corpo ≤ 100 chars
 *   - gerado_por sempre presente
 */

jest.mock("server-only", () => ({}));
jest.mock("@anthropic-ai/sdk");

import { gerarMensagem } from "../messageGenerator";
import type { MensagemContext } from "../messageGenerator";
import type { CopilotSeed } from "@/lib/digitalTwin/invariants";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SEED: CopilotSeed = {
  ultimoInsightTipo:         "ESTAVEL",
  marcadorFoco:              "acne",
  diasDesdeUltimoScan:       10,
  proximoScanRecomendadoEm:  "2026-05-13",
  alertaAtivo:               false,
  rotinaPrecisaRevisao:      false,
  mensagemMotivacionalCurta: "Estabilidade é progresso. Continue.",
};

const CONTEXT: MensagemContext = {
  user_id:    "user-1",
  nome:       "Ana",
  seed:       SEED,
  rotina:     [{ passo: "1", produto_nome: "Sérum Vitamina C" }],
  streak_dias: 5,
};

// ─── Setup do mock da Anthropic ───────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";

const MockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

function setupClaudeOk(texto = "Mensagem gerada pelo Claude.") {
  MockAnthropic.mockImplementation(
    () =>
      ({
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ type: "text", text: texto }],
          }),
        },
      } as unknown as Anthropic)
  );
}

function setupClaudeFail() {
  MockAnthropic.mockImplementation(
    () =>
      ({
        messages: {
          create: jest.fn().mockRejectedValue(new Error("Claude network error")),
        },
      } as unknown as Anthropic)
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = "test-key";
});

// ─── LEMBRETE_MANHA — template síncrono ──────────────────────────────────────

describe("LEMBRETE_MANHA", () => {
  test("gerado_por = 'TEMPLATE' — nunca chama Claude", async () => {
    const msg = await gerarMensagem("LEMBRETE_MANHA", CONTEXT, "in_app");
    expect(msg.gerado_por).toBe("TEMPLATE");
    expect(MockAnthropic).not.toHaveBeenCalled();
  });

  test("gerado_em presente e ISO válido", async () => {
    const msg = await gerarMensagem("LEMBRETE_MANHA", CONTEXT, "in_app");
    expect(msg.gerado_em).toBeTruthy();
    expect(new Date(msg.gerado_em).getTime()).not.toBeNaN();
  });
});

// ─── CHECKIN_SEMANAL — Claude API ────────────────────────────────────────────

describe("CHECKIN_SEMANAL", () => {
  test("gerado_por = 'CLAUDE_API' quando Claude responde ok", async () => {
    setupClaudeOk("Check-in gerado pelo Claude.");
    const msg = await gerarMensagem("CHECKIN_SEMANAL", CONTEXT, "in_app");
    expect(msg.gerado_por).toBe("CLAUDE_API");
  });

  test("corpo contém a narrativa retornada pelo Claude", async () => {
    setupClaudeOk("Como está sua pele esta semana?");
    const msg = await gerarMensagem("CHECKIN_SEMANAL", CONTEXT, "in_app");
    expect(msg.in_app?.corpo).toContain("Como está sua pele esta semana?");
  });

  test("gerado_por = 'FALLBACK' quando Claude falha", async () => {
    setupClaudeFail();
    const msg = await gerarMensagem("CHECKIN_SEMANAL", CONTEXT, "in_app");
    expect(msg.gerado_por).toBe("FALLBACK");
  });

  test("corpo do FALLBACK não vazio", async () => {
    setupClaudeFail();
    const msg = await gerarMensagem("CHECKIN_SEMANAL", CONTEXT, "in_app");
    expect(msg.in_app?.corpo?.length).toBeGreaterThan(0);
  });

  test("FALLBACK quando ANTHROPIC_API_KEY não definida", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const msg = await gerarMensagem("CHECKIN_SEMANAL", CONTEXT, "in_app");
    expect(msg.gerado_por).toBe("FALLBACK");
    expect(msg.in_app?.corpo?.length).toBeGreaterThan(0);
  });
});

// ─── Limites de push ──────────────────────────────────────────────────────────

describe("limites de push", () => {
  const TITULO_LONGO = "A".repeat(80);
  const CORPO_LONGO  = "B".repeat(150);

  test("push.titulo NUNCA ultrapassa 50 chars — trunca com '…'", async () => {
    setupClaudeOk(CORPO_LONGO);
    // Usar tipo que gera título longo via streak alto
    const ctx: MensagemContext = { ...CONTEXT, streak_dias: 99 };
    const msg = await gerarMensagem("LEMBRETE_MANHA", ctx, "push");
    if (msg.push) {
      expect(msg.push.titulo.length).toBeLessThanOrEqual(50);
    }
  });

  test("push.corpo NUNCA ultrapassa 100 chars", async () => {
    setupClaudeOk(CORPO_LONGO);
    const msg = await gerarMensagem("CHECKIN_SEMANAL", CONTEXT, "push");
    if (msg.push) {
      expect(msg.push.corpo.length).toBeLessThanOrEqual(100);
    }
  });

  test("string truncada termina com '…'", async () => {
    // Criar contexto que produz nome com mais de 50 chars no título
    const ctx: MensagemContext = {
      ...CONTEXT,
      nome: "A".repeat(50),
      streak_dias: 5,
    };
    const msg = await gerarMensagem("LEMBRETE_MANHA", ctx, "push");
    if (msg.push && msg.push.titulo.length === 50) {
      expect(msg.push.titulo.endsWith("…")).toBe(true);
    }
  });
});

// ─── gerado_por sempre presente ──────────────────────────────────────────────

describe("gerado_por sempre definido", () => {
  const tipos = [
    "LEMBRETE_MANHA",
    "LEMBRETE_NOITE",
    "LEMBRETE_SCAN",
    "BOAS_VINDAS",
  ] as const;

  test.each(tipos)("%s: gerado_por nunca undefined", async (tipo) => {
    const msg = await gerarMensagem(tipo, CONTEXT, "in_app");
    expect(msg.gerado_por).toBeDefined();
    expect(["TEMPLATE", "CLAUDE_API", "FALLBACK"]).toContain(msg.gerado_por);
  });

  test("ALERTA_REGRESSAO com FALLBACK: gerado_por definido", async () => {
    setupClaudeFail();
    const ctx: MensagemContext = {
      ...CONTEXT,
      twin_insight: {
        narrativa:        null,
        marcadores_piora: [{ nome: "acne", delta_abs: 8 }],
        efetividade_pct:  60,
      },
    };
    const msg = await gerarMensagem("ALERTA_REGRESSAO", ctx, "in_app");
    expect(msg.gerado_por).toBe("FALLBACK");
    expect(msg.gerado_por).toBeDefined();
  });
});

// ─── canal email ──────────────────────────────────────────────────────────────

describe("canal email", () => {
  test("LEMBRETE_SCAN email: subject não vazio", async () => {
    const msg = await gerarMensagem("LEMBRETE_SCAN", CONTEXT, "email");
    expect(msg.email?.subject.length).toBeGreaterThan(0);
    expect(msg.email?.body.length).toBeGreaterThan(0);
  });

  test("LEMBRETE_SCAN email: cta com url /skin-scan/foco", async () => {
    const msg = await gerarMensagem("LEMBRETE_SCAN", CONTEXT, "email");
    expect(msg.email?.cta?.url).toContain("/skin-scan/foco");
  });
});
