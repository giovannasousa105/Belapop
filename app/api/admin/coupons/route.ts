import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";
import { createUUID } from "@/lib/utils";
import type { AdminCampaign } from "@/lib/admin/campaignService";

const mapCampaign = (row: any): AdminCampaign => {
  const now = new Date();
  const startsAt = row.starts_at ? new Date(row.starts_at) : null;
  const endsAt = row.ends_at ? new Date(row.ends_at) : null;

  let status: AdminCampaign["status"] = "active";
  if (!row.is_active) status = "paused";
  else if (startsAt && startsAt > now) status = "scheduled";
  else if (endsAt && endsAt < now) status = "expired";

  return {
    id: row.id,
    code: row.code ?? "",
    percentOff: typeof row.percent_off === "number" ? row.percent_off : null,
    amountOffCents: typeof row.amount_off_cents === "number" ? row.amount_off_cents : null,
    minSubtotalCents: typeof row.min_subtotal_cents === "number" ? row.min_subtotal_cents : null,
    isActive: Boolean(row.is_active),
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    createdAt: row.created_at ?? null,
    status
  };
};

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  const { data, error } = await supabase
    .from("promotions")
    .select("id,code,percent_off,amount_off_cents,min_subtotal_cents,is_active,starts_at,ends_at,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns: (data ?? []).map(mapCampaign) });
}

export async function POST(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const code = String(body?.code ?? "")
    .trim()
    .toUpperCase();
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Codigo da campanha invalido." }, { status: 400 });
  }

  const discountMode = body?.discountMode === "amount" ? "amount" : "percent";
  const discountValue = Number(body?.discountValue ?? 0);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return NextResponse.json({ error: "Valor de desconto invalido." }, { status: 400 });
  }

  const minSubtotal = Number(body?.minSubtotal ?? 0);
  if (!Number.isFinite(minSubtotal) || minSubtotal < 0) {
    return NextResponse.json({ error: "Pedido minimo invalido." }, { status: 400 });
  }

  const startsAt = body?.startsAt ? new Date(body.startsAt) : null;
  const endsAt = body?.endsAt ? new Date(body.endsAt) : null;
  if (startsAt && Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Data de inicio invalida." }, { status: 400 });
  }
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "Data de fim invalida." }, { status: 400 });
  }
  if (startsAt && endsAt && endsAt <= startsAt) {
    return NextResponse.json({ error: "Data de fim deve ser maior que inicio." }, { status: 400 });
  }

  const payload = {
    id: createUUID(),
    code,
    percent_off: discountMode === "percent" ? Math.round(discountValue) : null,
    amount_off_cents: discountMode === "amount" ? Math.round(discountValue * 100) : null,
    min_subtotal_cents: Math.round(minSubtotal * 100),
    is_active: true,
    starts_at: startsAt ? startsAt.toISOString() : null,
    ends_at: endsAt ? endsAt.toISOString() : null
  };

  const { data, error } = await supabase
    .from("promotions")
    .insert(payload)
    .select("id,code,percent_off,amount_off_cents,min_subtotal_cents,is_active,starts_at,ends_at,created_at")
    .maybeSingle();

  if (error) {
    const duplicate = error.message?.toLowerCase().includes("duplicate") || error.message?.toLowerCase().includes("unique");
    if (duplicate) {
      return NextResponse.json({ error: "Codigo ja existe. Use outro codigo." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: data ? mapCampaign(data) : null });
}
