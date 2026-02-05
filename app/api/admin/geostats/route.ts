import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

// Retorna dados agregados por UF (mock simples; troque por agregação real de CEP->UF).
export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  // Mock estático até termos CEP -> UF na base
  const data = [
    { uf: "SP", value: 1200 },
    { uf: "RJ", value: 650 },
    { uf: "MG", value: 430 },
    { uf: "RS", value: 310 },
    { uf: "PR", value: 290 },
    { uf: "BA", value: 260 },
    { uf: "DF", value: 180 }
  ];

  return NextResponse.json({ data });
}
