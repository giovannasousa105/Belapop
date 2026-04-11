import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import {
  buildDeterministicKey,
  emitPlatformEvent,
  queueNotificationChannels
} from "@/lib/events/platformEventBus";
import {
  mapTicketMessage,
  mapTicketToPayload,
  normalizeDesiredResolution,
  normalizeTicketReason,
  normalizeTicketStatus,
  parseBootstrapMessage,
  type TicketAttachment
} from "@/lib/api/v1/customer-contract";
import {
  claimCustomerAttachmentsForTicket,
  isMissingRelationOrColumn,
  loadTicketAttachmentsForUser
} from "@/lib/support/attachments";
import {
  computeSupportSlaDeadlines,
  loadSupportSlaPolicy
} from "@/lib/support/sla";

type CreateTicketBody = {
  order_id?: string;
  sub_order_id?: string;
  seller_id?: string;
  store_id?: string;
  item_ids?: string[];
  reason?: string;
  description?: string;
  desired_resolution?: string;
  attachment_ids?: string[];
  attachments?: Array<{
    attachment_id?: string;
    type?: "IMAGE" | "VIDEO" | "FILE";
    filename?: string;
    url?: string;
  }>;
};

type TicketRow = {
  id: string;
  user_id?: string | null;
  customer_id?: string | null;
  store_id?: string | null;
  status: string;
  subject: string | null;
  created_at: string;
  sla_deadline?: string | null;
  first_response_due_at?: string | null;
  resolution_due_at?: string | null;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  sender_role: string;
  message: string;
  created_at: string;
};

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const mapInputAttachments = (ticketId: string, attachments: CreateTicketBody["attachments"]) => {
  const now = new Date().toISOString();
  return (attachments ?? [])
    .map((attachment, index) => {
      if (!attachment?.url) return null;
      return {
        attachment_id: attachment.attachment_id ?? `${ticketId}-att-${index + 1}`,
        type: attachment.type ?? "IMAGE",
        filename: attachment.filename ?? `attachment-${index + 1}`,
        url: attachment.url,
        uploaded_at: now
      } satisfies TicketAttachment;
    })
    .filter((attachment): attachment is TicketAttachment => Boolean(attachment));
};

const uniqueAttachmentIdsFromBody = (body: CreateTicketBody) => {
  const fromArray = Array.isArray(body.attachment_ids) ? body.attachment_ids : [];
  const fromLegacy = Array.isArray(body.attachments)
    ? body.attachments
        .map((attachment) => attachment?.attachment_id ?? "")
        .filter(Boolean)
    : [];
  return Array.from(
    new Set(
      [...fromArray, ...fromLegacy].map((value) => String(value).trim()).filter(Boolean)
    )
  );
};

const loadSellerUserId = async (
  admin: SupabaseClient,
  storeId: string | null | undefined
) => {
  if (!storeId) return null;
  const lookup = await admin
    .from("sellers")
    .select("user_id")
    .eq("id", storeId)
    .maybeSingle();
  if (lookup.error) return null;
  return (lookup.data?.user_id as string | null) ?? null;
};

export async function GET(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const params = request.nextUrl.searchParams;
  const status = normalize(params.get("status"));
  const q = normalize(params.get("q"));
  const orderId = (params.get("order_id") ?? "").trim();
  const sellerId = (params.get("seller_id") ?? params.get("store_id") ?? "").trim();
  const page = Math.max(1, Number(params.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(params.get("page_size") ?? "20")));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: ticketRows, error } = await admin
    .from("support_tickets")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tickets = (ticketRows ?? []) as TicketRow[];
  const ticketIds = tickets.map((ticket) => ticket.id);
  const { data: messageRows, error: messageError } = ticketIds.length
    ? await admin
        .from("support_messages")
        .select("id,ticket_id,sender_role,message,created_at")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });

  const messageByTicket = ((messageRows ?? []) as MessageRow[]).reduce<Record<string, MessageRow[]>>(
    (acc, row) => {
      if (!acc[row.ticket_id]) acc[row.ticket_id] = [];
      acc[row.ticket_id].push(row);
      return acc;
    },
    {}
  );

  const attachmentsByTicket: Record<string, TicketAttachment[]> = {};
  if (ticketIds.length > 0) {
    try {
      await Promise.all(
        ticketIds.map(async (ticketId) => {
          attachmentsByTicket[ticketId] = await loadTicketAttachmentsForUser(admin, ticketId, userId);
        })
      );
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Falha ao carregar anexos." },
        { status: 500 }
      );
    }
  }

  const mapped = tickets
    .map((ticket) => {
      const thread = messageByTicket[ticket.id] ?? [];
      const bootstrap = parseBootstrapMessage(thread[0]?.message ?? "", ticket.id);
      const messages = thread.map((row) => mapTicketMessage(row as unknown as Record<string, unknown>));
      return mapTicketToPayload({
        ticket: ticket as unknown as Record<string, unknown>,
        bootstrap,
        attachments: attachmentsByTicket[ticket.id] ?? bootstrap.attachments,
        messages
      });
    })
    .filter((ticket) => {
      if (status && normalize(ticket.status) !== status) return false;
      if (orderId && ticket.order_id !== orderId) return false;
      if (sellerId && ticket.seller_id !== sellerId && ticket.store_id !== sellerId) return false;
      if (!q) return true;
      return (
        normalize(ticket.protocol).includes(q) ||
        normalize(ticket.description).includes(q) ||
        normalize(ticket.reason).includes(q) ||
        normalize(ticket.order_id).includes(q)
      );
    });

  return NextResponse.json({
    page,
    page_size: pageSize,
    total: mapped.length,
    items: mapped.map((ticket) => ({
      ticket_id: ticket.ticket_id,
      protocol: ticket.protocol,
      created_at: ticket.created_at,
      order_id: ticket.order_id,
      sub_order_id: ticket.sub_order_id,
      seller_id: ticket.seller_id,
      store_id: ticket.store_id,
      reason: ticket.reason,
      desired_resolution: ticket.desired_resolution,
      status: ticket.status,
      sla: ticket.sla,
      description: ticket.description
    }))
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as CreateTicketBody;

  const description = (body.description ?? "").trim();
  if (!body.order_id || !body.reason || !description) {
    return NextResponse.json(
      { error: "order_id, reason e description sao obrigatorios." },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,customer_id")
    .eq("id", body.order_id)
    .eq("customer_id", userId)
    .maybeSingle();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Pedido invalido para este usuario." }, { status: 400 });

  let resolvedStoreId = body.seller_id ?? body.store_id ?? null;
  if (body.sub_order_id) {
    const { data: subOrder, error: subOrderError } = await admin
      .from("sub_orders")
      .select("id,order_id,seller_id")
      .eq("id", body.sub_order_id)
      .eq("order_id", body.order_id)
      .maybeSingle();

    if (subOrderError) return NextResponse.json({ error: subOrderError.message }, { status: 500 });
    if (!subOrder) {
      return NextResponse.json({ error: "sub_order_id invalido para esse pedido." }, { status: 400 });
    }
    resolvedStoreId = subOrder.seller_id;
  }

  const reason = normalizeTicketReason(body.reason);
  const desiredResolution = normalizeDesiredResolution(body.desired_resolution ?? null);
  const attachmentIds = uniqueAttachmentIdsFromBody(body);
  const nowIso = new Date().toISOString();
  const policy = await loadSupportSlaPolicy(admin, reason);
  const deadlines = computeSupportSlaDeadlines(nowIso, policy);

  let ticketInsert = await admin
    .from("support_tickets")
    .insert({
      user_id: userId,
      status: "WAITING_STORE",
      subject: `${reason} - Pedido ${body.order_id.slice(0, 8).toUpperCase()}`,
      sub_order_id: body.sub_order_id ?? null,
      store_id: resolvedStoreId,
      reason,
      desired_resolution: desiredResolution,
      first_response_due_at: deadlines.firstResponseDueAt,
      resolution_due_at: deadlines.resolutionDueAt,
      last_customer_message_at: nowIso
    })
    .select("*")
    .single();

  if (ticketInsert.error && isMissingRelationOrColumn(ticketInsert.error)) {
    ticketInsert = await admin
      .from("support_tickets")
      .insert({
        user_id: userId,
        status: "WAITING_STORE",
        subject: `${reason} - Pedido ${body.order_id.slice(0, 8).toUpperCase()}`
      })
      .select("*")
      .single();
  }

  const ticket = ticketInsert.data;
  const ticketError = ticketInsert.error;
  if (ticketError || !ticket) {
    return NextResponse.json(
      { error: ticketError?.message ?? "Nao foi possivel criar ticket." },
      { status: 500 }
    );
  }

  let attachments: TicketAttachment[] = [];
  if (attachmentIds.length > 0) {
    try {
      attachments = await claimCustomerAttachmentsForTicket(admin, {
        userId,
        ticketId: ticket.id,
        attachmentIds
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao associar anexos.";
      if (message.startsWith("attachments_invalid_or_not_owned:")) {
        return NextResponse.json(
          { error: "Anexos invalidos, expirados ou sem permissao para este usuario." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!attachments.length) {
    attachments = mapInputAttachments(ticket.id, body.attachments);
  }

  const bootstrapPayload = {
    order_id: body.order_id,
    sub_order_id: body.sub_order_id ?? null,
    seller_id: resolvedStoreId,
    store_id: resolvedStoreId,
    item_ids: body.item_ids ?? [],
    reason,
    desired_resolution: desiredResolution,
    description,
    attachments,
    attachment_ids: attachments.map((attachment) => attachment.attachment_id)
  };

  const { data: createdMessage, error: messageError } = await admin
    .from("support_messages")
    .insert({
      ticket_id: ticket.id,
      sender_role: "customer",
      message: JSON.stringify(bootstrapPayload)
    })
    .select("id,ticket_id,sender_role,message,created_at")
    .single();

  if (messageError || !createdMessage) {
    return NextResponse.json(
      { error: messageError?.message ?? "Nao foi possivel registrar a mensagem inicial." },
      { status: 500 }
    );
  }

  const sellerUserId = await loadSellerUserId(admin, resolvedStoreId);
  const eventId = await emitPlatformEvent({
    eventName: "ticket.created",
    aggregateType: "ticket",
    aggregateId: ticket.id,
    orderId: body.order_id,
    subOrderId: body.sub_order_id ?? null,
    ticketId: ticket.id,
    customerUserId: userId,
    sellerId: resolvedStoreId,
    actorUserId: userId,
    occurredAt: createdMessage.created_at,
    payload: {
      reason,
      desired_resolution: desiredResolution,
      store_id: resolvedStoreId,
      sub_order_id: body.sub_order_id ?? null
    },
    idempotencyKey: buildDeterministicKey([
      "ticket.created",
      ticket.id,
      createdMessage.id
    ])
  });

  await queueNotificationChannels({
    eventId,
    recipientUserId: userId,
    recipientSellerId: resolvedStoreId,
    channels: ["in_app", "email", "whatsapp"],
    templateKey: "support.ticket.created",
    title: "Protocolo criado com sucesso",
    body: "Recebemos sua solicitacao e ja encaminhamos para a loja.",
    ctaLabel: "Acompanhar protocolo",
    ctaHref: `/conta/reclamacoes-suporte/${ticket.id}`,
    metadata: {
      ticket_id: ticket.id,
      order_id: body.order_id,
      reason
    }
  });

  if (sellerUserId) {
    await queueNotificationChannels({
      eventId,
      recipientUserId: sellerUserId,
      recipientSellerId: resolvedStoreId,
      channels: ["in_app"],
      templateKey: "support.ticket.created.store",
      title: "Novo ticket de cliente",
      body: "Um novo protocolo foi aberto e requer sua resposta.",
      ctaLabel: "Abrir ticket",
      ctaHref: "/seller/support",
      metadata: {
        ticket_id: ticket.id,
        order_id: body.order_id,
        reason
      }
    });
  }

  const bootstrap = parseBootstrapMessage(createdMessage.message, ticket.id);
  const payload = mapTicketToPayload({
    ticket: ticket as unknown as Record<string, unknown>,
    bootstrap,
    attachments: attachments.length ? attachments : bootstrap.attachments,
    messages: [mapTicketMessage(createdMessage as unknown as Record<string, unknown>)]
  });

  return NextResponse.json(payload, { status: 201 });
}
