/**
 * prompts.test.ts
 *
 * Verifica invariantes de todos os prompts Claude:
 *   - buildUserPrompt: string não-vazia para qualquer input
 *   - delta_abs / melhora_pts: SEMPRE positivos no texto do prompt
 *   - FALLBACK: string não-vazia
 *   - SYSTEM_PROMPT: sem tom de varejo proibido
 */

import * as checkin  from "../prompts/checkinSemanal";
import * as nudge    from "../prompts/nudgeRecompra";
import * as alerta   from "../prompts/alertaRegressao";
import * as marco    from "../prompts/marcoAlcancado";

// ─── checkinSemanal ───────────────────────────────────────────────────────────

describe("checkinSemanal", () => {
  const params: Parameters<typeof checkin.buildUserPrompt>[0] = {
    nome:             "Ana",
    marcador_foco:    "acne",
    dias_desde_scan:  21,
    ultimo_insight:   "PROGRESSO_POSITIVO",
    streak:           14,
    consistencia_pct: 85,
    notas_recentes:   [4, 4, 3],
    alerta_ativo:     false,
  };

  test("buildUserPrompt: string não-vazia", () => {
    expect(checkin.buildUserPrompt(params).trim().length).toBeGreaterThan(0);
  });

  test("buildUserPrompt: sem 'undefined' ou 'null'", () => {
    const p = checkin.buildUserPrompt(params);
    expect(p).not.toContain("undefined");
    expect(p).not.toContain("null");
  });

  test("buildUserPrompt: notas_recentes vazias → sem undefined", () => {
    const p = checkin.buildUserPrompt({ ...params, notas_recentes: [] });
    expect(p).not.toContain("undefined");
    expect(p.trim().length).toBeGreaterThan(0);
  });

  test("FALLBACK: string não-vazia", () => {
    expect(checkin.FALLBACK("acne").trim().length).toBeGreaterThan(0);
  });

  test("MAX_TOKENS e TIMEOUT_MS: definidos e positivos", () => {
    expect(checkin.MAX_TOKENS).toBeGreaterThan(0);
    expect(checkin.TIMEOUT_MS).toBeGreaterThan(0);
  });
});

// ─── nudgeRecompra ────────────────────────────────────────────────────────────

describe("nudgeRecompra", () => {
  const params: Parameters<typeof nudge.buildUserPrompt>[0] = {
    produto_nome:    "Sérum Vitamina C BelaPop",
    ativo_principal: "vitamina-c",
    dias_usados:     45,
    marcador_alvo:   "pigmentacao",
    score_atual:     38,
    delta_marcador:  12,  // POSITIVO — Math.abs já aplicado
    dias_restantes:  7,
  };

  test("buildUserPrompt: string não-vazia", () => {
    expect(nudge.buildUserPrompt(params).trim().length).toBeGreaterThan(0);
  });

  test("delta_marcador positivo no prompt — convenção interna nunca vaza", () => {
    const p = nudge.buildUserPrompt(params);
    // Deve conter o valor positivo
    expect(p).toContain("12 pontos");
    // Nunca deve ter delta negativo antes de "pontos"
    expect(p).not.toMatch(/-\d+ pontos/);
  });

  test("buildUserPrompt com delta 0: sem negativo", () => {
    const p = nudge.buildUserPrompt({ ...params, delta_marcador: 0 });
    expect(p).not.toMatch(/-\d+ pontos/);
    expect(p.trim().length).toBeGreaterThan(0);
  });

  test("FALLBACK: string não-vazia com nome do produto", () => {
    const f = nudge.FALLBACK("Sérum Vitamina C");
    expect(f).toContain("Sérum Vitamina C");
    expect(f.trim().length).toBeGreaterThan(0);
  });
});

// ─── alertaRegressao ──────────────────────────────────────────────────────────

describe("alertaRegressao", () => {
  const params: Parameters<typeof alerta.buildUserPrompt>[0] = {
    marcadores_piora:    [{ nome: "acne", delta_abs: 8 }, { nome: "oleosidade", delta_abs: 5 }],
    marcadores_estaveis: ["poros", "textura"],
    intervalo_dias:      42,
    consistencia_pct:    70,
    estacao:             "outono",
  };

  test("buildUserPrompt: string não-vazia", () => {
    expect(alerta.buildUserPrompt(params).trim().length).toBeGreaterThan(0);
  });

  test("delta_abs positivo no prompt ('+X pts') — convenção interna nunca vaza", () => {
    const p = alerta.buildUserPrompt(params);
    // Verifica que os deltas são apresentados como positivos com prefixo "+"
    expect(p).toContain("+8 pts");
    expect(p).toContain("+5 pts");
    // Nunca delta negativo
    expect(p).not.toMatch(/-\d+ pts/);
  });

  test("buildUserPrompt com consistencia_pct null: sem 'null' no texto", () => {
    const p = alerta.buildUserPrompt({ ...params, consistencia_pct: null });
    expect(p).not.toContain("null");
    expect(p.trim().length).toBeGreaterThan(0);
  });

  test("buildUserPrompt com marcadores_piora vazio: sem undefined", () => {
    const p = alerta.buildUserPrompt({ ...params, marcadores_piora: [] });
    expect(p).not.toContain("undefined");
    expect(p.trim().length).toBeGreaterThan(0);
  });

  test("FALLBACK: string não-vazia", () => {
    expect(alerta.FALLBACK().trim().length).toBeGreaterThan(0);
  });
});

// ─── marcoAlcancado ───────────────────────────────────────────────────────────

describe("marcoAlcancado", () => {
  const params: Parameters<typeof marco.buildUserPrompt>[0] = {
    marcador_nome:        "Acne",
    melhora_pts:          22,  // POSITIVO — Math.abs já aplicado
    total_scans:          5,
    semanas_desde_inicio: 24,
    consistencia_media:   85,
  };

  test("buildUserPrompt: string não-vazia", () => {
    expect(marco.buildUserPrompt(params).trim().length).toBeGreaterThan(0);
  });

  test("melhora_pts positivo no prompt — convenção interna nunca vaza", () => {
    const p = marco.buildUserPrompt(params);
    expect(p).toContain("22 pontos");
    expect(p).not.toMatch(/-\d+ pontos/);
  });

  test("FALLBACK: string com marcador e pontos", () => {
    const f = marco.FALLBACK("Acne", 22);
    expect(f).toContain("Acne");
    expect(f).toContain("22");
    expect(f.trim().length).toBeGreaterThan(0);
  });
});

// ─── SYSTEM_PROMPT: sem tom de varejo proibido ────────────────────────────────

describe("SYSTEM_PROMPT: tom proibido ausente em todos os prompts", () => {
  const prompts = [
    { nome: "checkinSemanal",  conteudo: checkin.SYSTEM_PROMPT },
    { nome: "nudgeRecompra",   conteudo: nudge.SYSTEM_PROMPT   },
    { nome: "alertaRegressao", conteudo: alerta.SYSTEM_PROMPT  },
    { nome: "marcoAlcancado",  conteudo: marco.SYSTEM_PROMPT   },
  ];

  const palavrasProibidas = ["urgente", "última chance", "corra", "não perca"];

  test.each(prompts)("$nome: sem tom de varejo", ({ nome, conteudo }) => {
    for (const palavra of palavrasProibidas) {
      expect(conteudo.toLowerCase()).not.toContain(palavra);
    }
  });

  test("nudgeRecompra SYSTEM_PROMPT: proibe linguagem de urgência comercial", () => {
    // O nudge deve incluir instrução de tom não-comercial
    const texto = nudge.SYSTEM_PROMPT.toLowerCase();
    const temInstrucaoTom = texto.includes("nunca") || texto.includes("não insistente");
    expect(temInstrucaoTom).toBe(true);
  });
});
