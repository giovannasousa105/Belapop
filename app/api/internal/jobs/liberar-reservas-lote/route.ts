import { NextRequest, NextResponse } from "next/server";

import { isInternalJobAuthorized, parseJobLimit } from "@/lib/internal/jobs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function handle(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized", message: "Invalid internal job secret." },
      { status: 401 }
    );
  }

  if (request.nextUrl.searchParams.get("auth_check") === "1") {
    return NextResponse.json({ ok: true, processed: 0, message: "Auth verified." });
  }

  const limit = parseJobLimit(
    request.nextUrl.searchParams.get("limit"),
    500,
    2000
  );

  const admin = getSupabaseAdminClient();

  const { data, error } = await admin.rpc("fn_liberar_reservas_expiradas", {
    p_limite: limit,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "rpc_failed", message: error.message },
      { status: 500 }
    );
  }

  const result = data as { ok: boolean; liberadas: number };

  console.log("[liberar-reservas-lote] completed", result);

  return NextResponse.json({
    ok: true,
    liberadas: result.liberadas,
    message:
      result.liberadas === 0
        ? "Nenhuma reserva expirada."
        : `${result.liberadas} reserva(s) liberadas.`,
  });
}

async function safeHandle(request: NextRequest) {
  try {
    return await handle(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "unknown");
    console.error("[liberar-reservas-lote] job failed", { error: message });
    return NextResponse.json(
      { ok: false, error: "job_failed", message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return safeHandle(request);
}

export async function POST(request: NextRequest) {
  return safeHandle(request);
}
