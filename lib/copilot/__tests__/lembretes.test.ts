/**
 * lembretes.test.ts
 *
 * Testa templates síncronos de lembretes.
 * Sem Claude API, sem I/O — puro.
 */

import { gerarLembrete, marcadorFocoLabel } from "../templates/lembretes";
import type { LembreteContext } from "../templates/lembretes";
import type { InteracaoTipo } from "../copilotTypes";

const BASE: LembreteContext = {
  tipo:         "LEMBRETE_MANHA",
  nome:         "Ana",
  periodo:      "manha",
  rotina:       [{ passo: "1", produto_nome: "Sérum Vitamina C" }],
  streak_dias:  0,
  marcador_foco: "acne",
  mensagem_fallback: "Sua rotina está funcionando.",
};

// ─── streak variations ────────────────────────────────────────────────────────

describe("gerarLembrete — LEMBRETE_MANHA por streak", () => {
  test("streak 0 (0–2): título sem número de dias", () => {
    const { titulo } = gerarLembrete({ ...BASE, streak_dias: 0 });
    expect(titulo).not.toMatch(/\d+ dias/);
    expect(titulo.length).toBeGreaterThan(0);
  });

  test("streak 2 (borda 0–2): título sem número de dias", () => {
    const { titulo } = gerarLembrete({ ...BASE, streak_dias: 2 });
    expect(titulo).not.toMatch(/\d+ dias/);
  });

  test("streak 7 (7–20): título contém '7 dias'", () => {
    const { titulo } = gerarLembrete({ ...BASE, streak_dias: 7 });
    expect(titulo).toContain("7 dias");
  });

  test("streak 15 (7–20): título contém '15 dias'", () => {
    const { titulo } = gerarLembrete({ ...BASE, streak_dias: 15 });
    expect(titulo).toContain("15 dias");
  });

  test("streak 21 (21+): título contém '3 semanas'", () => {
    const { titulo } = gerarLembrete({ ...BASE, streak_dias: 21 });
    expect(titulo).toContain("3 semanas");
  });

  test("streak 42 (21+): título contém '3 semanas'", () => {
    const { titulo } = gerarLembrete({ ...BASE, streak_dias: 42 });
    expect(titulo).toContain("3 semanas");
  });
});

describe("gerarLembrete — LEMBRETE_NOITE", () => {
  const CTX_NOITE: LembreteContext = { ...BASE, tipo: "LEMBRETE_NOITE", periodo: "noite" };

  test("streak 0–2: título 'Rotina noturna'", () => {
    const { titulo } = gerarLembrete({ ...CTX_NOITE, streak_dias: 0 });
    expect(titulo).toBe("Rotina noturna");
  });

  test("streak 3+: título 'Boa noite, Ana'", () => {
    const { titulo } = gerarLembrete({ ...CTX_NOITE, streak_dias: 5 });
    expect(titulo).toBe("Boa noite, Ana");
  });
});

// ─── rotina vazia ─────────────────────────────────────────────────────────────

describe("rotina vazia", () => {
  test("corpo não quebra quando rotina está vazia (usa fallback de produto)", () => {
    const { corpo } = gerarLembrete({ ...BASE, rotina: [] });
    expect(corpo.length).toBeGreaterThan(0);
    expect(corpo).not.toContain("undefined");
    expect(corpo).not.toContain("null");
  });
});

// ─── nome null ────────────────────────────────────────────────────────────────

describe("nome null", () => {
  test("streak 3–6: usa 'você' em vez de null", () => {
    const { titulo } = gerarLembrete({ ...BASE, nome: null, streak_dias: 5 });
    // Variante 3–6 usa nome: "Bom dia, {nome}"
    expect(titulo).toContain("você");
    expect(titulo).not.toContain("null");
  });

  test("noite streak 3+: usa 'você'", () => {
    const { titulo } = gerarLembrete({
      ...BASE, tipo: "LEMBRETE_NOITE", periodo: "noite",
      nome: null, streak_dias: 5,
    });
    expect(titulo).toContain("você");
    expect(titulo).not.toContain("null");
  });

  test("BOAS_VINDAS com nome null: usa 'você'", () => {
    const { titulo } = gerarLembrete({ ...BASE, tipo: "BOAS_VINDAS", nome: null });
    expect(titulo).not.toContain("null");
    expect(titulo).toContain("você");
  });
});

// ─── marcadorFocoLabel ────────────────────────────────────────────────────────

describe("marcadorFocoLabel", () => {
  test.each([
    ["acne",         "Acne"],
    ["oleosidade",   "Oleosidade"],
    ["poros",        "Poros"],
    ["textura",      "Textura"],
    ["pigmentacao",  "Pigmentação"],
    ["vermelhidao",  "Vermelhidão"],
    ["ressecamento", "Ressecamento"],
  ])("%s → %s", (input, expected) => {
    expect(marcadorFocoLabel(input)).toBe(expected);
  });

  test("marcador inválido → 'Sua pele'", () => {
    expect(marcadorFocoLabel("banana")).toBe("Sua pele");
    expect(marcadorFocoLabel("")).toBe("Sua pele");
    expect(marcadorFocoLabel("unknown_marker")).toBe("Sua pele");
  });
});

// ─── todos os 8 InteracaoTipo retornam resultado não-vazio ────────────────────

describe("todos os InteracaoTipo retornam { titulo, corpo } não-vazios", () => {
  const TODOS: InteracaoTipo[] = [
    "LEMBRETE_MANHA", "LEMBRETE_NOITE", "CHECKIN_SEMANAL",
    "NUDGE_RECOMPRA", "ALERTA_REGRESSAO", "LEMBRETE_SCAN",
    "MARCO_ALCANCADO", "BOAS_VINDAS",
  ];

  test.each(TODOS)("%s", (tipo) => {
    const ctx: LembreteContext = {
      ...BASE,
      tipo,
      periodo: tipo === "LEMBRETE_NOITE" ? "noite" : "manha",
    };
    const { titulo, corpo } = gerarLembrete(ctx);
    expect(titulo.length).toBeGreaterThan(0);
    expect(corpo.length).toBeGreaterThan(0);
    expect(titulo).not.toContain("undefined");
    expect(corpo).not.toContain("undefined");
  });
});
