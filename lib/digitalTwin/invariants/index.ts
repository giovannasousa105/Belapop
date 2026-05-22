/**
 * Ponto de entrada único para todas as invariantes do Skin Digital Twin.
 *
 * Importar SEMPRE daqui, nunca dos arquivos individuais:
 *   import { toSkinScore, calcularSkinDelta, calcularMarkerTrend, gerarCopilotSeed }
 *     from '@/lib/digitalTwin/invariants'
 *
 * Isso garante que refatorações futuras têm um único ponto de mudança.
 */

// ── Invariante 1: SkinScore ───────────────────────────────────────────────────
export {
  SKIN_MARKERS,
  POSITIVE_DIRECTION_MARKERS,
  MARKER_CHART_CONFIG,
  toSkinScore,
  calcularSkinDelta,
  formatDeltaParaUsuario,
  type SkinMarker,
  type SkinScore,
  type SkinScoreMap,
  type SkinDelta,
} from "./skinScoreInvariant";

// ── Invariante 2: TrendWindow ─────────────────────────────────────────────────
export {
  TREND_WINDOW,
  calcularMarkerTrend,
  assertTrendSuficiente,
  type TrendStatus,
  type MarkerTrend,
} from "./trendWindowInvariant";

// ── Invariante 3: CopilotSeed ─────────────────────────────────────────────────
export {
  gerarCopilotSeed,
  assertSeedValido,
  type InsightTipo,
  type CopilotSeed,
} from "./copilotSeedInvariant";
