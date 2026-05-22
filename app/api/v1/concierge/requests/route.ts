import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import {
  buildDeterministicKey,
  emitPlatformEvent,
  queueNotificationChannels
} from "@/lib/events/platformEventBus";
import {
  createPopClubConciergeRequest,
  loadPopClubOperationalPrioritySnapshot
} from "@/lib/popclub/operations";

const ConciergeRequestSchema = z
  .object({
    order_id: z.string().uuid().optional(),
    source: z.enum(["manual", "skin_scan", "account", "checkout"]).optional(),
    summary: z.string().trim().min(1).max(280).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
    source_idempotency_key: z.string().trim().min(8).max(200).optional()
  })
  .strict();

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const parsed = ConciergeRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const body = parsed.data;
  const { admin, userId } = auth.ctx;

  if (body.order_id) {
    const { data: order, error } = await admin
      .from("orders")
      .select("id")
      .eq("id", body.order_id)
      .eq("customer_id", userId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!order) {
      return NextResponse.json({ error: "Pedido invalido para este usuario." }, { status: 400 });
    }
  }

  const prioritySnapshot = await loadPopClubOperationalPrioritySnapshot(admin, userId);
  const sourceIdempotencyKey =
    body.source_idempotency_key ??
    buildDeterministicKey([
      "concierge.requested",
      userId,
      body.order_id ?? null,
      body.source ?? "manual",
      body.summary ?? null
    ]);

  const created = await createPopClubConciergeRequest(admin, {
    userId,
    orderId: body.order_id ?? null,
    source: body.source ?? "manual",
    summary: body.summary ?? null,
    payload: body.payload ?? {},
    sourceIdempotencyKey,
    snapshot: prioritySnapshot
  });

  if (!created.id) {
    return NextResponse.json(
      {
        error:
          "Contrato operacional do concierge indisponivel. Rode a migration 20260420_0300_popclub_samples_and_priority_queues.sql."
      },
      { status: 503 }
    );
  }

  const eventId = await emitPlatformEvent({
    eventName: "concierge.requested",
    aggregateType: "profile",
    aggregateId: userId,
    orderId: body.order_id ?? null,
    customerUserId: userId,
    actorUserId: userId,
    payload: {
      concierge_request_id: created.id,
      source: body.source ?? "manual",
      current_tier: created.currentTier,
      priority_score: created.priorityScore,
      priority_band: created.priorityBand
    },
    idempotencyKey: sourceIdempotencyKey
  });

  await queueNotificationChannels({
    eventId,
    recipientUserId: userId,
    channels: ["in_app"],
    templateKey: "concierge.requested",
    title: "Concierge acionado",
    body: "Recebemos seu pedido e vamos seguir com prioridade conforme o seu nivel atual.",
    ctaHref: "/conta",
    ctaLabel: "Abrir conta",
    metadata: {
      concierge_request_id: created.id,
      current_tier: created.currentTier,
      priority_band: created.priorityBand
    }
  });

  return NextResponse.json(
    {
      ok: true,
      concierge_request: {
        id: created.id,
        status: created.status,
        current_tier: created.currentTier,
        priority_score: created.priorityScore,
        priority_band: created.priorityBand,
        created_at: created.createdAt
      }
    },
    { status: 201 }
  );
}
