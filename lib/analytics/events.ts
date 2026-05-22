import posthog from "posthog-js";

import { posthogConsentidoNoClient } from "@/lib/analytics/consent";

type OrigemScan = "homepage" | "pdp" | "popclub" | "copilot";
type OrigemPdp = "busca" | "universo" | "quiz" | "copilot" | "direto";
type Urgencia = "none" | "low" | "high";

function capture(event: string, properties?: Record<string, unknown>): void {
  if (!posthogConsentidoNoClient()) return;
  posthog.capture(event, properties);
}

export function trackScanIniciado(params: {
  focos: string[];
  origem: OrigemScan;
}): void {
  capture("scan_iniciado", {
    focos_count: params.focos.length,
    focos: params.focos,
    origem: params.origem
  });
}

export function trackScanConcluido(params: {
  scan_id: string;
  duracao_ms: number;
  tipo_pele: string;
  fallback_cv: boolean;
}): void {
  capture("scan_concluido", {
    duracao_ms: params.duracao_ms,
    tipo_pele: params.tipo_pele,
    fallback_cv: params.fallback_cv
  });
}

export function trackScanErro(params: {
  etapa: "cv" | "scoring" | "recommendation" | "narrativa";
  motivo: string;
}): void {
  capture("scan_erro", params);
}

export function trackPdpVista(params: {
  produto_id: string;
  universo: string | null;
  tem_lote_ativo: boolean;
  urgencia: Urgencia;
  score_compat: number | null;
  origem: OrigemPdp;
}): void {
  capture("pdp_vista", params);
}

export function trackReservaCriada(params: {
  lote_id: string;
  produto_id: string;
  urgencia: Urgencia;
  tem_popclub: boolean;
  tem_scan: boolean;
}): void {
  capture("reserva_criada", params);
}

export function trackCheckoutAberto(params: {
  produto_id: string;
  valor_cents: number;
  tem_credito: boolean;
  credito_cents: number;
}): void {
  capture("checkout_aberto", {
    produto_id: params.produto_id,
    valor_cents: params.valor_cents,
    tem_credito: params.tem_credito,
    desconto_pct: params.tem_credito && params.valor_cents > 0
      ? Math.round((params.credito_cents / params.valor_cents) * 100)
      : 0
  });
}

export function trackPedidoConfirmado(params: {
  valor_cents: number;
  entrou_popclub: boolean;
  pontos_ganhos: number;
  canal: "web" | "mobile_web";
}): void {
  capture("pedido_confirmado", params);
}

export function trackReservaAbandonada(params: {
  produto_id: string;
  motivo: "timeout" | "cancelamento" | "pagamento_falhou";
}): void {
  capture("reserva_abandonada", params);
}

export function trackPopClubEntrada(params: {
  tier: "ESSENCIAL" | "PREMIUM" | "LUXO";
  valor_compra: number;
}): void {
  capture("popclub_entrada", params);
}

export function trackPopClubPromocao(params: {
  tier_anterior: string;
  tier_novo: string;
}): void {
  capture("popclub_promocao", params);
}

export function trackQuizIniciado(): void {
  capture("quiz_iniciado");
}

export function trackQuizConcluido(params: {
  tipo_pele_inferido: string;
  foco: string;
  investimento: string;
  clicou_scan: boolean;
}): void {
  capture("quiz_concluido", params);
}

export function trackEmailCapturado(params: {
  variante: string;
  origem: "homepage" | "pdp" | "quiz";
}): void {
  capture("email_capturado", params);
}

export function trackCopilotResposta(params: {
  tipo_interacao: string;
  tipo_resposta: string;
  tempo_ate_resp_s: number;
}): void {
  capture("copilot_respondido", {
    ...params,
    respondeu_rapido: params.tempo_ate_resp_s < 30
  });
}

export function trackWishlistAdicionado(params: {
  produto_id: string;
  tem_lote_ativo: boolean;
}): void {
  capture("wishlist_adicionado", params);
}

export function identificarUsuaria(
  userId: string,
  props: {
    tipo_pele?: string;
    tem_scan?: boolean;
    tem_popclub?: boolean;
    tier_popclub?: string | null;
  }
): void {
  if (!posthogConsentidoNoClient()) return;
  posthog.identify(userId, {
    tipo_pele: props.tipo_pele,
    tem_scan: props.tem_scan,
    tem_popclub: props.tem_popclub,
    tier: props.tier_popclub
  });
}

export function resetarIdentidade(): void {
  posthog.reset();
}
