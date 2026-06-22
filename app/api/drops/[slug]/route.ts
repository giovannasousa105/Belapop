import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getDropBySlug } from "@/lib/drops/queries.server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const drop = await getDropBySlug(slug);
  if (!drop) {
    return NextResponse.json({ error: "Drop não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ drop });
}
