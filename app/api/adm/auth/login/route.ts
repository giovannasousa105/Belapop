import { NextResponse } from "next/server";

import { authenticateAdmCredentials } from "@/lib/adm/auth/current-user";
import { attachAdmSessionCookie } from "@/lib/adm/auth/session";
import { canAccessRoute, getDefaultAdmLandingPath } from "@/lib/adm/auth/guards";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        email?: string;
        password?: string;
        next?: string;
      }
    | null;

  const email = payload?.email?.trim() ?? "";
  const password = payload?.password?.trim() ?? "";
  const nextPath = payload?.next?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.json(
      {
        ok: false,
        error: "Informe e-mail e senha para acessar o ADM."
      },
      { status: 400 }
    );
  }

  const user = authenticateAdmCredentials(email, password);
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Credenciais internas invalidas."
      },
      { status: 401 }
    );
  }

  const redirectTo =
    nextPath && canAccessRoute(user, nextPath).allowed
      ? nextPath
      : getDefaultAdmLandingPath(user);

  const response = NextResponse.json({
    ok: true,
    redirectTo
  });

  attachAdmSessionCookie(response, user.id);
  return response;
}
