import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

const snapshotSchema = z.object({
  generatedAt: z.string().min(1),
  summary: z.string().min(1),
  topConcerns: z.array(z.string()).min(1),
  skinTexture: z.object({ score: z.number(), label: z.string() }),
  visiblePores: z.object({ score: z.number(), label: z.string() }),
  toneUniformity: z.object({ score: z.number(), label: z.string() }),
  oilinessLabel: z.string().optional(),
  drynessLabel: z.string().optional(),
  rednessLabel: z.string().optional()
});

export type SkinScanSnapshot = z.infer<typeof snapshotSchema>;

export async function GET() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;

  const { data } = await admin
    .from("user_skin_profiles")
    .select("metadata")
    .eq("user_id", userId)
    .maybeSingle();

  const meta = (data?.metadata as Record<string, unknown>) ?? {};
  const lastPopScan = (meta.lastPopScan ?? null) as SkinScanSnapshot | null;

  return NextResponse.json({ lastPopScan });
}

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;

  const body = await request.json().catch(() => ({}));
  const parsed = snapshotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("user_skin_profiles")
    .select("metadata")
    .eq("user_id", userId)
    .maybeSingle();

  const existingMeta = (existing?.metadata as Record<string, unknown>) ?? {};
  const newMeta = { ...existingMeta, lastPopScan: parsed.data };

  const { error } = await admin
    .from("user_skin_profiles")
    .upsert({ user_id: userId, metadata: newMeta }, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
