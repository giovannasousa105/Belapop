/**
 * Ponto de entrada único para todos os guards do Skin Copilot.
 *
 * Importar SEMPRE daqui, nunca dos arquivos individuais:
 *   import { verificarCooldown, aplicarFeedLimit, useOptimisticResposta }
 *     from '@/lib/copilot/guards'
 *
 * Isso garante que refatorações futuras têm um único ponto de mudança
 * e que o CI pode verificar que nenhum arquivo externo importa
 * os módulos individuais diretamente.
 */

// ── Invariante 1: Cooldown via Redis ─────────────────────────────────────────
export {
  verificarCooldown,
  registrarEnvio,
  registrarRecompraRecusada,
  produtoRecusadoRecentemente,
  cdKey,
  wkKey,
  recompraKey,
  semanaAtual,
  proximaSegundaUTC,
  type CooldownResult,
} from "./cooldownGuard";

// ── Invariante 2: Limite de 3 cards no feed ───────────────────────────────────
export {
  aplicarFeedLimit,
  assertFeedValido,
  FEED_MAX_CARDS,
  type FeedLimitado,
} from "./feedLimitGuard";

// ── Invariante 3: Resposta otimista (fire-and-forget) ─────────────────────────
export {
  useOptimisticResposta,
  type RespostaPayload,
  type UseOptimisticRespostaReturn,
} from "./optimisticResponse";
