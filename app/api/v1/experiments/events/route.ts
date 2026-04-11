import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

type EventBody = {
  experiment_key?: string;
  event_name?: string;
  event_value?: number;
  order_id?: string | null;
  variant_key?: string | null;
  metadata?: Record<string, unknown>;
};

const normalizeKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const parseEventValue = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as EventBody;
  const experimentKey = normalizeKey(body.experiment_key);
  const eventName = normalizeKey(body.event_name);

  if (!experimentKey || !eventName) {
    return NextResponse.json(
      { error: "experiment_key e event_name sao obrigatorios." },
      { status: 400 }
    );
  }

  const event = await admin.rpc("track_ab_experiment_event", {
    p_experiment_key: experimentKey,
    p_subject_id: userId,
    p_event_name: eventName,
    p_event_value: parseEventValue(body.event_value),
    p_order_id: body.order_id ?? null,
    p_variant_key: body.variant_key ?? null,
    p_metadata: body.metadata ?? {}
  });

  if (event.error) {
    return NextResponse.json(
      {
        error: event.error.message,
        detail:
          "Funcao track_ab_experiment_event nao encontrada. Rode a migration 20260306_1500_ops_reverse_sre_ranking_ab.sql."
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    experiment_key: experimentKey,
    event_name: eventName,
    event_id: event.data ?? null
  });
}

