import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServer } from "@/lib/supabase/server";
import {
  resolveUserRoleState,
  type PortalRole
} from "@/lib/auth/roleState";

export type UserRole = PortalRole;

type ResolvePortalRoleOptions = {
  loginRedirectTo?: string;
};

type PortalSession = {
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  userId: string;
  role: PortalRole;
  roles: PortalRole[];
};

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return null;
  }

  const state = await resolveUserRoleState({ userId: user.id, authUser: user });
  return state.activePortalRole;
}

export async function getPortalSession(
  options: ResolvePortalRoleOptions = {}
): Promise<PortalSession> {
  const supabase = await createSupabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(options.loginRedirectTo ?? "/login");
  }

  const state = await resolveUserRoleState({
    userId: user.id,
    authUser: user
  });

  return {
    supabase,
    userId: user.id,
    role: state.activePortalRole,
    roles: state.assignedPortalRoles
  };
}
