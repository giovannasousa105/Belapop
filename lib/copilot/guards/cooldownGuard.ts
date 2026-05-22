/**
 * INVARIANTE DE ARQUITETURA — COOLDOWN VIA REDIS EXCLUSIVAMENTE
 *
 * Verificações de cooldown NUNCA tocam PostgreSQL.
 * Todo estado de cooldown vive no Redis com TTL explícito.
 *
 * Por quê: scheduler roda 1x/hora para todas as usuárias ativas.
 * Cooldown via banco = N SELECTs/hora onde N = usuárias ativas.
 * 10k usuárias = 240k queries/dia só para "posso enviar?".
 * Redis GET = O(1), sem índice, sem connection pool, sem lock.
 *
 * Convenção de chaves (NUNCA mudar sem migrar todas as chaves):
 *   copilot:cd:{user_id}:{tipo}            cooldown por tipo
 *   copilot:wk:{user_id}:{tipo}:{isoWeek}  contador semanal
 *   copilot:cd:recompra:{user_id}:{pid}    produto recusado
 *
 * REGRA: toda chave tem TTL. SET sem EX é erro de compilação (ver tipo).
 */

import type { Redis } from "ioredis";
import { getISOWeek, getISOWeekYear } from "date-fns";

import { CADENCE_RULES, type InteracaoTipo } from "../copilotTypes";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface CooldownResult {
  readonly permitido: boolean;
  readonly motivo?: "COOLDOWN_TIPO" | "MAX_SEMANA" | "PRODUTO_RECUSADO";
  readonly proxima_em?: Date;
  readonly ttl_s?: number;
}

// Tipo que força TTL em todo SET — nunca SET sem expiração
type RedisSetComTTL = (
  key: string,
  value: string,
  ex: "EX",
  ttl: number // segundos — obrigatório, sem default
) => Promise<string | null>;

// ─── Helpers de chave ─────────────────────────────────────────────────────────

export function cdKey(user_id: string, tipo: InteracaoTipo): string {
  return `copilot:cd:${user_id}:${tipo}`;
}

export function wkKey(user_id: string, tipo: InteracaoTipo, semana: string): string {
  return `copilot:wk:${user_id}:${tipo}:${semana}`;
}

export function recompraKey(user_id: string, produto_id: string): string {
  return `copilot:cd:recompra:${user_id}:${produto_id}`;
}

export function semanaAtual(agora: Date = new Date()): string {
  return `${getISOWeekYear(agora)}-W${String(getISOWeek(agora)).padStart(2, "0")}`;
}

export function proximaSegundaUTC(agora: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate())
  );
  const diasParaSegunda = ((1 - d.getUTCDay() + 7) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + diasParaSegunda);
  return d;
}

// ─── verificarCooldown ────────────────────────────────────────────────────────

export async function verificarCooldown(
  redis: Redis,
  user_id: string,
  tipo: InteracaoTipo,
  agora: Date = new Date()
): Promise<CooldownResult> {
  const rule = CADENCE_RULES.find((r) => r.tipo === tipo);
  if (!rule) throw new Error(`Tipo de interação desconhecido: ${tipo}`);

  // Prioridade 1 (ALERTA_REGRESSAO, MARCO_ALCANCADO): só verifica o próprio
  // cooldown — nunca bloqueadas por limite semanal de outros tipos.
  const isPrioridade1 = rule.prioridade === 1;

  // 1. Verificar cooldown do próprio tipo
  if (rule.cooldown_horas > 0) {
    const key = cdKey(user_id, tipo);
    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      return {
        permitido: false,
        motivo: "COOLDOWN_TIPO",
        proxima_em: new Date(agora.getTime() + ttl * 1000),
        ttl_s: ttl,
      };
    }
  }

  // 2. Verificar max_por_semana (pulado para prioridade 1)
  if (!isPrioridade1 && rule.max_por_semana > 0) {
    const key = wkKey(user_id, tipo, semanaAtual(agora));
    const count = parseInt((await redis.get(key)) ?? "0", 10);
    if (count >= rule.max_por_semana) {
      return {
        permitido: false,
        motivo: "MAX_SEMANA",
        proxima_em: proximaSegundaUTC(agora),
      };
    }
  }

  return { permitido: true };
}

// ─── registrarEnvio ───────────────────────────────────────────────────────────

export async function registrarEnvio(
  redis: Redis,
  user_id: string,
  tipo: InteracaoTipo,
  agora: Date = new Date()
): Promise<void> {
  const rule = CADENCE_RULES.find((r) => r.tipo === tipo);
  if (!rule) throw new Error(`Tipo de interação desconhecido: ${tipo}`);

  // SET com TTL obrigatório — o tipo RedisSetComTTL garante em compilação
  if (rule.cooldown_horas > 0) {
    const setComTTL: RedisSetComTTL = redis.set.bind(redis) as RedisSetComTTL;
    await setComTTL(cdKey(user_id, tipo), "1", "EX", rule.cooldown_horas * 3600);
  }

  // Incrementar contador semanal com expiração na próxima segunda
  const semana = semanaAtual(agora);
  const key = wkKey(user_id, tipo, semana);
  const expireAt = Math.floor(proximaSegundaUTC(agora).getTime() / 1000);

  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expireat(key, expireAt);
  await pipeline.exec();
}

// ─── Recompra recusada (cooldown por produto) ─────────────────────────────────

export async function registrarRecompraRecusada(
  redis: Redis,
  user_id: string,
  produto_id: string,
  dias = 30
): Promise<void> {
  await redis.set(recompraKey(user_id, produto_id), "1", "EX", dias * 86400);
}

export async function produtoRecusadoRecentemente(
  redis: Redis,
  user_id: string,
  produto_id: string
): Promise<boolean> {
  return (await redis.exists(recompraKey(user_id, produto_id))) === 1;
}
