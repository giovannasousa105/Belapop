import { NextRequest, NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const supabase = admin.supabase;
  const { action, notes } = await req.json(); // approve|reject|pause|feature|unfeature
  const updates: any = {};

  if (action === "approve") updates.status = "published";
  if (action === "reject") updates.status = "rejected";
  if (action === "pause") updates.status = "paused";
  if (action === "feature") updates.is_featured = true;
  if (action === "unfeature") updates.is_featured = false;

  const { error } = await supabase.from("products").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from("product_moderation_logs").insert({
    product_id: id,
    actor_id: userId,
    action,
    notes
  });

  return NextResponse.json({ ok: true });
}
