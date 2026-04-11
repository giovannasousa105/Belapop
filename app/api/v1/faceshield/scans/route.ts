import { NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { faceShieldScanCreateSchema } from "@/lib/skincare/contracts";
import {
  composeFaceScanPayload,
  loadFaceScanDetails,
  loadRecentFaceScans,
  persistBelaCodeScan
} from "@/lib/skincare/faceshieldPersistence";
import { mapUserSkinProfile } from "@/lib/skincare/routine";
import { loadCurrentSkinProfile, loadSkinProfileOptions, refreshProductEffectivenessForUser } from "@/lib/skincare/server";

export async function GET() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;

  try {
    const scans = await loadRecentFaceScans(admin, userId);
    const details = await loadFaceScanDetails(admin, userId, scans);
    return NextResponse.json({ items: composeFaceScanPayload(scans, details) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar scans do BelaCode.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = await request.json().catch(() => ({}));
  const parsed = faceShieldScanCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalido.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const [{ skinTypes, skinTones, concerns }, profile] = await Promise.all([
      loadSkinProfileOptions(admin),
      loadCurrentSkinProfile(admin, userId)
    ]);

    const result = await persistBelaCodeScan({
      admin,
      userId,
      profile: mapUserSkinProfile(profile, skinTypes, concerns, skinTones),
      scan: parsed.data
    });

    if (result.ok) {
      await refreshProductEffectivenessForUser(admin, userId);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao registrar scan BelaCode.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

