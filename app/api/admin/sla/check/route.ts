import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

type Risk = "critical" | "attention" | "ok";

const CRITICAL_HOURS = 12;
const ATTENTION_HOURS = 24;

function classify(deadline?: string | null): Risk {
  if (!deadline) return "ok";
  const now = Date.now();
  const diffH = (new Date(deadline).getTime() - now) / (1000 * 60 * 60);
  if (diffH < CRITICAL_HOURS) return "critical";
  if (diffH < ATTENTION_HOURS) return "attention";
  return "ok";
}

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,created_at,sla_deadline")
    .in("status", ["paid", "processing", "shipped"]);

  const alerts = (orders ?? []).map((o) => ({
    id: o.id,
    status: o.status,
    sla_deadline: o.sla_deadline,
    risk: classify(o.sla_deadline)
  }));

  const counts = alerts.reduce<Record<Risk, number>>(
    (acc, a) => {
      acc[a.risk] = acc[a.risk] + 1;
      return acc;
    },
    { critical: 0, attention: 0, ok: 0 }
  );

  return NextResponse.json({ counts, alerts });
}
