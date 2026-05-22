/**
 * INVARIANTE DE ARQUITETURA — SLA CALCULADO NA HORA, NUNCA ARMAZENADO
 *
 * O prazo de despacho NUNCA é armazenado em banco — calculado dinamicamente.
 *
 * Motivação: um SLA armazenado fica stale quando o seller altera `sla_entrega_dias`
 * ou quando há feriados/exceções. Calcular na hora garante que o valor exibido
 * é sempre correto e reativo à configuração atual do seller.
 *
 * calcularSLA é PURA — sem I/O, sem banco, sem Redis.
 * Totalmente testável com fixtures de data fixas.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SLAStatusTipo = "OK" | "AMANHA" | "VENCIDO";

export interface SLAStatus {
  readonly prazo_despacho:  Date;
  readonly status:          SLAStatusTipo;
  readonly dias_restantes:  number;  // 0 quando vencido
}

// ─── calcularSLA ──────────────────────────────────────────────────────────────
// Função PURA — sem await, sem imports externos.

export function calcularSLA(
  data_compra:      Date,
  sla_entrega_dias: number,
  hoje:             Date
): SLAStatus {
  const prazo = new Date(data_compra);
  prazo.setUTCDate(prazo.getUTCDate() + sla_entrega_dias);
  prazo.setUTCHours(0, 0, 0, 0);

  const hojeNormalizado = new Date(hoje);
  hojeNormalizado.setUTCHours(0, 0, 0, 0);

  const msRestantes = prazo.getTime() - hojeNormalizado.getTime();
  const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));

  let status: SLAStatusTipo;
  if (diasRestantes < 0) {
    status = "VENCIDO";
  } else if (diasRestantes <= 1) {
    status = "AMANHA";
  } else {
    status = "OK";
  }

  return {
    prazo_despacho:  prazo,
    status,
    dias_restantes:  Math.max(0, diasRestantes),
  };
}

// ─── Helpers de exibição ──────────────────────────────────────────────────────

/**
 * Retorna a cor CSS correspondente ao status de SLA.
 * Usa as variáveis do design system — nunca hardcode de cor.
 */
export function corDoSLA(status: SLAStatusTipo): string {
  switch (status) {
    case "VENCIDO": return "var(--color-text-danger)";
    case "AMANHA":  return "var(--color-text-warning)";
    case "OK":      return "var(--color-text-secondary)";
  }
}
