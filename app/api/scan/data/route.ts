import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// DELETE /api/scan/data — direito de eliminação (art. 18 LGPD)
// Remove: scan_history (user-linked), scan_consents (revoga todos)
// NÃO remove: scan_contributions (pseudoanonimizado — by design, comunicado no consentimento)
export async function DELETE(): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const admin  = getSupabaseAdminClient();
  const now    = new Date().toISOString();
  const errors: string[] = [];

  // 1. Apagar histórico longitudinal
  const { error: histErr } = await admin
    .from("scan_history")
    .delete()
    .eq("user_id", user.id);
  if (histErr) errors.push(`scan_history: ${histErr.message}`);

  // 2. Revogar todos os consentimentos ativos (interrompe envios futuros)
  const { error: consentErr } = await admin
    .from("scan_consents")
    .update({ revoked_at: now })
    .eq("user_id", user.id)
    .is("revoked_at", null);
  if (consentErr) errors.push(`scan_consents: ${consentErr.message}`);

  // 3. scan_contributions: intencionalmente não removido.
  //    pseudonym_id = SHA-256(salt + user_id) sem o salt do servidor — irreversível.
  //    Limitação comunicada antes do consentimento consent_data_sharing.

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deleted: ["scan_history", "scan_consents (revogados)"],
    note: "Contribuições ao dataset coletivo (scan_contributions) não são removíveis — pseudoanonimização irreversível, conforme informado no consentimento consent_data_sharing.",
  });
}
