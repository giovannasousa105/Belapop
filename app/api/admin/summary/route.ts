import { NextResponse } from "next/server";

import { fetchDashboardSummary } from "@/lib/admin/data";

export async function GET() {
  try {
    const summary = await fetchDashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[admin/summary]", error);
    return NextResponse.json({ error: "Erro ao carregar o dashboard." }, { status: 500 });
  }
}
