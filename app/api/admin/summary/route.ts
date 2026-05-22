import { NextRequest, NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";
import { fetchDashboardSummary } from "@/lib/admin/data";

export async function GET(request: NextRequest) {
  const admin = await ensureAdminRequest(request);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const summary = await fetchDashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[admin/summary]", error);
    return NextResponse.json({ error: "Erro ao carregar o dashboard." }, { status: 500 });
  }
}
