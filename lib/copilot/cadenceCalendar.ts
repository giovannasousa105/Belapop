// ─── Estimativa de fim de produto ────────────────────────────────────────────
//
// Função pura — sem I/O, sem efeitos colaterais. Testável com fixtures.
// consistencia_pct: 0–100. Se usuária usa 70% dos dias, produto dura mais.

export interface EstimativaFimProduto {
  acabando: boolean;
  dias_restantes: number;
}

export function estimarFimDeProduto(params: {
  produto_id: string;
  data_compra: Date;
  duracao_media_dias: number;
  consistencia_pct: number;
  agora?: Date;
}): EstimativaFimProduto {
  const { data_compra, duracao_media_dias, consistencia_pct, agora = new Date() } = params;

  const diasUsados = Math.max(
    0,
    Math.floor((agora.getTime() - data_compra.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Consistência 70% → 70% dos dias o produto foi usado → 30% a mais de duração
  const fatorConsistencia = Math.max(0, Math.min(100, consistencia_pct)) / 100;
  const diasAjustados = diasUsados * fatorConsistencia;
  const diasRestantes = Math.max(0, Math.round(duracao_media_dias - diasAjustados));

  return {
    acabando: diasRestantes <= 10,
    dias_restantes: diasRestantes,
  };
}

// ─── Helpers de timezone ──────────────────────────────────────────────────────
//
// Usa apenas Intl — sem dependências externas.
// Invariante: funciona corretamente no Node.js onde TZ local é UTC.

function getTimezoneOffsetMs(timezone: string, date: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string): number =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  const tzTime = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24, // Intl devolve 24 para meia-noite em alguns locales
    get("minute"),
    get("second")
  );
  return tzTime - date.getTime();
}

// ─── Agendamento de horário no timezone da usuária ────────────────────────────
//
// Retorna o próximo UTC correspondente a "HH:MM" no timezone dado,
// sempre no futuro (nunca no passado).

export function calcularHorarioAgendamento(params: {
  horarioBase: string; // "07:30"
  timezone: string;
  agora: Date;
}): Date {
  const { horarioBase, timezone, agora } = params;
  const [horaStr, minStr] = horarioBase.split(":");
  const hora = parseInt(horaStr ?? "7", 10);
  const minuto = parseInt(minStr ?? "0", 10);

  const offsetMs = getTimezoneOffsetMs(timezone, agora);
  // "Agora" visto do ponto de vista do timezone local
  const agoraLocal = new Date(agora.getTime() + offsetMs);

  for (let diasOffset = 0; diasOffset <= 1; diasOffset++) {
    const candidatoLocal = new Date(agoraLocal);
    candidatoLocal.setUTCDate(candidatoLocal.getUTCDate() + diasOffset);
    candidatoLocal.setUTCHours(hora, minuto, 0, 0);
    const candidatoUTC = new Date(candidatoLocal.getTime() - offsetMs);
    if (candidatoUTC > agora) return candidatoUTC;
  }

  // Fallback seguro: +24h
  return new Date(agora.getTime() + 86400000);
}

// ─── Próximo dia útil (seg–sex) ───────────────────────────────────────────────

export function calcularProximoDiaUtil(agora: Date): Date {
  const d = new Date(agora);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

// ─── Horário de tarde para nudge de recompra ──────────────────────────────────
// 14h30 no timezone da usuária — meio do range 14h–16h especificado.

export function calcularHorarioTarde(timezone: string, agora: Date): Date {
  return calcularHorarioAgendamento({ horarioBase: "14:30", timezone, agora });
}
