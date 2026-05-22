import { enfileirar } from "./deliveryQueue";
import type { EnfileirarParams, FluxoEnum } from "./crmTypes";

type EnfileirarBase = Omit<EnfileirarParams, "fluxo" | "template_id" | "subject">;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function send(
  base: EnfileirarBase,
  fluxo: FluxoEnum,
  template_id: string,
  subject: string,
  extra: Record<string, unknown> = {}
): Promise<string | null> {
  return enfileirar({
    ...base,
    fluxo,
    template_id,
    subject,
    metadata: { ...base.metadata, ...extra },
  });
}

// ─── Transacionais ────────────────────────────────────────────────────────────

export async function enviarPedidoConfirmado(
  user_id: string,
  email: string,
  payload: {
    numero_pedido: string;
    nome?: string;
    itens: { nome: string; foto: string | null; preco_cents: number }[];
    total_cents: number;
    prazo_entrega?: string;
    pontos_ganhos?: number;
    saldo_pontos?: number;
    entrou_popclub?: boolean;
    unsubscribe_url?: string;
  }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "PEDIDO_CONFIRMADO", "PedidoConfirmado",
    `Pedido #${payload.numero_pedido} confirmado`);
}

export async function enviarScanResultado(
  user_id: string,
  email: string,
  payload: {
    nome?: string;
    tipo_pele: string;
    nivel_sensibilidade: number;
    ativos_recomendados: string[];
    scan_url: string;
    unsubscribe_url?: string;
  }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "SCAN_RESULTADO", "ScanResultado",
    "Seu diagnóstico de pele chegou");
}

export async function enviarPopClubBoasVindas(
  user_id: string,
  email: string,
  payload: { nome?: string; tier: string; unsubscribe_url?: string }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "POPCLUB_BOAS_VINDAS", "PopClubBoasVindas",
    "Bem-vinda ao PopClub");
}

export async function enviarPopClubPromocaoTier(
  user_id: string,
  email: string,
  payload: { nome?: string; tier_anterior: string; tier_novo: string; beneficios: string[]; unsubscribe_url?: string }
): Promise<string | null> {
  const tierL: Record<string, string> = { ESSENCIAL: "Essencial", PREMIUM: "Premium", LUXO: "Luxo" };
  return send({ user_id, email, metadata: payload }, "POPCLUB_PROMOCAO_TIER", "PopClubPromocaoTier",
    `Você subiu para o tier ${tierL[payload.tier_novo] ?? payload.tier_novo}`);
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export async function enviarCarrinhoAbandonado(
  user_id: string,
  email: string,
  payload: {
    itens: { nome: string; foto: string | null; preco_cents: number }[];
    tempo_restante_minutos?: number;
    checkout_url?: string;
    versao: "urgente" | "editorial";
    produto_alternativo?: { nome: string; slug: string } | null;
    unsubscribe_url?: string;
  }
): Promise<string | null> {
  const fluxo: FluxoEnum = payload.versao === "urgente"
    ? "CARRINHO_ABANDONADO_1H"
    : "CARRINHO_ABANDONADO_24H";
  return send({ user_id, email, metadata: payload }, fluxo, "CarrinhoAbandonado",
    payload.versao === "urgente" ? "Sua reserva expira em breve" : "Sua rotina estava quase pronta");
}

export async function enviarWishlistEsgotando(
  user_id: string,
  email: string,
  payload: { produto: { nome: string; slug: string; foto: string | null; preco_cents: number }; estoque_restante: number; unsubscribe_url?: string },
  produto_id: string
): Promise<string | null> {
  return enfileirar({
    user_id, email, fluxo: "WISHLIST_ESGOTANDO", template_id: "WishlistEsgotando",
    subject: `${payload.produto.nome} está quase esgotando`,
    metadata: payload, produto_id,
  });
}

export async function enviarTierRiscoRebaixamento(
  user_id: string,
  email: string,
  payload: {
    nome?: string;
    tier_atual: string;
    tier_risco: string;
    pontos_faltando: number;
    data_avaliacao: string;
    dias_para_avaliacao: number;
    formas_ganhar?: string[];
    unsubscribe_url?: string;
  }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "TIER_RISCO_REBAIXAMENTO", "TierRiscoRebaixamento",
    `${payload.pontos_faltando} pts para manter seu tier`);
}

export async function enviarReativacao(
  user_id: string,
  email: string,
  payload: { nome?: string; dias_inativo: number; destaques: { nome: string; slug: string }[]; unsubscribe_url?: string }
): Promise<string | null> {
  const fluxo: FluxoEnum = payload.dias_inativo >= 60 ? "REATIVACAO_60D" : "REATIVACAO_30D";
  return send({ user_id, email, metadata: payload }, fluxo, "Reativacao",
    "Sentimos sua falta na BelaPop");
}

// ─── Pele ─────────────────────────────────────────────────────────────────────

export async function enviarCheckinSemanal(
  user_id: string,
  email: string,
  payload: { nome?: string; consistencia_pct: number; streak_semanas: number; dica_semana: string; unsubscribe_url?: string }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "CHECKIN_SEMANAL", "CheckinSemanal",
    "Check-in semanal da sua rotina");
}

export async function enviarProgressoTwinMensal(
  user_id: string,
  email: string,
  payload: {
    nome?: string;
    mes_ref: string;
    scores: Record<string, number>;
    evolucao: Record<string, number>;
    tipo_pele: string;
    ativos_top: string[];
    unsubscribe_url?: string;
  }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "PROGRESSO_TWIN_MENSAL", "ProgressoTwinMensal",
    "Seu progresso de pele do mês");
}

export async function enviarAlertaRegressao(
  user_id: string,
  email: string,
  payload: {
    nome?: string;
    score_regredido: string;
    variacao_pct: number;
    causa_provavel: string;
    acao_recomendada: string;
    produto?: { nome: string; slug: string } | null;
    unsubscribe_url?: string;
  }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "ALERTA_REGRESSAO", "AlertaRegressao",
    "Atenção: regressão detectada na sua pele");
}

export async function enviarLembreteScan(
  user_id: string,
  email: string,
  payload: { nome?: string; ultimo_scan_dias: number; unsubscribe_url?: string }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "LEMBRETE_SCAN", "LembreteScan",
    "Hora do seu scan mensal de pele");
}

// ─── Editorial ────────────────────────────────────────────────────────────────

export async function enviarCuradoriaSemanal(
  user_id: string,
  email: string,
  payload: { tema: string; produtos: { nome: string; slug: string; foto: string | null; preco_cents: number }[]; editorial_url?: string; unsubscribe_url?: string }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "CURADORIA_SEMANAL", "CuradoriaSemanal",
    `Curadoria da semana: ${payload.tema}`);
}

export async function enviarWaitlistProduto(
  user_id: string,
  email: string,
  payload: { produto: { nome: string; slug: string; foto: string | null; preco_cents: number }; unsubscribe_url?: string },
  produto_id: string
): Promise<string | null> {
  return enfileirar({
    user_id, email, fluxo: "WAITLIST_PRODUTO", template_id: "WaitlistProduto",
    subject: `${payload.produto.nome} voltou ao estoque`,
    metadata: payload, produto_id,
  });
}

export async function enviarLoteEsgotando(
  user_id: string,
  email: string,
  payload: { lote: { nome: string; slug: string }; vagas_restantes: number; fecha_em: string; unsubscribe_url?: string }
): Promise<string | null> {
  return send({ user_id, email, metadata: payload }, "LOTE_ESGOTANDO", "LoteEsgotando",
    `${payload.lote.nome} · últimas vagas`);
}

export async function enviarRecompraAssistida(
  user_id: string,
  email: string,
  payload: {
    produto: { nome: string; slug: string; foto: string | null; preco_cents: number };
    dias_para_acabar: number;
    alternativa?: { nome: string; slug: string } | null;
    unsubscribe_url?: string;
  },
  produto_id: string
): Promise<string | null> {
  return enfileirar({
    user_id, email, fluxo: "RECOMPRA_ASSISTIDA", template_id: "RecompraAssistida",
    subject: `${payload.produto.nome} está quase acabando`,
    metadata: payload, produto_id,
  });
}
