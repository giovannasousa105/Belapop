/**
 * INVARIANTE DE SUPRESSÃO — toda tentativa de envio passa por aqui.
 * Nenhum e-mail é enfileirado sem passar pelo SuppressionGuard.
 * Transacionais nunca são suprimidos por preferência ou limite diário —
 * apenas por bounce hard ou spam report.
 */

import { Redis } from "ioredis";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  FLUXOS_TRANSACIONAIS,
  FLUXO_COOLDOWN_HORAS,
  MAX_NAO_TRANSACIONAIS_POR_DIA,
  type FluxoEnum,
  type GrupoEnum,
} from "./crmTypes";

const GRUPO_PREFS_CAMPO: Record<GrupoEnum, string> = {
  TRANSACIONAL: "aceita_transacional",
  LIFECYCLE:    "aceita_lifecycle",
  PELE:         "aceita_pele",
  EDITORIAL:    "aceita_editorial",
};

function diaKey(user_id: string, dia: string): string {
  return `crm:diario:${user_id}:${dia}`;
}
function cooldownKey(user_id: string, fluxo: FluxoEnum, sufixo?: string): string {
  return sufixo
    ? `crm:cd:${user_id}:${fluxo}:${sufixo}`
    : `crm:cd:${user_id}:${fluxo}`;
}

function getTimezoneOffsetMs(timezone: string, date: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric", hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  const tzTime = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return tzTime - date.getTime();
}

export async function verificarSupressao(
  email: string,
  user_id: string,
  fluxo: FluxoEnum,
  grupo: GrupoEnum,
  agora: Date,
  redis: Redis,
  produto_id?: string
): Promise<{ permitido: boolean; motivo?: string; reagendar_em?: Date }> {
  const admin = getSupabaseAdminClient();
  const isTransacional = FLUXOS_TRANSACIONAIS.has(fluxo);

  // 1. Bounce hard ou spam report — bloqueia TUDO
  const { data: bloqueio } = await admin
    .from("crm_supressoes")
    .select("id")
    .eq("email", email)
    .in("motivo", ["BOUNCE_HARD", "SPAM_REPORT"])
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  if (bloqueio) return { permitido: false, motivo: "BOUNCE_HARD_OU_SPAM" };

  // 2. Unsubscribe geral (fluxo IS NULL) — bloqueia tudo exceto PEDIDO_CONFIRMADO
  const { data: unsub } = await admin
    .from("crm_supressoes")
    .select("id")
    .eq("email", email)
    .eq("motivo", "UNSUBSCRIBE")
    .is("fluxo", null)
    .eq("ativo", true)
    .maybeSingle();

  if (unsub && fluxo !== "PEDIDO_CONFIRMADO") {
    return { permitido: false, motivo: "UNSUBSCRIBE_GERAL" };
  }

  // 3. Unsubscribe por grupo
  const { data: unsubGrupo } = await admin
    .from("crm_supressoes")
    .select("id")
    .eq("email", email)
    .eq("motivo", "UNSUBSCRIBE")
    .eq("fluxo", fluxo)
    .eq("ativo", true)
    .maybeSingle();

  if (unsubGrupo) return { permitido: false, motivo: "UNSUBSCRIBE_FLUXO" };

  // 4. Transacionais passam sem mais verificações
  if (isTransacional) return { permitido: true };

  // 5. Preferência desativada para o grupo
  const { data: prefs } = await admin
    .from("crm_preferencias")
    .select("aceita_lifecycle, aceita_pele, aceita_editorial, horario_inicio, horario_fim, timezone")
    .eq("user_id", user_id)
    .maybeSingle();

  if (prefs) {
    const campoPrefs = GRUPO_PREFS_CAMPO[grupo];
    if (campoPrefs !== "aceita_transacional" && prefs[campoPrefs as keyof typeof prefs] === false) {
      return { permitido: false, motivo: "PREFERENCIA_DESATIVADA" };
    }

    // 6. Horário permitido (não-transacionais)
    const horarioInicio = prefs.horario_inicio as string ?? "08:00";
    const horarioFim    = prefs.horario_fim as string ?? "21:00";
    const timezone      = prefs.timezone as string ?? "America/Sao_Paulo";
    const offsetMs      = getTimezoneOffsetMs(timezone, agora);
    const agoraLocal    = new Date(agora.getTime() + offsetMs);
    const horaAtual     = agoraLocal.getUTCHours() * 60 + agoraLocal.getUTCMinutes();
    const [hI, mI]      = horarioInicio.split(":").map(Number);
    const [hF, mF]      = horarioFim.split(":").map(Number);
    const inicioMin     = (hI ?? 8) * 60 + (mI ?? 0);
    const fimMin        = (hF ?? 21) * 60 + (mF ?? 0);

    if (horaAtual < inicioMin || horaAtual >= fimMin) {
      // Calcular próxima janela
      const reagendar = new Date(agora);
      if (horaAtual >= fimMin) reagendar.setUTCDate(reagendar.getUTCDate() + 1);
      reagendar.setUTCHours(Math.floor(inicioMin / 60), inicioMin % 60, 0, 0);
      const reagendarUTC = new Date(reagendar.getTime() - offsetMs);
      return { permitido: false, motivo: "FORA_HORARIO", reagendar_em: reagendarUTC };
    }
  }

  // 7. Max 1 não-transacional por dia (Redis)
  const dia = agora.toISOString().slice(0, 10);
  const countStr = await redis.get(diaKey(user_id, dia));
  if (countStr && parseInt(countStr, 10) >= MAX_NAO_TRANSACIONAIS_POR_DIA) {
    return { permitido: false, motivo: "LIMITE_DIARIO" };
  }

  // 8. Cooldown por fluxo (Redis)
  const cooldownHoras = FLUXO_COOLDOWN_HORAS[fluxo];
  if (cooldownHoras) {
    const sufixo = produto_id ?? undefined;
    const ttl = await redis.ttl(cooldownKey(user_id, fluxo, sufixo));
    if (ttl > 0) return { permitido: false, motivo: "COOLDOWN_FLUXO" };
  }

  return { permitido: true };
}

export async function registrarEnvio(
  user_id: string,
  fluxo: FluxoEnum,
  redis: Redis,
  agora: Date = new Date(),
  produto_id?: string
): Promise<void> {
  const isTransacional = FLUXOS_TRANSACIONAIS.has(fluxo);
  const pipe = redis.pipeline();

  if (!isTransacional) {
    const dia = agora.toISOString().slice(0, 10);
    pipe.incr(diaKey(user_id, dia));
    pipe.expire(diaKey(user_id, dia), 86400);
  }

  const cooldownHoras = FLUXO_COOLDOWN_HORAS[fluxo];
  if (cooldownHoras) {
    const sufixo = produto_id ?? undefined;
    pipe.set(cooldownKey(user_id, fluxo, sufixo), "1", "EX", cooldownHoras * 3600);
  }

  await pipe.exec();
}
