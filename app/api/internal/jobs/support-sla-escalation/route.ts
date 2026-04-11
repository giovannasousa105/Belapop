import { NextRequest, NextResponse } from "next/server";

import {
  buildDeterministicKey,
  emitPlatformEvent,
  queueNotificationChannels
} from "@/lib/events/platformEventBus";
import { isInternalJobAuthorized, parseJobLimit } from "@/lib/internal/jobs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  computeSupportSlaDeadlines,
  loadSupportSlaPolicy,
  normalizeTicketReasonForPolicy
} from "@/lib/support/sla";

export const runtime = "nodejs";

type TicketRow = {
  id: string;
  user_id?: string | null;
  customer_id: string | null;
  store_id: string | null;
  status: string;
  reason: string | null;
  created_at: string;
  first_response_due_at: string | null;
  resolution_due_at: string | null;
  escalated_at: string | null;
};

const normalize = (value: string | null | undefined) => (value ?? "").trim().toUpperCase();

const isMissingColumnError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  return String(error.message ?? "").toLowerCase().includes("does not exist");
};

const sellerUserIdBySeller = async (sellerId: string | null) => {
  if (!sellerId) return null;
  const admin = getSupabaseAdminClient();
  const lookup = await admin.from("sellers").select("user_id").eq("id", sellerId).maybeSingle();
  if (lookup.error) return null;
  return (lookup.data?.user_id as string | null) ?? null;
};

export async function POST(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado para job interno." }, { status: 401 });
  }

  const limit = parseJobLimit(request.nextUrl.searchParams.get("limit"), 250, 1000);
  const admin = getSupabaseAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const primaryLookup = await admin
    .from("support_tickets")
    .select(
      "id,user_id,customer_id,store_id,status,reason,created_at,first_response_due_at,resolution_due_at,escalated_at"
    )
    .in("status", ["OPEN", "WAITING_STORE", "WAITING_CUSTOMER", "IN_REVIEW"])
    .is("closed_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  let lookupError = primaryLookup.error;
  let lookupData = primaryLookup.data as Array<Record<string, unknown>> | null;

  if (lookupError && isMissingColumnError(lookupError)) {
    const fallbackLookup = await admin
      .from("support_tickets")
      .select(
        "id,customer_id,store_id,status,reason,created_at,first_response_due_at,resolution_due_at,escalated_at"
      )
      .in("status", ["OPEN", "WAITING_STORE", "WAITING_CUSTOMER", "IN_REVIEW"])
      .is("closed_at", null)
      .order("created_at", { ascending: true })
      .limit(limit);
    lookupError = fallbackLookup.error;
    lookupData = fallbackLookup.data as Array<Record<string, unknown>> | null;
  }

  if (lookupError) {
    return NextResponse.json(
      {
        error: lookupError.message,
        detail:
          "Verifique se a migration 20260305_0300_customer_events_outbox_support_sla.sql foi aplicada."
      },
      { status: 500 }
    );
  }

  const tickets = (lookupData ?? []) as TicketRow[];
  let scanned = 0;
  let escalated = 0;
  let touchedDeadlines = 0;

  for (const ticket of tickets) {
    scanned += 1;

    const policy = await loadSupportSlaPolicy(admin, normalizeTicketReasonForPolicy(ticket.reason));
    const deadlines = computeSupportSlaDeadlines(ticket.created_at, policy);

    const firstDueAt = ticket.first_response_due_at ?? deadlines.firstResponseDueAt;
    const resolutionDueAt = ticket.resolution_due_at ?? deadlines.resolutionDueAt;
    const escalateAfterAt = deadlines.escalateAfterAt;

    if (!ticket.first_response_due_at || !ticket.resolution_due_at) {
      touchedDeadlines += 1;
      await admin
        .from("support_tickets")
        .update({
          first_response_due_at: firstDueAt,
          resolution_due_at: resolutionDueAt
        })
        .eq("id", ticket.id);
    }

    if (ticket.escalated_at) continue;

    const status = normalize(ticket.status);
    const firstExpired = Date.parse(firstDueAt) <= now;
    const resolutionExpired = Date.parse(resolutionDueAt) <= now;
    const escalationWindowExpired = Date.parse(escalateAfterAt) <= now;

    const shouldEscalate =
      status === "OPEN" || status === "WAITING_STORE"
        ? firstExpired || escalationWindowExpired
        : status === "WAITING_CUSTOMER"
          ? resolutionExpired
          : false;

    if (!shouldEscalate) continue;

    const patch = await admin
      .from("support_tickets")
      .update({
        status: "IN_REVIEW",
        escalated_at: nowIso,
        first_response_due_at: firstDueAt,
        resolution_due_at: resolutionDueAt
      })
      .eq("id", ticket.id)
      .is("escalated_at", null)
      .select("id,status,store_id,user_id,customer_id")
      .maybeSingle();

    if (patch.error || !patch.data) continue;
    escalated += 1;

    const customerUserId =
      (patch.data.user_id as string | null) ?? (patch.data.customer_id as string | null);
    const sellerUserId = await sellerUserIdBySeller((patch.data.store_id as string | null) ?? null);

    const eventId = await emitPlatformEvent({
      eventName: "ticket.escalated",
      aggregateType: "ticket",
      aggregateId: ticket.id,
      ticketId: ticket.id,
      customerUserId,
      sellerId: (patch.data.store_id as string | null) ?? null,
      payload: {
        from_status: ticket.status,
        to_status: "IN_REVIEW",
        reason: ticket.reason ?? "OTHER",
        first_response_due_at: firstDueAt,
        resolution_due_at: resolutionDueAt
      },
      idempotencyKey: buildDeterministicKey([
        "ticket.escalated",
        ticket.id,
        nowIso.slice(0, 13)
      ])
    });

    if (customerUserId) {
      await queueNotificationChannels({
        eventId,
        recipientUserId: customerUserId,
        recipientSellerId: (patch.data.store_id as string | null) ?? null,
        channels: ["in_app", "email", "whatsapp"],
        templateKey: "support.ticket.escalated",
        title: "Seu protocolo foi priorizado",
        body: "Escalamos seu caso para analise interna. Seguiremos com atualizacoes no painel.",
        ctaHref: `/conta/reclamacoes-suporte/${ticket.id}`,
        ctaLabel: "Acompanhar protocolo",
        metadata: {
          ticket_id: ticket.id,
          status: "IN_REVIEW"
        }
      });
    }

    if (sellerUserId) {
      await queueNotificationChannels({
        eventId,
        recipientUserId: sellerUserId,
        recipientSellerId: (patch.data.store_id as string | null) ?? null,
        channels: ["in_app"],
        templateKey: "support.ticket.escalated.store",
        title: "Ticket escalado pela BelaPop",
        body: "Este protocolo entrou em analise interna por SLA. Responda com prioridade.",
        ctaHref: "/seller/support",
        ctaLabel: "Abrir suporte",
        metadata: {
          ticket_id: ticket.id,
          status: "IN_REVIEW"
        }
      });
    }
  }

  return NextResponse.json({
    ok: true,
    scanned,
    touched_deadlines: touchedDeadlines,
    escalated
  });
}
