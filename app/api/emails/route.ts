import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  enviarPedidoConfirmado,
  enviarCarrinhoAbandonado,
  enviarPopClubBoasVindas,
  enviarPopClubPromocaoTier,
  enviarScanResultado,
} from "@/lib/crm/crmEngine";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

function requireInternalKey(request: NextRequest) {
  const key = request.headers.get("x-internal-key") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  if (!INTERNAL_API_KEY || key !== INTERNAL_API_KEY) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return null;
}

const pedidoSchema = z.object({
  type: z.literal("PEDIDO_CONFIRMADO"),
  user_id: z.string(),
  email: z.string().email(),
  payload: z.object({
    numero_pedido: z.string(),
    nome: z.string().optional(),
    itens: z.array(z.object({ nome: z.string(), foto: z.string().nullable(), preco_cents: z.number() })),
    total_cents: z.number(),
    prazo_entrega: z.string().optional(),
    pontos_ganhos: z.number().optional(),
    saldo_pontos: z.number().optional(),
    entrou_popclub: z.boolean().optional(),
    unsubscribe_url: z.string().optional(),
  }),
});

const carrinhoSchema = z.object({
  type: z.literal("CARRINHO_ABANDONADO"),
  user_id: z.string(),
  email: z.string().email(),
  payload: z.object({
    itens: z.array(z.object({ nome: z.string(), foto: z.string().nullable(), preco_cents: z.number() })),
    tempo_restante_minutos: z.number().optional(),
    checkout_url: z.string().optional(),
    versao: z.enum(["urgente", "editorial"]),
    unsubscribe_url: z.string().optional(),
  }),
});

const boasVindasSchema = z.object({
  type: z.literal("BOAS_VINDAS"),
  user_id: z.string(),
  email: z.string().email(),
  payload: z.object({
    nome: z.string().optional(),
    tier: z.string(),
    unsubscribe_url: z.string().optional(),
  }),
});

const tierUpgradeSchema = z.object({
  type: z.literal("TIER_UPGRADE"),
  user_id: z.string(),
  email: z.string().email(),
  payload: z.object({
    nome: z.string().optional(),
    tier_anterior: z.string(),
    tier_novo: z.string(),
    beneficios: z.array(z.string()),
    unsubscribe_url: z.string().optional(),
  }),
});

const scanSchema = z.object({
  type: z.literal("SCAN_RESULTADO"),
  user_id: z.string(),
  email: z.string().email(),
  payload: z.object({
    nome: z.string().optional(),
    tipo_pele: z.string(),
    nivel_sensibilidade: z.number(),
    ativos_recomendados: z.array(z.string()),
    scan_url: z.string(),
    unsubscribe_url: z.string().optional(),
  }),
});

const bodySchema = z.discriminatedUnion("type", [
  pedidoSchema,
  carrinhoSchema,
  boasVindasSchema,
  tierUpgradeSchema,
  scanSchema,
]);

export async function POST(request: NextRequest) {
  const authError = requireInternalKey(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { type, user_id, email, payload } = parsed.data;

  let envioId: string | null = null;

  switch (type) {
    case "PEDIDO_CONFIRMADO":
      envioId = await enviarPedidoConfirmado(user_id, email, payload);
      break;
    case "CARRINHO_ABANDONADO":
      envioId = await enviarCarrinhoAbandonado(user_id, email, payload);
      break;
    case "BOAS_VINDAS":
      envioId = await enviarPopClubBoasVindas(user_id, email, payload);
      break;
    case "TIER_UPGRADE":
      envioId = await enviarPopClubPromocaoTier(user_id, email, payload);
      break;
    case "SCAN_RESULTADO":
      envioId = await enviarScanResultado(user_id, email, payload);
      break;
  }

  return NextResponse.json({ ok: true, envio_id: envioId });
}
