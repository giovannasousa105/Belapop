/**
 * cadenceCalendar.test.ts
 *
 * Testa estimarFimDeProduto — função pura, sem I/O.
 * Critério: sem await, sem imports externos, sem banco.
 */

import { estimarFimDeProduto } from "../cadenceCalendar";

const AGORA = new Date("2026-05-18T12:00:00Z");

function compra(diasAtras: number): Date {
  return new Date(AGORA.getTime() - diasAtras * 86_400_000);
}

describe("estimarFimDeProduto", () => {
  test("consistencia 100%: dias_ajustados = dias_usados (uso total)", () => {
    // 30 dias usados, duracao 90 → 90 - 30 = 60 restantes
    const resultado = estimarFimDeProduto({
      produto_id: "prod-1",
      data_compra: compra(30),
      duracao_media_dias: 90,
      consistencia_pct: 100,
      agora: AGORA,
    });
    expect(resultado.dias_restantes).toBe(60);
    expect(resultado.acabando).toBe(false);
  });

  test("consistencia 50%: dias_ajustados = dias_usados / 2 (produto dura mais)", () => {
    // 30 dias corridos, mas só 50% de uso → 15 dias consumidos → 90 - 15 = 75 restantes
    const resultado = estimarFimDeProduto({
      produto_id: "prod-2",
      data_compra: compra(30),
      duracao_media_dias: 90,
      consistencia_pct: 50,
      agora: AGORA,
    });
    expect(resultado.dias_restantes).toBe(75);
    expect(resultado.acabando).toBe(false);
  });

  test("produto com 5 dias restantes → acabando: true (limiar ≤ 10)", () => {
    // 85 dias usados × 100% → 85 consumidos → 90 - 85 = 5 restantes
    const resultado = estimarFimDeProduto({
      produto_id: "prod-3",
      data_compra: compra(85),
      duracao_media_dias: 90,
      consistencia_pct: 100,
      agora: AGORA,
    });
    expect(resultado.dias_restantes).toBe(5);
    expect(resultado.acabando).toBe(true);
  });

  test("produto com 15 dias restantes → acabando: false (acima do limiar)", () => {
    // 75 dias usados × 100% → 75 consumidos → 90 - 75 = 15 restantes
    const resultado = estimarFimDeProduto({
      produto_id: "prod-4",
      data_compra: compra(75),
      duracao_media_dias: 90,
      consistencia_pct: 100,
      agora: AGORA,
    });
    expect(resultado.dias_restantes).toBe(15);
    expect(resultado.acabando).toBe(false);
  });

  test("limiar exato de 10 dias → acabando: true (inclusive)", () => {
    const resultado = estimarFimDeProduto({
      produto_id: "prod-5",
      data_compra: compra(80),
      duracao_media_dias: 90,
      consistencia_pct: 100,
      agora: AGORA,
    });
    expect(resultado.dias_restantes).toBe(10);
    expect(resultado.acabando).toBe(true);
  });

  test("produto recém-comprado → dias_restantes ≈ duracao_media", () => {
    const resultado = estimarFimDeProduto({
      produto_id: "prod-6",
      data_compra: compra(0),
      duracao_media_dias: 30,
      consistencia_pct: 100,
      agora: AGORA,
    });
    expect(resultado.dias_restantes).toBe(30);
    expect(resultado.acabando).toBe(false);
  });

  test("consistencia 0%: produto nunca diminui (dias_ajustados = 0)", () => {
    const resultado = estimarFimDeProduto({
      produto_id: "prod-7",
      data_compra: compra(90),
      duracao_media_dias: 90,
      consistencia_pct: 0,
      agora: AGORA,
    });
    expect(resultado.dias_restantes).toBe(90);
    expect(resultado.acabando).toBe(false);
  });

  test("produto já acabado → dias_restantes = 0, acabando: true", () => {
    const resultado = estimarFimDeProduto({
      produto_id: "prod-8",
      data_compra: compra(100),
      duracao_media_dias: 90,
      consistencia_pct: 100,
      agora: AGORA,
    });
    expect(resultado.dias_restantes).toBe(0);
    expect(resultado.acabando).toBe(true);
  });

  test("função pura — execução síncrona, sem await (< 1ms)", () => {
    const inicio = performance.now();
    estimarFimDeProduto({
      produto_id: "prod-perf",
      data_compra: compra(30),
      duracao_media_dias: 90,
      consistencia_pct: 80,
      agora: AGORA,
    });
    expect(performance.now() - inicio).toBeLessThan(1);
  });
});
