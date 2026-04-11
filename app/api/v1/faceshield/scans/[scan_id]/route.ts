import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import {
  composeFaceScanPayload,
  deleteBelaCodeScan,
  loadFaceScanDetails,
  loadRecentFaceScans
} from "@/lib/skincare/faceshieldPersistence";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ scan_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { scan_id: scanId } = await params;
  const { admin, userId } = auth.ctx;

  try {
    const deleted = await deleteBelaCodeScan(admin, userId, scanId);
    if (!deleted) {
      return NextResponse.json({ error: "Scan nao encontrado." }, { status: 404 });
    }

    const scans = await loadRecentFaceScans(admin, userId);
    const details = await loadFaceScanDetails(admin, userId, scans);

    return NextResponse.json({
      ok: true,
      deleted_scan_id: scanId,
      items: composeFaceScanPayload(scans, details)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao remover scan do BelaCode.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
