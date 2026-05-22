/**
 * Testes da Invariante 2: Feed limitado a 3 cards.
 *
 * Executar: npx jest lib/copilot/guards/__tests__/feedLimitGuard.test.ts
 * Dependências: npm install --save-dev jest @types/jest ts-jest
 */

import {
  aplicarFeedLimit,
  assertFeedValido,
  FEED_MAX_CARDS,
} from "../feedLimitGuard";
import type { CopilotInteracao, InteracaoTipo } from "../../copilotTypes";

// ─── Fixture builder ──────────────────────────────────────────────────────────

function makeInteracao(
  tipo: InteracaoTipo,
  criado_em: string = new Date().toISOString(),
  id: string = tipo
): CopilotInteracao {
  return {
    id,
    user_id: "u1",
    twin_id: null,
    tipo,
    canal: "in_app",
    status: "ENTREGUE",
    mensagem_id: null,
    payload: null,
    seed_snapshot: null,
    respondida_em: null,
    criado_em,
  };
}

// Data helper
const dia = (n: number) =>
  new Date(Date.now() - n * 86400000).toISOString();

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("feedLimitGuard — Invariante máximo 3 cards", () => {

  // ── FEED_MAX_CARDS ─────────────────────────────────────────────────────────

  it("FEED_MAX_CARDS é exatamente 3 (valor contratual)", () => {
    expect(FEED_MAX_CARDS).toBe(3);
  });

  // ── aplicarFeedLimit ───────────────────────────────────────────────────────

  it("retorna array vazio se não há interações", () => {
    const resultado = aplicarFeedLimit([]);
    expect(resultado).toHaveLength(0);
  });

  it("retorna as 3 interações se há exatamente 3", () => {
    const input = [
      makeInteracao("LEMBRETE_MANHA"),
      makeInteracao("LEMBRETE_NOITE"),
      makeInteracao("NUDGE_RECOMPRA"),
    ];
    const resultado = aplicarFeedLimit(input);
    expect(resultado).toHaveLength(3);
  });

  it("retorna EXATAMENTE 3 mesmo com 7 interações de entrada", () => {
    const input = [
      makeInteracao("LEMBRETE_MANHA"),
      makeInteracao("LEMBRETE_NOITE"),
      makeInteracao("NUDGE_RECOMPRA", dia(0), "n1"),
      makeInteracao("NUDGE_RECOMPRA", dia(1), "n2"),
      makeInteracao("NUDGE_RECOMPRA", dia(2), "n3"),
      makeInteracao("CHECKIN_SEMANAL", dia(3)),
      makeInteracao("LEMBRETE_SCAN", dia(4)),
    ];
    const resultado = aplicarFeedLimit(input);
    expect(resultado).toHaveLength(3);
  });

  it("as 3 retornadas são as de MAIOR prioridade (menor número)", () => {
    const input = [
      makeInteracao("NUDGE_RECOMPRA", dia(0), "nudge"),     // prioridade 4
      makeInteracao("ALERTA_REGRESSAO", dia(1), "alerta"),  // prioridade 1
      makeInteracao("LEMBRETE_MANHA", dia(2), "lembmanha"), // prioridade 3
      makeInteracao("CHECKIN_SEMANAL", dia(3), "checkin"),  // prioridade 2
      makeInteracao("LEMBRETE_SCAN", dia(4), "scan"),       // prioridade 2
    ];
    const resultado = aplicarFeedLimit(input);
    const tipos = resultado.map((i) => i.tipo);

    // Prioridade 1 sempre primeiro
    expect(tipos[0]).toBe("ALERTA_REGRESSAO");
    // Prioridade 4 (NUDGE_RECOMPRA) só aparece se há vagas — aqui há 4 candidatos
    // de prioridades 1, 2, 2, 3, 4 → vagas são preenchidas por 1, 2, 2
    expect(tipos).not.toContain("NUDGE_RECOMPRA");
  });

  it("ALERTA_REGRESSAO aparece antes de LEMBRETE_MANHA independente da data", () => {
    const input = [
      makeInteracao("LEMBRETE_MANHA", dia(0)),    // mais recente
      makeInteracao("ALERTA_REGRESSAO", dia(5)),  // mais antiga
    ];
    const resultado = aplicarFeedLimit(input);
    expect(resultado[0]?.tipo).toBe("ALERTA_REGRESSAO");
    expect(resultado[1]?.tipo).toBe("LEMBRETE_MANHA");
  });

  it("desempate por prioridade igual: mais recente primeiro", () => {
    const antiga = makeInteracao("NUDGE_RECOMPRA", dia(5), "antiga");
    const recente = makeInteracao("NUDGE_RECOMPRA", dia(0), "recente");
    const resultado = aplicarFeedLimit([antiga, recente]);
    expect(resultado[0]?.id).toBe("recente");
    expect(resultado[1]?.id).toBe("antiga");
  });

  it("NUDGE_RECOMPRA (prioridade 4) não aparece se há 3+ de prioridade menor", () => {
    const input = [
      makeInteracao("ALERTA_REGRESSAO", dia(0), "alerta"),  // p1
      makeInteracao("MARCO_ALCANCADO", dia(1), "marco"),    // p1
      makeInteracao("CHECKIN_SEMANAL", dia(2), "checkin"),  // p2
      makeInteracao("NUDGE_RECOMPRA", dia(3), "nudge"),     // p4 — não cabe
    ];
    const resultado = aplicarFeedLimit(input);
    const tipos = resultado.map((i) => i.tipo);
    expect(tipos).not.toContain("NUDGE_RECOMPRA");
    expect(resultado).toHaveLength(3);
  });

  it("não muta o array original", () => {
    const input = [
      makeInteracao("LEMBRETE_MANHA"),
      makeInteracao("NUDGE_RECOMPRA"),
      makeInteracao("ALERTA_REGRESSAO"),
      makeInteracao("CHECKIN_SEMANAL"),
    ];
    const ordemOriginal = input.map((i) => i.tipo);
    aplicarFeedLimit(input);
    expect(input.map((i) => i.tipo)).toEqual(ordemOriginal);
  });

  // ── assertFeedValido ───────────────────────────────────────────────────────

  it("assertFeedValido lança erro descritivo com 4 interações", () => {
    const input = [
      makeInteracao("LEMBRETE_MANHA", dia(0), "a"),
      makeInteracao("LEMBRETE_NOITE", dia(1), "b"),
      makeInteracao("NUDGE_RECOMPRA", dia(2), "c"),
      makeInteracao("CHECKIN_SEMANAL", dia(3), "d"),
    ];
    expect(() => assertFeedValido(input)).toThrow("FeedLimitGuard violado");
    expect(() => assertFeedValido(input)).toThrow("4 cards");
  });

  it("assertFeedValido não lança com 3 interações", () => {
    const input = [
      makeInteracao("LEMBRETE_MANHA", dia(0), "a"),
      makeInteracao("LEMBRETE_NOITE", dia(1), "b"),
      makeInteracao("NUDGE_RECOMPRA", dia(2), "c"),
    ];
    expect(() => assertFeedValido(input)).not.toThrow();
  });

  it("assertFeedValido não lança com 0 interações", () => {
    expect(() => assertFeedValido([])).not.toThrow();
  });

  // ── Composição: aplicar + assert ───────────────────────────────────────────

  it("aplicarFeedLimit + assertFeedValido nunca falha com qualquer input válido", () => {
    const inputs = [
      [],
      [makeInteracao("LEMBRETE_MANHA")],
      Array.from({ length: 10 }, (_, i) => makeInteracao("NUDGE_RECOMPRA", dia(i), String(i))),
      Array.from({ length: 3 }, (_, i) => makeInteracao("ALERTA_REGRESSAO", dia(i), String(i))),
    ];

    for (const input of inputs) {
      const resultado = aplicarFeedLimit(input);
      expect(() => assertFeedValido(resultado)).not.toThrow();
      expect(resultado.length).toBeLessThanOrEqual(FEED_MAX_CARDS);
    }
  });
});
