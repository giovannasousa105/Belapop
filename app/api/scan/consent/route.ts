import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CURRENT_POLICY_VERSION = "2026-07-10";

const ConsentBody = z.object({
  consent_type:   z.enum(["consent_scan", "consent_data_sharing"]),
  granted:        z.boolean(),
  policy_version: z.string().optional().default(CURRENT_POLICY_VERSION),
});

// POST /api/scan/consent — concede ou revoga um consentimento
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const body   = await req.json().catch(() => null);
  const parsed = ConsentBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { consent_type, granted, policy_version } = parsed.data;
  const now = new Date().toISOString();

  // Revogar consentimento ativo anterior do mesmo tipo
  await supabase
    .from("scan_consents")
    .update({ revoked_at: now })
    .eq("user_id", user.id)
    .eq("consent_type", consent_type)
    .is("revoked_at", null);

  const { error } = await supabase.from("scan_consents").insert({
    user_id:        user.id,
    consent_type,
    granted,
    policy_version,
    granted_at:     now,
    revoked_at:     null,
  });

  if (error) {
    return NextResponse.json({ error: "Erro ao gravar consentimento." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, consent_type, granted, policy_version, granted_at: now });
}

// GET /api/scan/consent — estado atual dos dois consentimentos
export async function GET(): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const { data: rows, error } = await supabase
    .from("scan_consents")
    .select("consent_type, granted, policy_version, granted_at, revoked_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("granted_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Erro ao buscar consentimentos." }, { status: 500 });

  // Retorna o consentimento mais recente por tipo
  const state: Record<string, unknown> = { consent_scan: null, consent_data_sharing: null };
  for (const row of rows ?? []) {
    if (state[row.consent_type] === null) state[row.consent_type] = row;
  }

  return NextResponse.json(state);
}
