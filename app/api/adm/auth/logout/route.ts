import { NextResponse } from "next/server";

import { ADM_AUTH_LOGOUT_REDIRECT } from "@/lib/adm/auth/config";
import { clearAdmSessionCookie } from "@/lib/adm/auth/session";

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    redirectTo: ADM_AUTH_LOGOUT_REDIRECT
  });

  clearAdmSessionCookie(response);
  return response;
}
