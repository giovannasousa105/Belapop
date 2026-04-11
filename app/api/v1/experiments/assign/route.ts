import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

type AssignBody = {
  experiment_key?: string;
  seed?: string;
  attributes?: Record<string, unknown>;
  track_exposure?: boolean;
};

const normalizeExperimentKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as AssignBody;
  const experimentKey = normalizeExperimentKey(body.experiment_key);

  if (!experimentKey) {
    return NextResponse.json({ error: "experiment_key e obrigatorio." }, { status: 400 });
  }

  const assign = await admin.rpc("assign_ab_experiment_variant", {
    p_experiment_key: experimentKey,
    p_subject_id: userId,
    p_seed: body.seed ?? null,
    p_attributes: body.attributes ?? {}
  });

  if (assign.error) {
    return NextResponse.json(
      {
        error: assign.error.message,
        detail:
          "Funcao assign_ab_experiment_variant nao encontrada. Rode a migration 20260306_1500_ops_reverse_sre_ranking_ab.sql."
      },
      { status: 500 }
    );
  }

  const variant = String(assign.data ?? "control");
  const shouldTrackExposure = body.track_exposure !== false;

  if (shouldTrackExposure) {
    await admin.rpc("track_ab_experiment_event", {
      p_experiment_key: experimentKey,
      p_subject_id: userId,
      p_event_name: "exposure",
      p_event_value: 0,
      p_order_id: null,
      p_variant_key: variant,
      p_metadata: {
        source: "api.v1.experiments.assign"
      }
    });
  }

  return NextResponse.json({
    experiment_key: experimentKey,
    variant
  });
}

