import { NextRequest, NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";
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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await ensureAdminRequest(req);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const params = await context.params;
  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Id da campanha invalido." }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  if (typeof body?.isActive !== "boolean") {
    return NextResponse.json({ error: "Campo isActive deve ser booleano." }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from("promotions")
    .update({ is_active: body.isActive })
    .eq("id", id)
    .select("id,code,percent_off,amount_off_cents,min_subtotal_cents,is_active,starts_at,ends_at,created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ campaign: mapCampaign(data) });
}
