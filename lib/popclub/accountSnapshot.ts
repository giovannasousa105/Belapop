import { popClubTierMap, type PopClubTierId } from "@/lib/popclub/tiers";
import { getSupabaseClient } from "@/lib/supabase/client";

export type PopClubSampleStatus =
  | "eligible"
  | "not_eligible"
  | "reserved"
  | "fulfilled"
  | "reversed"
  | "waived"
  | null;

export type PopClubAccountSnapshot = {
  currentTier: PopClubTierId;
  nextTierId: PopClubTierId | null;
  pointsBalance: number;
  pointsToNextTier: number | null;
  progressBps: number;
  creditBalanceCents: number;
  latestSampleSlots: number;
  latestSampleStatus: PopClubSampleStatus;
};

type PopClubMembershipRow = {
  current_tier?: unknown;
  next_tier_id?: unknown;
  points_balance?: unknown;
  points_to_next_tier?: unknown;
  progress_bps?: unknown;
  credit_balance_cents?: unknown;
  latest_sample_slots?: unknown;
  latest_sample_status?: unknown;
};

const DEFAULT_SNAPSHOT: PopClubAccountSnapshot = {
  currentTier: "essencial",
  nextTierId: "premium",
  pointsBalance: 0,
  pointsToNextTier: 1500,
  progressBps: 0,
  creditBalanceCents: 0,
  latestSampleSlots: 0,
  latestSampleStatus: null
};

const isPopClubTierId = (value: unknown): value is PopClubTierId =>
  value === "essencial" || value === "premium" || value === "luxo";

const normalizeTierId = (value: unknown, fallback: PopClubTierId): PopClubTierId =>
  isPopClubTierId(value) ? value : fallback;

export const createEmptyPopClubAccountSnapshot = (): PopClubAccountSnapshot => ({
  ...DEFAULT_SNAPSHOT
});

export const formatPopClubPoints = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(Math.max(0, value));

export const formatPopClubCredits = (valueInCents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Math.max(0, valueInCents) / 100);

export const getPopClubNextTierLabel = (snapshot: PopClubAccountSnapshot) =>
  snapshot.nextTierId ? popClubTierMap[snapshot.nextTierId].label : null;

export const getPopClubProgressLabel = (snapshot: PopClubAccountSnapshot) => {
  const nextTierLabel = getPopClubNextTierLabel(snapshot);

  if (!nextTierLabel || snapshot.pointsToNextTier === null) {
    return "Nivel maximo ativo";
  }

  return `Faltam ${formatPopClubPoints(snapshot.pointsToNextTier)} pontos para o nivel ${nextTierLabel}`;
};

export const getPopClubSampleMessage = (snapshot: PopClubAccountSnapshot) => {
  if (snapshot.latestSampleStatus === "reversed") {
    return "O ultimo beneficio de amostra foi revertido apos ajuste financeiro do pedido.";
  }

  if (snapshot.latestSampleStatus === "eligible" && snapshot.latestSampleSlots > 0) {
    const noun = snapshot.latestSampleSlots === 1 ? "amostra premium" : "amostras premium";
    return `${snapshot.latestSampleSlots} ${noun} liberadas no ultimo pedido elegivel.`;
  }

  if (snapshot.currentTier === "essencial") {
    return "Avance para Premium ou Luxo para liberar amostras premium em pedidos elegiveis.";
  }

  return "Seu proximo pedido elegivel atualiza amostras premium conforme o nivel ativo.";
};

export const getPopClubMomentCopy = (snapshot: PopClubAccountSnapshot) => {
  if (snapshot.currentTier === "luxo") {
    return "Seu nivel Luxo sustenta prioridade maxima no concierge e recompra assistida com cesta pronta para confirmacao.";
  }

  if (snapshot.currentTier === "premium") {
    return "Seu nivel Premium ja libera fila prioritaria, creditos por progresso e amostras premium em pedidos elegiveis.";
  }

  return "Sua proxima compra elegivel abre caminho para creditos, amostras premium e prioridade no concierge.";
};

export async function getPopClubAccountSnapshot(
  userId: string
): Promise<PopClubAccountSnapshot> {
  if (!userId) {
    return createEmptyPopClubAccountSnapshot();
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("popclub_memberships")
      .select(
        [
          "current_tier",
          "next_tier_id",
          "points_balance",
          "points_to_next_tier",
          "progress_bps",
          "credit_balance_cents",
          "latest_sample_slots",
          "latest_sample_status"
        ].join(", ")
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return createEmptyPopClubAccountSnapshot();
    }

    const membership = data as PopClubMembershipRow;
    const currentTier = normalizeTierId(membership.current_tier, "essencial");
    const nextTierId = isPopClubTierId(membership.next_tier_id) ? membership.next_tier_id : null;

    return {
      currentTier,
      nextTierId,
      pointsBalance: Math.max(0, Number(membership.points_balance ?? 0)),
      pointsToNextTier:
        membership.points_to_next_tier === null
          ? null
          : Math.max(0, Number(membership.points_to_next_tier ?? 0)),
      progressBps: Math.min(10000, Math.max(0, Number(membership.progress_bps ?? 0))),
      creditBalanceCents: Math.max(0, Number(membership.credit_balance_cents ?? 0)),
      latestSampleSlots: Math.max(0, Number(membership.latest_sample_slots ?? 0)),
      latestSampleStatus: (membership.latest_sample_status ?? null) as PopClubSampleStatus
    };
  } catch {
    return createEmptyPopClubAccountSnapshot();
  }
}
