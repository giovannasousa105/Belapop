import { NextResponse } from "next/server";

import { isAdmMockShortcutEnabled } from "@/lib/adm/auth/current-user";
import { findAdmMockUserById } from "@/lib/adm/auth/mock-users";
import { attachAdmSessionCookie } from "@/lib/adm/auth/session";
import { getRolePermissions } from "@/lib/adm/auth/roles";
import { getDefaultAdmLandingPath } from "@/lib/adm/auth/guards";

export async function POST(request: Request) {
  if (!isAdmMockShortcutEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Troca de perfil mock nao disponivel neste ambiente."
      },
      { status: 403 }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        userId?: string;
      }
    | null;

  const userId = payload?.userId?.trim() ?? "";
  const mockUser = findAdmMockUserById(userId);
  if (!mockUser || mockUser.status !== "active") {
    return NextResponse.json(
      {
        ok: false,
        error: "Perfil interno nao encontrado."
      },
      { status: 404 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: getDefaultAdmLandingPath({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      avatarUrl: mockUser.avatarUrl ?? null,
      role: mockUser.role,
      permissions: getRolePermissions(mockUser.role),
      status: mockUser.status,
      lastLoginAt: mockUser.lastLoginAt ?? null
    })
  });

  attachAdmSessionCookie(response, mockUser.id);
  return response;
}
