import { NextRequest, NextResponse } from "next/server";

import { isInternalJobAuthorized, parseJobLimit } from "@/lib/internal/jobs";
import { processCustomerLifecycleAutomations } from "@/lib/lifecycle/automations";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const parseLifecycleLimit = (
  request: NextRequest,
  key: string,
  fallback: number,
  max = 2000
) => parseJobLimit(request.nextUrl.searchParams.get(key), fallback, max);

async function handle(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado para job interno." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const seedLimit = parseLifecycleLimit(request, "seed_limit", 120, 1000);
  const cartLimit = parseLifecycleLimit(request, "cart_limit", 60, 500);
  const viewLimit = parseLifecycleLimit(request, "view_limit", 60, 500);
  const dispatchLimit = parseLifecycleLimit(request, "dispatch_limit", 150, 1000);

  try {
    const result = await processCustomerLifecycleAutomations({
      admin,
      seedLimit,
      cartLimit,
      viewLimit,
      dispatchLimit
    });

    return NextResponse.json({
      ok: true,
      seed_limit: seedLimit,
      cart_limit: cartLimit,
      view_limit: viewLimit,
      dispatch_limit: dispatchLimit,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao processar customer lifecycle."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
