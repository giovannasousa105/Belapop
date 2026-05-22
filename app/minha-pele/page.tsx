import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/requireRole";
import { buildLoginHref } from "@/lib/auth/redirects";
import { buscarTwin } from "@/lib/digitalTwin/snapshotService";
import { calcularMelhoraGlobalObjeto } from "@/lib/digitalTwin/deltaEngine";
import { toTwinId } from "@/lib/digitalTwin/twinTypes";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { TwinDashboardClient } from "./TwinDashboardClient";
import type { TwinSnapshotRow, TwinDeltaRow, TwinTrendRow } from "@/lib/digitalTwin/twinTypes";

export const metadata: Metadata = {
  title: "Minha Pele — BelaPop",
  description: "Acompanhe a evolução da sua pele ao longo do tempo.",
  robots: { index: false, follow: false },
};

export default async function MinhaPelePage() {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "/minha-pele";
  const search = requestHeaders.get("x-search") ?? "";

  await requireRole(["client"], {
    redirectTo: buildLoginHref(`${pathname}${search}`),
  });

  // Buscar user_id do servidor
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const twin = await buscarTwin(user.id);

  if (!twin) {
    return <TwinDashboardClient initialData={null} />;
  }

  const twinId = toTwinId(twin.id);

  const [snapshotResult, deltaResult, trendResult, insightResult] = await Promise.all([
    admin
      .from("twin_snapshots")
      .select("*")
      .eq("twin_id", twinId)
      .order("numero_sequencia", { ascending: false })
      .limit(10),
    admin
      .from("twin_deltas")
      .select("*")
      .eq("twin_id", twinId)
      .order("criado_em", { ascending: false })
      .limit(10),
    admin.from("twin_trends").select("*").eq("twin_id", twinId),
    admin
      .from("twin_insights")
      .select("*")
      .eq("twin_id", twinId)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const snapshots = (snapshotResult.data ?? []) as TwinSnapshotRow[];
  const ultimoSnapshot = snapshots[0] ?? null;
  const diasDesdeUltimoScan = twin.ultimo_scan_em
    ? Math.floor(
        (Date.now() - new Date(twin.ultimo_scan_em).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <TwinDashboardClient
      initialData={{
        twin,
        ultimoSnapshot,
        ultimoInsight: insightResult.data ?? null,
        copilotSeed: twin.copilot_seed ?? null,
        diasDesdeUltimoScan,
        melhoraGlobal: calcularMelhoraGlobalObjeto(twin.scores_baseline, ultimoSnapshot),
        snapshots,
        deltas: (deltaResult.data ?? []) as TwinDeltaRow[],
        trends: (trendResult.data ?? []) as TwinTrendRow[],
      }}
    />
  );
}
