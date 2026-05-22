import type { Redis } from "ioredis";
import { CADENCE_MAP, ALTA_PRIORIDADE, type InteracaoTipo } from "./copilotTypes";

const MAX_INTERACOES_POR_DIA = 3;

// ─── Helpers de chave e calendário ───────────────────────────────────────────

function semanaISO(data: Date): string {
  const d = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}

function proximaSegundaUnixSec(agora: Date): number {
  const d = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
  const diasParaSegunda = ((1 - d.getUTCDay() + 7) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + diasParaSegunda);
  return Math.floor(d.getTime() / 1000);
}

function diaISOKey(agora: Date): string {
  return agora.toISOString().slice(0, 10);
}

function cooldownKey(user_id: string, tipo: InteracaoTipo): string {
  return `copilot:cooldown:${user_id}:${tipo}`;
}

function semanaKey(user_id: string, tipo: InteracaoTipo, semana: string): string {
  return `copilot:semana:${user_id}:${tipo}:${semana}`;
}

function diaKey(user_id: string, dia: string): string {
  return `copilot:dia:${user_id}:${dia}`;
}

// ─── Chave de cooldown por produto (NUDGE_RECOMPRA por produto_id) ────────────

export function nudgeRecompraCooldownKey(user_id: string, produto_id: string): string {
  return `copilot:cooldown:${user_id}:NUDGE_RECOMPRA:${produto_id}`;
}

export function recompraRecusadaKey(user_id: string, produto_id: string): string {
  return `copilot:recompra:recusada:${user_id}:${produto_id}`;
}

// ─── podeEnviar ───────────────────────────────────────────────────────────────
//
// Usa pipeline Redis para batchear os lookups de um tipo em uma única roundtrip.
// Para ALTA_PRIORIDADE (prioridade 1): ignora o limite diário combinado.
// Garante: ALERTA_REGRESSAO / MARCO_ALCANCADO nunca bloqueados por cooldown
// de LEMBRETE ou outros tipos — apenas o cooldown do próprio tipo se aplica.

export async function podeEnviar(
  user_id: string,
  tipo: InteracaoTipo,
  redis: Redis,
  agora: Date = new Date()
): Promise<{ permitido: boolean; proxima_em?: Date }> {
  const rule = CADENCE_MAP.get(tipo);
  if (!rule) return { permitido: false };

  const isAltaPrioridade = ALTA_PRIORIDADE.has(tipo);
  const semana = semanaISO(agora);
  const dia = diaISOKey(agora);

  const pipe = redis.pipeline();
  // idx 0: TTL do cooldown próprio (ou PING se cooldown_horas === 0)
  if (rule.cooldown_horas > 0) {
    pipe.ttl(cooldownKey(user_id, tipo));
  } else {
    pipe.ping();
  }
  // idx 1: contador semanal do tipo
  pipe.get(semanaKey(user_id, tipo, semana));
  // idx 2: total do dia (apenas se não é alta prioridade)
  if (!isAltaPrioridade) {
    pipe.get(diaKey(user_id, dia));
  }

  const results = await pipe.exec();
  if (!results) return { permitido: false };

  let idx = 0;

  // Cooldown próprio
  if (rule.cooldown_horas > 0) {
    const ttl = results[idx]?.[1] as number;
    idx++;
    if (ttl > 0) {
      return {
        permitido: false,
        proxima_em: new Date(agora.getTime() + ttl * 1000),
      };
    }
  } else {
    idx++;
  }

  // Limite semanal
  const countSemanaStr = results[idx]?.[1] as string | null;
  idx++;
  const countSemana = countSemanaStr ? parseInt(countSemanaStr, 10) : 0;
  if (countSemana >= rule.max_por_semana) {
    return {
      permitido: false,
      proxima_em: new Date(proximaSegundaUnixSec(agora) * 1000),
    };
  }

  // Limite diário combinado (ignorado para alta prioridade)
  if (!isAltaPrioridade) {
    const countDiaStr = results[idx]?.[1] as string | null;
    const countDia = countDiaStr ? parseInt(countDiaStr, 10) : 0;
    if (countDia >= MAX_INTERACOES_POR_DIA) {
      return { permitido: false };
    }
  }

  return { permitido: true };
}

// ─── registrarEnvio ───────────────────────────────────────────────────────────
//
// Chamado apenas após persistência confirmada na DB.
// Pipeline único para mínimo de roundtrips.

export async function registrarEnvio(
  user_id: string,
  tipo: InteracaoTipo,
  redis: Redis,
  agora: Date = new Date()
): Promise<void> {
  const rule = CADENCE_MAP.get(tipo);
  if (!rule) return;

  const semana = semanaISO(agora);
  const dia = diaISOKey(agora);
  const pipe = redis.pipeline();

  if (rule.cooldown_horas > 0) {
    pipe.set(cooldownKey(user_id, tipo), "1", "EX", rule.cooldown_horas * 3600);
  }

  const keySemana = semanaKey(user_id, tipo, semana);
  pipe.incr(keySemana);
  pipe.expireat(keySemana, proximaSegundaUnixSec(agora));

  // Incrementa contador diário combinado
  const keyDia = diaKey(user_id, dia);
  pipe.incr(keyDia);
  pipe.expire(keyDia, 86400);

  await pipe.exec();
}

// ─── podeEnviarNudgeProduto ───────────────────────────────────────────────────
//
// Cooldown de 720h por produto específico — separado do tipo genérico.

export async function podeEnviarNudgeProduto(
  user_id: string,
  produto_id: string,
  redis: Redis,
  agora: Date = new Date()
): Promise<boolean> {
  const NUDGE_RECOMPRA_HORAS = 720;
  const recusadaKey = recompraRecusadaKey(user_id, produto_id);
  const nudgeKey = nudgeRecompraCooldownKey(user_id, produto_id);

  const pipe = redis.pipeline();
  pipe.ttl(nudgeKey);
  pipe.exists(recusadaKey);

  const results = await pipe.exec();
  if (!results) return false;

  const ttlNudge = results[0]?.[1] as number;
  const recusada = results[1]?.[1] as number;

  if (ttlNudge > 0) return false;  // ainda no cooldown de recompra
  if (recusada > 0) return false;  // usuária recusou este produto

  // Verificar limite diário combinado
  const dia = diaISOKey(agora);
  const countStr = await redis.get(diaKey(user_id, dia));
  if (countStr && parseInt(countStr, 10) >= MAX_INTERACOES_POR_DIA) return false;

  return true;
}

export async function registrarNudgeProduto(
  user_id: string,
  produto_id: string,
  redis: Redis,
  agora: Date = new Date()
): Promise<void> {
  const NUDGE_RECOMPRA_HORAS = 720;
  const dia = diaISOKey(agora);
  const pipe = redis.pipeline();

  pipe.set(nudgeRecompraCooldownKey(user_id, produto_id), "1", "EX", NUDGE_RECOMPRA_HORAS * 3600);

  const keyDia = diaKey(user_id, dia);
  pipe.incr(keyDia);
  pipe.expire(keyDia, 86400);

  await pipe.exec();
}

// ─── consistência semanal ─────────────────────────────────────────────────────

export async function incrementarConsistenciaSemanal(
  user_id: string,
  periodo: "manha" | "noite",
  redis: Redis,
  agora: Date = new Date()
): Promise<number> {
  const semana = semanaISO(agora);
  const key = `copilot:consistencia:${user_id}:${semana}:${periodo}`;
  const pipe = redis.pipeline();
  pipe.incr(key);
  pipe.expireat(key, proximaSegundaUnixSec(agora) + 86400); // guarda até a segunda seguinte
  const results = await pipe.exec();
  return (results?.[0]?.[1] as number) ?? 0;
}

export async function calcularConsistenciaSemanalPct(
  user_id: string,
  redis: Redis,
  agora: Date = new Date()
): Promise<number> {
  const semana = semanaISO(agora);
  const [manhaStr, noiteStr] = await redis.mget(
    `copilot:consistencia:${user_id}:${semana}:manha`,
    `copilot:consistencia:${user_id}:${semana}:noite`
  );
  const manha = manhaStr ? parseInt(manhaStr, 10) : 0;
  const noite = noiteStr ? parseInt(noiteStr, 10) : 0;
  const total = manha + noite;
  return Math.min(100, Math.round((total / 14) * 100));
}
