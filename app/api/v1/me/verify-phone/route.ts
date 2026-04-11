import { NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

export async function POST() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    {
      ok: false,
      error: "Verificacao de telefone por OTP ainda nao configurada no backend."
    },
    { status: 501 }
  );
}
