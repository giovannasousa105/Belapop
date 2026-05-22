import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { buscarTwin } from "@/lib/digitalTwin/snapshotService";
import { toTwinId } from "@/lib/digitalTwin/twinTypes";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  TwinSnapshotsResponse,
  TwinSnapshotRow,
  TwinDeltaRow,
  TwinTrendRow,
} from "@/lib/digitalTwin/twinTypes";

export async function GET(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { userId } = auth.ctx;
  const admin = getSupabaseAdminClient();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

  try {
    const twin = await buscarTwin(userId);

    if (!twin) {
      const payload: TwinSnapshotsResponse = {
        snapshots: [],
        deltas: [],
        trends: [],
        total: 0,
      };
      return NextResponse.json(payload);
    }

    const twinId = toTwinId(twin.id);

    const [snapshotsResult, deltaResult, trendResult, countResult] = await Promise.all([
      admin
        .from("twin_snapshots")
        .select("*")
        .eq("twin_id", twinId)
        .order("numero_sequencia", { ascending: false })
        .range(offset, offset + limit - 1),
      admin
        .from("twin_deltas")
        .select("*")
        .eq("twin_id", twinId)
        .order("criado_em", { ascending: false })
        .limit(limit),
      admin
        .from("twin_trends")
        .select("*")
        .eq("twin_id", twinId),
      admin
        .from("twin_snapshots")
        .select("id", { count: "exact", head: true })
        .eq("twin_id", twinId),
    ]);

    const payload: TwinSnapshotsResponse = {
      snapshots: (snapshotsResult.data ?? []) as TwinSnapshotRow[],
      deltas: (deltaResult.data ?? []) as TwinDeltaRow[],
      trends: (trendResult.data ?? []) as TwinTrendRow[],
      total: countResult.count ?? 0,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar snapshots.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
