import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function POST(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  // Reutiliza cálculo do endpoint /sla/check
  const res = await fetch(new URL("/api/admin/sla/check", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").toString(), {
    headers: req.headers as any,
    cache: "no-store"
  });
  if (!res.ok) return NextResponse.json({ error: "failed_check" }, { status: 500 });
  const { counts, alerts } = await res.json();

  // Cria notificação geral (user_id null = broadcast admin)
  await supabase.from("notifications").insert({
    user_id: null,
    type: "sla_alert",
    payload: { counts, alerts },
    read_at: null
  });

  return NextResponse.json({ ok: true, counts });
}
