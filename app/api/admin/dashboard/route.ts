import { NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";
import {
  fetchExecutiveDashboardData,
  type DashboardRange
} from "@/lib/admin/dashboardMetrics";

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(req.url);
  const requestedRange = searchParams.get("range");
  const range: DashboardRange =
    requestedRange === "today" ||
    requestedRange === "7d" ||
    requestedRange === "30d" ||
    requestedRange === "90d"
      ? requestedRange
      : "today";

  try {
    const data = await fetchExecutiveDashboardData(range);

    return NextResponse.json(
      {
        deprecated: true,
        source: "executive_dashboard_metrics",
        message:
          "Este endpoint foi mantido apenas por compatibilidade. Use a camada executiva atual e nao dependa do payload legado simplificado.",
        range,
        data
      },
      {
        headers: {
          Deprecation: "true",
          Sunset: "2026-04-30",
          Link: "</admin/dashboard>; rel=\"successor-version\""
        }
      }
    );
  } catch (error) {
    console.error("[api/admin/dashboard] carga executiva indisponivel", error);

    return NextResponse.json(
      {
        error: "Camada executiva indisponivel.",
        detail: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 503 }
    );
  }
}
