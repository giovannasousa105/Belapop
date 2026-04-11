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
  normalizeTicketStatus
} from "@/lib/api/v1/customer-contract";
import { isMissingRelationOrColumn } from "@/lib/support/attachments";

type CreateMessageBody = {
  text?: string;
  attachment_ids?: string[];
};

type MessageRow = {
  id: string;
  ticket_id: string;
  sender_role: string;
  message: string;
  created_at: string;
};

type TicketRow = {
  id: string;
  status: string;
  store_id?: string | null;
};

const ensureTicketOwnership = async (
  admin: SupabaseClient,
  ticketId: string,
  userId: string
) => {
  const { data: ticket, error } = await admin
    .from("support_tickets")
    .select("id,status,store_id")
    .eq("id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { error: error.message, ticket: null as TicketRow | null };
  return { error: null, ticket: (ticket as TicketRow | null) ?? null };
};

const loadSellerUserId = async (admin: SupabaseClient, storeId: string | null | undefined) => {
  if (!storeId) return null;
  const lookup = await admin
    .from("sellers")
    .select("user_id")
    .eq("id", storeId)
    .maybeSingle();
  if (lookup.error) return null;
  return (lookup.data?.user_id as string | null) ?? null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticket_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { ticket_id: ticketId } = await params;
  const { admin, userId } = auth.ctx;
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "30")));
  const cursor = request.nextUrl.searchParams.get("cursor");

  const ticketCheck = await ensureTicketOwnership(admin, ticketId, userId);
  if (ticketCheck.error) return NextResponse.json({ error: ticketCheck.error }, { status: 500 });
  if (!ticketCheck.ticket) return NextResponse.json({ error: "Protocolo nao encontrado." }, { status: 404 });

  let query = admin
    .from("support_messages")
    .select("id,ticket_id,sender_role,message,created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (cursor) query = query.gt("created_at", cursor);
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = ((data ?? []) as MessageRow[]).map((message) =>
    mapTicketMessage(message as unknown as Record<string, unknown>)
  );
  const nextCursor = items.length ? items[items.length - 1].sent_at : null;

  return NextResponse.json({ items, next_cursor: nextCursor });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticket_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { ticket_id: ticketId } = await params;
  const { admin, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as CreateMessageBody;

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "text e obrigatorio." }, { status: 400 });
  }

  const ticketCheck = await ensureTicketOwnership(admin, ticketId, userId);
  if (ticketCheck.error) return NextResponse.json({ error: ticketCheck.error }, { status: 500 });
  if (!ticketCheck.ticket) return NextResponse.json({ error: "Protocolo nao encontrado." }, { status: 404 });

  if (normalizeTicketStatus(ticketCheck.ticket.status) === "CLOSED") {
    return NextResponse.json({ error: "Ticket encerrado. Nao aceita novas mensagens." }, { status: 400 });
  }

  const currentStatus = normalizeTicketStatus(ticketCheck.ticket.status);
  const nextStatus =
    currentStatus === "WAITING_CUSTOMER"
      ? "WAITING_STORE"
      : currentStatus === "RESOLUTION_PROPOSED"
        ? "IN_REVIEW"
        : null;
  const nowIso = new Date().toISOString();
  if (
    nextStatus &&
    canTransitionTicketStatus({
      current: currentStatus,
      next: nextStatus,
      hasStoreAction: true
    })
  ) {
    const { error: statusUpdateError } = await admin
      .from("support_tickets")
      .update({
        status: nextStatus,
        last_customer_message_at: nowIso
      })
      .eq("id", ticketId)
      .eq("user_id", userId);
    if (statusUpdateError) {
      return NextResponse.json({ error: statusUpdateError.message }, { status: 500 });
    }
  } else {
    const touchTicket = await admin
      .from("support_tickets")
      .update({ last_customer_message_at: nowIso })
      .eq("id", ticketId)
      .eq("user_id", userId);
    if (touchTicket.error && !isMissingRelationOrColumn(touchTicket.error)) {
      return NextResponse.json({ error: touchTicket.error.message }, { status: 500 });
    }
  }

  const attachmentIds = Array.isArray(body.attachment_ids)
    ? Array.from(new Set(body.attachment_ids.map((value) => String(value).trim()).filter(Boolean)))
    : [];
  if (attachmentIds.length > 0) {
    const attachmentLookup = await admin
      .from("support_attachments")
      .select("id")
      .eq("user_id", userId)
      .eq("ticket_id", ticketId)
      .in("id", attachmentIds);

    if (attachmentLookup.error && !isMissingRelationOrColumn(attachmentLookup.error)) {
      return NextResponse.json({ error: attachmentLookup.error.message }, { status: 500 });
    }

    if (!attachmentLookup.error) {
      const foundIds = new Set((attachmentLookup.data ?? []).map((row) => row.id as string));
      const missing = attachmentIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: "Alguns attachment_ids sao invalidos para este ticket." },
          { status: 400 }
        );
      }
    }
  }

  const messageText = attachmentIds.length
    ? `${text}\nattachments:${JSON.stringify(attachmentIds)}`
    : text;

  const { data, error } = await admin
    .from("support_messages")
    .insert({
      ticket_id: ticketId,
      sender_role: "customer",
      message: messageText
    })
    .select("id,ticket_id,sender_role,message,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sellerUserId = await loadSellerUserId(admin, ticketCheck.ticket.store_id ?? null);
  const eventId = await emitPlatformEvent({
    eventName: "ticket.message_received",
    aggregateType: "ticket",
    aggregateId: ticketId,
    ticketId,
    customerUserId: userId,
    sellerId: ticketCheck.ticket.store_id ?? null,
    actorUserId: userId,
    payload: {
      sender: "CUSTOMER",
      attachment_ids: attachmentIds,
      status_before: currentStatus,
      status_after: nextStatus ?? currentStatus
    },
    idempotencyKey: buildDeterministicKey([
      "ticket.message_received",
      ticketId,
      data.id
    ])
  });

  if (sellerUserId) {
    await queueNotificationChannels({
      eventId,
      recipientUserId: sellerUserId,
      recipientSellerId: ticketCheck.ticket.store_id ?? null,
      channels: ["in_app"],
      templateKey: "support.ticket.message_received.store",
      title: "Cliente respondeu no ticket",
      body: "Ha nova mensagem de cliente aguardando sua resposta.",
      ctaHref: "/seller/support",
      ctaLabel: "Abrir ticket",
      metadata: {
        ticket_id: ticketId,
        sender: "CUSTOMER"
      }
    });
  }

  return NextResponse.json(mapTicketMessage(data as unknown as Record<string, unknown>), { status: 201 });
}
