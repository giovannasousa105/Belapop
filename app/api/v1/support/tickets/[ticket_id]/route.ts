import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import {
  buildDeterministicKey,
  emitPlatformEvent,
  queueNotificationChannels
} from "@/lib/events/platformEventBus";
import {
  canTransitionTicketStatus,
  mapTicketMessage,
  mapTicketToPayload,
  normalizeTicketStatus,
  parseBootstrapMessage
} from "@/lib/api/v1/customer-contract";
import { loadTicketAttachmentsForUser } from "@/lib/support/attachments";

type PatchBody = {
  status?: string;
};

type TicketRow = {
  id: string;
  status: string;
  store_id?: string | null;
  created_at: string;
  sla_deadline?: string | null;
  user_id?: string | null;
  customer_id?: string | null;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  sender_role: string;
  message: string;
  created_at: string;
};

const loadTicketWithThread = async (
  admin: SupabaseClient,
  ticketId: string,
  userId: string
) => {
  const [{ data: ticket, error }, { data: messageRows, error: messagesError }] = await Promise.all([
    admin.from("support_tickets").select("*").eq("id", ticketId).eq("user_id", userId).maybeSingle(),
    admin
      .from("support_messages")
      .select("id,ticket_id,sender_role,message,created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
  ]);

  if (error) return { error: error.message, ticket: null, messages: [] as MessageRow[] };
  if (messagesError) {
    return { error: messagesError.message, ticket: null, messages: [] as MessageRow[] };
  }
  return {
    error: null,
    ticket: ticket as TicketRow | null,
    messages: (messageRows ?? []) as MessageRow[]
  };
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticket_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { ticket_id: ticketId } = await params;
  const { admin, userId } = auth.ctx;

  const { error, ticket, messages } = await loadTicketWithThread(admin, ticketId, userId);
  if (error) return NextResponse.json({ error }, { status: 500 });
  if (!ticket) return NextResponse.json({ error: "Protocolo nao encontrado." }, { status: 404 });

  const bootstrap = parseBootstrapMessage(messages[0]?.message ?? "", ticket.id);
  let attachments = bootstrap.attachments;
  try {
    const loaded = await loadTicketAttachmentsForUser(admin, ticket.id, userId);
    if (loaded.length > 0) attachments = loaded;
  } catch (attachmentError) {
    return NextResponse.json(
      {
        error:
          attachmentError instanceof Error
            ? attachmentError.message
            : "Falha ao carregar anexos do protocolo."
      },
      { status: 500 }
    );
  }
  const mappedMessages = messages.map((message) =>
    mapTicketMessage(message as unknown as Record<string, unknown>)
  );

  return NextResponse.json(
    mapTicketToPayload({
      ticket: ticket as unknown as Record<string, unknown>,
      bootstrap,
      attachments,
      messages: mappedMessages
    })
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticket_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { ticket_id: ticketId } = await params;
  const body = (await request.json().catch(() => ({}))) as PatchBody;
  const { admin, userId } = auth.ctx;

  if (!body.status) {
    return NextResponse.json({ error: "status e obrigatorio." }, { status: 400 });
  }

  const { error, ticket, messages } = await loadTicketWithThread(admin, ticketId, userId);
  if (error) return NextResponse.json({ error }, { status: 500 });
  if (!ticket) return NextResponse.json({ error: "Protocolo nao encontrado." }, { status: 404 });

  const current = normalizeTicketStatus(ticket.status);
  const next = normalizeTicketStatus(body.status);
  const hasStoreAction = messages.some((message) => {
    const sender = (message.sender_role ?? "").toLowerCase();
    return sender === "seller" || sender === "store" || sender === "admin" || sender === "support";
  });

  if (!canTransitionTicketStatus({ current, next, hasStoreAction })) {
    return NextResponse.json(
      {
        error: `Transicao de status invalida: ${current} -> ${next}.`
      },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await admin
    .from("support_tickets")
    .update({
      status: next,
      closed_at: next === "CLOSED" ? new Date().toISOString() : null
    })
    .eq("id", ticketId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Protocolo nao encontrado." }, { status: 404 });

  const eventId = await emitPlatformEvent({
    eventName: "ticket.status_changed",
    aggregateType: "ticket",
    aggregateId: ticketId,
    ticketId,
    customerUserId: userId,
    sellerId: (updated.store_id as string | null) ?? null,
    actorUserId: userId,
    payload: {
      from_status: current,
      to_status: next
    },
    idempotencyKey: buildDeterministicKey([
      "ticket.status_changed",
      ticketId,
      current,
      next,
      Date.now().toString()
    ])
  });

  await queueNotificationChannels({
    eventId,
    recipientUserId: userId,
    recipientSellerId: (updated.store_id as string | null) ?? null,
    channels: ["in_app"],
    templateKey: "support.ticket.status_changed",
    title: "Status do protocolo atualizado",
    body: `Seu protocolo agora esta em ${next}.`,
    ctaHref: `/conta/reclamacoes-suporte/${ticketId}`,
    ctaLabel: "Ver protocolo",
    metadata: {
      ticket_id: ticketId,
      from_status: current,
      to_status: next
    }
  });

  const bootstrap = parseBootstrapMessage(messages[0]?.message ?? "", ticket.id);
  let attachments = bootstrap.attachments;
  try {
    const loaded = await loadTicketAttachmentsForUser(admin, ticket.id, userId);
    if (loaded.length > 0) attachments = loaded;
  } catch (attachmentError) {
    return NextResponse.json(
      {
        error:
          attachmentError instanceof Error
            ? attachmentError.message
            : "Falha ao carregar anexos do protocolo."
      },
      { status: 500 }
    );
  }
  const mappedMessages = messages.map((message) =>
    mapTicketMessage(message as unknown as Record<string, unknown>)
  );

  return NextResponse.json(
    mapTicketToPayload({
      ticket: updated as unknown as Record<string, unknown>,
      bootstrap,
      attachments,
      messages: mappedMessages
    })
  );
}
