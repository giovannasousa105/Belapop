import { NextRequest, NextResponse } from "next/server";

import { isInternalJobAuthorized, parseJobLimit } from "@/lib/internal/jobs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDays = (value: string | null) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return 14;
  return Math.max(1, Math.min(90, Math.round(parsed)));
};

export async function POST(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado para job interno." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const limit = parseJobLimit(request.nextUrl.searchParams.get("limit"), 200, 2000);
  const attributionDays = parseDays(request.nextUrl.searchParams.get("attribution_days"));

  const processQueue = await admin.rpc("process_ranking_realtime_queue", {
    p_limit: limit
  });
  if (processQueue.error) {
    return NextResponse.json(
      {
        error: processQueue.error.message,
        detail:
          "Funcao process_ranking_realtime_queue nao encontrada. Rode a migration 20260306_1500_ops_reverse_sre_ranking_ab.sql."
      },
      { status: 500 }
    );
  }

  const refreshAttribution = await admin.rpc("refresh_ab_experiment_attribution_daily", {
    p_days: attributionDays
  });
  if (refreshAttribution.error) {
    return NextResponse.json(
      {
        error: refreshAttribution.error.message,
        detail:
          "Funcao refresh_ab_experiment_attribution_daily nao encontrada. Rode a migration 20260306_1500_ops_reverse_sre_ranking_ab.sql."
      },
      { status: 500 }
    );
  }

  const refreshTrending = await admin.rpc("refresh_product_trending", {
    p_window_hours: 24
  });
  if (refreshTrending.error) {
    return NextResponse.json(
      {
        error: refreshTrending.error.message,
        detail:
          "Funcao refresh_product_trending nao encontrada. Rode a migration 20260310_1400_discovery_engine_trending.sql."
      },
      { status: 500 }
    );
  }

  const refreshHomeRanking = await admin.rpc("refresh_product_ranking_snapshot", {
    p_surface: "home",
    p_context_key: "global"
  });
  if (refreshHomeRanking.error) {
    return NextResponse.json(
      {
        error: refreshHomeRanking.error.message,
        detail:
          "Funcao refresh_product_ranking_snapshot indisponivel para home/global. Rode as migrations de scoring/ranking."
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    limit,
    attribution_days: attributionDays,
    ranking_queue_processed: toNumber(processQueue.data),
    attribution_rows_upserted: toNumber(refreshAttribution.data),
    trending_rows_upserted: toNumber(refreshTrending.data),
    home_ranking_rows_upserted: toNumber(refreshHomeRanking.data)
  });
}
