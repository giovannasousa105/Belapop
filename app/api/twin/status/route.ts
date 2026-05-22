import { NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { buscarTwin } from "@/lib/digitalTwin/snapshotService";
import { calcularMelhoraGlobalObjeto } from "@/lib/digitalTwin/deltaEngine";
import { toTwinId } from "@/lib/digitalTwin/twinTypes";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TwinStatusResponse, TwinSnapshotRow, TwinInsightRow } from "@/lib/digitalTwin/twinTypes";

export async function GET() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { userId } = auth.ctx;
  const admin = getSupabaseAdminClient();

  try {
    const twin = await buscarTwin(userId);

    if (!twin) {
      const payload: TwinStatusResponse = {
        twin: null,
        ultimoSnapshot: null,
        ultimoInsight: null,
        copilotSeed: null,
        diasDesdeUltimoScan: null,
        melhoraGlobal: null,
      };
      return NextResponse.json(payload);
    }

    const twinId = toTwinId(twin.id);

    const [snapshotResult, insightResult] = await Promise.all([
      admin
        .from("twin_snapshots")
        .select("*")
        .eq("twin_id", twinId)
        .order("numero_sequencia", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("twin_insights")
        .select("*")
        .eq("twin_id", twinId)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const ultimoSnapshot = snapshotResult.data as TwinSnapshotRow | null;
    const ultimoInsight = insightResult.data as TwinInsightRow | null;

    const diasDesdeUltimoScan = twin.ultimo_scan_em
      ? Math.floor(
          (Date.now() - new Date(twin.ultimo_scan_em).getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    const melhoraGlobal = calcularMelhoraGlobalObjeto(twin.scores_baseline, ultimoSnapshot);

    const payload: TwinStatusResponse = {
      twin,
      ultimoSnapshot,
      ultimoInsight,
      copilotSeed: twin.copilot_seed ?? null,
      diasDesdeUltimoScan,
      melhoraGlobal,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar twin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
