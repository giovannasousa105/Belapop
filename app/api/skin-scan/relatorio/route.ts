import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";

import { skinAnalysisSessionSchema } from "@/lib/skincare/skinAnalysis";
import { SkinScanReportPdf } from "@/lib/skin-scan/report-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const parsed = skinAnalysisSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados do scan inválidos" }, { status: 422 });
  }

  const session = parsed.data;
  const generatedAt = session.generatedAt ?? new Date().toISOString();

  const element = createElement(SkinScanReportPdf, { session, generatedAt }) as ReactElement<DocumentProps>;
  const pdfBuffer = await renderToBuffer(element);
  const bytes = new Uint8Array(pdfBuffer);

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="belapop-skin-scan-${Date.now()}.pdf"`,
      "Content-Length": String(bytes.byteLength),
    },
  });
}
