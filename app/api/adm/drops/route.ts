import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdmSessionState } from "@/lib/adm/auth/current-user";
import { hasPermission } from "@/lib/adm/auth/guards";

export const runtime = "nodejs";

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireAdmAuth(req: NextRequest) {
  const session = await getAdmSessionState();
  if (!session.user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!hasPermission(session.user, "manage_products")) {
    return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 });
  }
  return session.user;
}

// ── GET /api/adm/drops ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdmAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("drops")
    .select("id, number, title, opens_at, closes_at, status, total_orders, gmv_cents, created_at, updated_at")
    .order("number", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ drops: data ?? [] });
}

// ── POST /api/adm/drops ───────────────────────────────────────────────────────

const CreateDropSchema = z.object({
  title: z.string().min(3).max(120),
  opens_at: z.string().datetime(),
  closes_at: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmAuth(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const parsed = CreateDropSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 422 });
  }

  const { title, opens_at, closes_at, notes } = parsed.data;

  if (new Date(closes_at) <= new Date(opens_at)) {
    return NextResponse.json({ error: "Data de fechamento deve ser posterior à abertura." }, { status: 422 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("drops")
    .insert({
      title,
      opens_at,
      closes_at,
      notes: notes ?? null,
      status: "draft",
      created_by: auth.id,
    })
    .select("id, number, title, opens_at, closes_at, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ drop: data }, { status: 201 });
}
