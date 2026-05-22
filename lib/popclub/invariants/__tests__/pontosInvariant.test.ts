/**
 * Testes da Invariante 1: pontos_acumulados_12m ≠ pontos_disponiveis.
 *
 * Executar: npx jest lib/popclub/invariants/__tests__/pontosInvariant.test.ts
 */

import {
  toPontosDisponiveis,
  toPontosAcumulados12m,
  calcularTierPorPontos,
  calcularProgressoTier,
  assertProgressoComLabel,
  type PontosAcumulados12m,
} from "../pontosInvariant";

describe("pontosInvariant — Grandezas independentes", () => {

  // ── Construtores ──────────────────────────────────────────────────────────

  describe("toPontosDisponiveis", () => {
    it("lança RangeError para valor negativo", () => {
      expect(() => toPontosDisponiveis(-1)).toThrow(RangeError);
      expect(() => toPontosDisponiveis(-1)).toThrow("não pode ser negativo");
    });

    it("lança TypeError para não-inteiro", () => {
      expect(() => toPontosDisponiveis(1.5)).toThrow(TypeError);
      expect(() => toPontosDisponiveis(0.1)).toThrow("deve ser inteiro");
    });

    it("aceita zero", () => {
      expect(() => toPontosDisponiveis(0)).not.toThrow();
    });

    it("aceita valor positivo inteiro", () => {
      const pts = toPontosDisponiveis(100);
      expect(pts).toBe(100);
    });
  });

  describe("toPontosAcumulados12m", () => {
    it("lança RangeError para valor negativo", () => {
      expect(() => toPontosAcumulados12m(-1)).toThrow(RangeError);
    });

    it("lança TypeError para não-inteiro", () => {
      expect(() => toPontosAcumulados12m(1.5)).toThrow(TypeError);
    });

    it("aceita zero e valores positivos inteiros", () => {
      expect(toPontosAcumulados12m(0)).toBe(0);
      expect(toPontosAcumulados12m(1500)).toBe(1500);
    });
  });

  // ── calcularTierPorPontos ─────────────────────────────────────────────────

  describe("calcularTierPorPontos", () => {
    it("retorna ESSENCIAL com 0 pts", () => {
      expect(calcularTierPorPontos(toPontosAcumulados12m(0))).toBe("ESSENCIAL");
    });

    it("retorna ESSENCIAL com 499 pts", () => {
      expect(calcularTierPorPontos(toPontosAcumulados12m(499))).toBe("ESSENCIAL");
    });

    it("retorna PREMIUM com 500 pts (limiar exato)", () => {
      expect(calcularTierPorPontos(toPontosAcumulados12m(500))).toBe("PREMIUM");
    });

    it("retorna PREMIUM com 1499 pts", () => {
      expect(calcularTierPorPontos(toPontosAcumulados12m(1499))).toBe("PREMIUM");
    });

    it("retorna LUXO com 1500 pts (limiar exato)", () => {
      expect(calcularTierPorPontos(toPontosAcumulados12m(1500))).toBe("LUXO");
    });

    it("retorna LUXO com qualquer valor acima de 1500", () => {
      expect(calcularTierPorPontos(toPontosAcumulados12m(9999))).toBe("LUXO");
    });

    // Verificação de tipo em runtime: TypeScript garante em compilação,
    // mas o teste documenta que a função espera PontosAcumulados12m.
    it("aceita APENAS PontosAcumulados12m — documentado", () => {
      const acumulados: PontosAcumulados12m = toPontosAcumulados12m(600);
      // Esta linha compila. A seguinte NÃO compilaria:
      // const disponivel = toPontosDisponiveis(600);
      // calcularTierPorPontos(disponivel); ← erro: 'PontosDisponiveis' not assignable to 'PontosAcumulados12m'
      expect(calcularTierPorPontos(acumulados)).toBe("PREMIUM");
    });
  });

  // ── calcularProgressoTier ─────────────────────────────────────────────────

  describe("calcularProgressoTier", () => {
    it("400 pts → percentual 80, pts_faltando 100, proximo_tier PREMIUM", () => {
      const progresso = calcularProgressoTier(toPontosAcumulados12m(400));
      expect(progresso.percentual).toBe(80);
      expect(progresso.pts_faltando).toBe(100);
      expect(progresso.proximo_tier).toBe("PREMIUM");
      expect(progresso.tier_atual).toBe("ESSENCIAL");
    });

    it("500 pts → tier PREMIUM, próximo LUXO, faltando 1000", () => {
      const progresso = calcularProgressoTier(toPontosAcumulados12m(500));
      expect(progresso.tier_atual).toBe("PREMIUM");
      expect(progresso.proximo_tier).toBe("LUXO");
      expect(progresso.pts_faltando).toBe(1000);
    });

    it("1500 pts → tier LUXO, proximo_tier null, percentual 100", () => {
      const progresso = calcularProgressoTier(toPontosAcumulados12m(1500));
      expect(progresso.proximo_tier).toBeNull();
      expect(progresso.percentual).toBe(100);
      expect(progresso.pts_faltando).toBe(0);
    });

    it("label_obrigatorio sempre contém 'acumulados nos últimos 12 meses'", () => {
      const casos = [0, 200, 500, 1000, 1500, 2000];
      for (const pts of casos) {
        const p = calcularProgressoTier(toPontosAcumulados12m(pts));
        expect(p.label_obrigatorio).toContain("acumulados nos últimos 12 meses");
      }
    });

    it("percentual nunca ultrapassa 100", () => {
      const progresso = calcularProgressoTier(toPontosAcumulados12m(9999));
      expect(progresso.percentual).toBeLessThanOrEqual(100);
    });

    it("pts_faltando nunca negativo", () => {
      const progresso = calcularProgressoTier(toPontosAcumulados12m(600));
      expect(progresso.pts_faltando).toBeGreaterThanOrEqual(0);
    });
  });

  // ── assertProgressoComLabel ───────────────────────────────────────────────

  describe("assertProgressoComLabel", () => {
    it("não lança para progresso válido com label correto", () => {
      const progresso = calcularProgressoTier(toPontosAcumulados12m(400));
      expect(() => assertProgressoComLabel(progresso)).not.toThrow();
    });

    it("lança erro se label_obrigatorio está vazio", () => {
      const progresso = calcularProgressoTier(toPontosAcumulados12m(400));
      const semLabel = { ...progresso, label_obrigatorio: "" };
      expect(() => assertProgressoComLabel(semLabel)).toThrow();
    });

    it("lança erro se label não contém o texto obrigatório", () => {
      const progresso = calcularProgressoTier(toPontosAcumulados12m(400));
      const labelErrado = { ...progresso, label_obrigatorio: "400 pontos" };
      expect(() => assertProgressoComLabel(labelErrado)).toThrow(
        /acumulados nos últimos 12 meses/
      );
    });
  });
});
