import "server-only";

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  assertUploadable,
  SKIN_TYPES,
  CONCERN_VALUES,
  QUALITY_FLAGS,
} from "@/src/features/skinScan/uploadableFeatures";

export const runtime = "nodejs";

// .strict() rejeita qualquer campo além dos whitelistados — segunda camada de proteção
const UploadableSchema = z.object({
  hydration:      z.number().int().min(0).max(10),
  oiliness:       z.number().int().min(0).max(10),
  texture:        z.number().int().min(0).max(10),
  poreVisibility: z.number().int().min(0).max(10),
  redness:        z.number().int().min(0).max(10),
  evenness:       z.number().int().min(0).max(10),
  fineLines:      z.number().int().min(0).max(10),
  darkSpots:      z.number().int().min(0).max(10),
  darkCircles:    z.number().int().min(0).max(10),
  barrierHealth:  z.number().int().min(0).max(10),
  skinType:        z.enum(SKIN_TYPES),
  primaryConcerns: z.array(z.enum(CONCERN_VALUES)),
  modelVersion:    z.string().min(1).max(50),
  qualityFlag:     z.enum(QUALITY_FLAGS),
  createdAt:       z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
}).strict();

// POST /api/scan/contribute — grava features no histórico e opcionalmente no dataset coletivo
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const rawBody = await req.json().catch(() => null);

  // Camada 1: assertUploadable — nenhum campo além da whitelist
  try {
    assertUploadable(rawBody);
  } catch (e) {
    // Log SEM o payload (pode conter dados sensíveis do cliente bugado)
    console.error("[scan/contribute] assertUploadable falhou:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Camada 2: validação Zod + .strict() (garante tipos corretos + rejeita campos extras)
  const parsed = UploadableSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload não corresponde à whitelist.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const features = parsed.data;

  // Verificar consentimentos ativos
  const { data: consents } = await supabase
    .from("scan_consents")
    .select("consent_type, granted")
    .eq("user_id", user.id)
    .is("revoked_at", null);

  const cm = new Map(
    (consents ?? []).map((c: { consent_type: string; granted: boolean }) =>
      [c.consent_type, c.granted])
  );

  if (cm.get("consent_scan") !== true) {
    return NextResponse.json(
      { error: "consent_scan necessário para usar o Skin Scan." },
      { status: 403 },
    );
  }

  const admin = getSupabaseAdminClient();
  const featureVector = { ...features };
  let savedToHistory       = false;
  let contributedToDataset = false;

  // Histórico longitudinal (requer apenas consent_scan)
  const { error: historyErr } = await admin.from("scan_history").insert({
    user_id:        user.id,
    feature_vector: featureVector,
    model_version:  features.modelVersion,
  });

  if (!historyErr) savedToHistory = true;
  else console.error("[scan/contribute] history:", historyErr.message);

  // Dataset coletivo pseudoanonimizado (só com consent_data_sharing)
  if (cm.get("consent_data_sharing") === true) {
    const salt        = process.env.CONTRIBUTION_SALT ?? "";
    const pseudonymId = createHash("sha256").update(salt + user.id).digest("hex");

    const { error: contribErr } = await admin.from("scan_contributions").insert({
      pseudonym_id:   pseudonymId,
      feature_vector: featureVector,
      model_version:  features.modelVersion,
    });

    if (!contribErr) contributedToDataset = true;
    else console.error("[scan/contribute] contribution:", contribErr.message);
  }

  return NextResponse.json({ ok: true, savedToHistory, contributedToDataset });
}
