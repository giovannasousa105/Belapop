import { enfileirar } from "@/lib/crm/deliveryQueue";

export async function enviarPedidoEnviado(params: {
  user_id: string;
  email: string;
  numero_pedido: string;
  codigo_rastreio: string;
  transportadora: string;
  previsao_entrega?: string;
}) {
  await enfileirar({
    user_id: params.user_id,
    email: params.email,
    fluxo: "PEDIDO_ENVIADO",
    template_id: "PedidoEnviado",
    subject: `Seu pedido #${params.numero_pedido} foi enviado`,
    metadata: {
      numero_pedido: params.numero_pedido,
      codigo_rastreio: params.codigo_rastreio,
      transportadora: params.transportadora,
      previsao_entrega: params.previsao_entrega,
    },
  });
}

export async function enviarPedidoConfirmado(params: {
  user_id: string;
  email: string;
  pedido_id: string;
  numero_pedido: string;
  itens: { nome: string; foto: string | null; slug: string; preco_brl: number; quantidade: number }[];
  subtotal_brl: number;
  frete_brl: number;
  total_brl: number;
  pontos_ganhos?: number;
  tier_atual?: string;
  endereco_entrega?: string;
  previsao_entrega?: string;
}) {
  await enfileirar({
    user_id: params.user_id,
    email: params.email,
    fluxo: "PEDIDO_CONFIRMADO",
    template_id: "PedidoConfirmado",
    subject: `Pedido #${params.numero_pedido} confirmado`,
    metadata: {
      numero_pedido: params.numero_pedido,
      itens: params.itens,
      subtotal_brl: params.subtotal_brl,
      frete_brl: params.frete_brl,
      total_brl: params.total_brl,
      pontos_ganhos: params.pontos_ganhos,
      tier_atual: params.tier_atual,
      endereco_entrega: params.endereco_entrega,
      previsao_entrega: params.previsao_entrega,
    },
  });
}

export async function enviarScanResultado(params: {
  user_id: string;
  email: string;
  scan_id: string;
  tipo_pele?: string;
  nivel_sensibilidade?: number;
  marcadores?: { label: string; score: number; delta?: number }[];
  ativos_recomendados?: string[];
  produtos_rotina?: { nome: string; foto: string | null; slug: string }[];
  resumo_copilot?: string;
}) {
  await enfileirar({
    user_id: params.user_id,
    email: params.email,
    fluxo: "SCAN_RESULTADO",
    template_id: "ScanResultado",
    subject: "Seu diagnóstico de pele chegou",
    metadata: {
      scan_id: params.scan_id,
      tipo_pele: params.tipo_pele,
      nivel_sensibilidade: params.nivel_sensibilidade,
      marcadores: params.marcadores,
      ativos_recomendados: params.ativos_recomendados,
      produtos_rotina: params.produtos_rotina,
      resumo_copilot: params.resumo_copilot,
    },
  });
}

export async function enviarBoasVindasPopClub(params: {
  user_id: string;
  email: string;
  nome?: string;
  tier_inicial?: string;
  pontos_iniciais?: number;
  credito_boas_vindas_brl?: number;
}) {
  await enfileirar({
    user_id: params.user_id,
    email: params.email,
    fluxo: "POPCLUB_BOAS_VINDAS",
    template_id: "PopClubBoasVindas",
    subject: "Bem-vinda ao PopClub",
    metadata: {
      nome: params.nome,
      tier_inicial: params.tier_inicial,
      pontos_iniciais: params.pontos_iniciais,
      credito_boas_vindas_brl: params.credito_boas_vindas_brl,
    },
  });
}

export async function enviarPromocaoTier(params: {
  user_id: string;
  email: string;
  nome?: string;
  tier_novo: string;
  tier_anterior: string;
  pontos_atuais?: number;
  beneficios_novos?: string[];
  credito_promocao_brl?: number;
}) {
  const TIER_L: Record<string, string> = { ESSENCIAL: "Essencial", PREMIUM: "Premium", LUXO: "Luxo" };
  await enfileirar({
    user_id: params.user_id,
    email: params.email,
    fluxo: "POPCLUB_PROMOCAO_TIER",
    template_id: "PopClubPromocaoTier",
    subject: `Você subiu para o tier ${TIER_L[params.tier_novo] ?? params.tier_novo}`,
    metadata: {
      nome: params.nome,
      tier_novo: params.tier_novo,
      tier_anterior: params.tier_anterior,
      pontos_atuais: params.pontos_atuais,
      beneficios_novos: params.beneficios_novos,
      credito_promocao_brl: params.credito_promocao_brl,
    },
  });
}
