/**
 * slaInvariant.test.ts
 *
 * Verifica calcularSLA — função pura, sem I/O.
 * Datas fixas garantem determinismo total nos testes.
 */

import { calcularSLA } from "../slaInvariant";

// Hoje: 2026-05-18 (referência fixa para todos os testes)
const HOJE = new Date("2026-05-18T00:00:00Z");

function compraDe(diasAtras: number): Date {
  return new Date(HOJE.getTime() - diasAtras * 86_400_000);
}

// ─── Status por prazo ─────────────────────────────────────────────────────────

describe("calcularSLA — status por prazo", () => {
  test("prazo amanhã (dias_restantes=1) → status 'AMANHA'", () => {
    // compra há 4 dias, sla=5 → prazo = amanhã (May19)
    const result = calcularSLA(compraDe(4), 5, HOJE);
    expect(result.status).toBe("AMANHA");
    expect(result.dias_restantes).toBe(1);
  });

  test("prazo hoje (dias_restantes=0) → status 'AMANHA' (ainda no prazo)", () => {
    // compra há 5 dias, sla=5 → prazo = hoje (May18)
    const result = calcularSLA(compraDe(5), 5, HOJE);
    expect(result.status).toBe("AMANHA");
    expect(result.dias_restantes).toBe(0);
  });

  test("prazo ontem → status 'VENCIDO'", () => {
    // compra há 6 dias, sla=5 → prazo = ontem (May17)
    const result = calcularSLA(compraDe(6), 5, HOJE);
    expect(result.status).toBe("VENCIDO");
  });

  test("prazo em 5 dias → status 'OK'", () => {
    // compra hoje, sla=5 → prazo = May23
    const result = calcularSLA(compraDe(0), 5, HOJE);
    expect(result.status).toBe("OK");
    expect(result.dias_restantes).toBe(5);
  });

  test("prazo em 2 dias → status 'OK' (mais de 1 dia)", () => {
    // compra há 3 dias, sla=5 → prazo = May20 (2 dias)
    const result = calcularSLA(compraDe(3), 5, HOJE);
    expect(result.status).toBe("OK");
    expect(result.dias_restantes).toBe(2);
  });

  test("vencido há muito tempo → dias_restantes = 0 (nunca negativo)", () => {
    // compra há 20 dias, sla=3 → vencido há 17 dias
    const result = calcularSLA(compraDe(20), 3, HOJE);
    expect(result.status).toBe("VENCIDO");
    expect(result.dias_restantes).toBe(0);
  });
});

// ─── prazo_despacho calculado corretamente ────────────────────────────────────

describe("calcularSLA — prazo_despacho", () => {
  test("data_compra + sla_entrega_dias = prazo_despacho correto", () => {
    const data_compra = new Date("2026-05-10T00:00:00Z");
    const { prazo_despacho } = calcularSLA(data_compra, 5, HOJE);
    expect(prazo_despacho.getUTCFullYear()).toBe(2026);
    expect(prazo_despacho.getUTCMonth()).toBe(4); // maio = 4
    expect(prazo_despacho.getUTCDate()).toBe(15);
  });
});

// ─── Função pura — sem await, sem imports externos ───────────────────────────

describe("calcularSLA — invariante de pureza", () => {
  test("execução < 1ms (sem I/O)", () => {
    const inicio = performance.now();
    calcularSLA(compraDe(3), 5, HOJE);
    expect(performance.now() - inicio).toBeLessThan(1);
  });

  test("mesmas entradas sempre retornam o mesmo resultado", () => {
    const r1 = calcularSLA(compraDe(4), 5, HOJE);
    const r2 = calcularSLA(compraDe(4), 5, HOJE);
    expect(r1.status).toBe(r2.status);
    expect(r1.dias_restantes).toBe(r2.dias_restantes);
  });
});
