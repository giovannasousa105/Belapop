import "server-only";

import type { AdmSessionState, AuthenticatedAdmUser } from "@/types/adm/auth";

import {
  authenticateAdmMockUser,
  findAdmMockUserById,
  listAdmMockProfileOptions,
  shouldExposeAdmMockShortcuts
} from "@/lib/adm/auth/mock-users";
import { getRolePermissions } from "@/lib/adm/auth/roles";
import { readAdmSessionCookie } from "@/lib/adm/auth/session";

const toAuthenticatedAdmUser = (
  record: NonNullable<ReturnType<typeof findAdmMockUserById>>
): AuthenticatedAdmUser => ({
  id: record.id,
  name: record.name,
  email: record.email,
  avatarUrl: record.avatarUrl ?? null,
  role: record.role,
  permissions: getRolePermissions(record.role),
  status: record.status,
  lastLoginAt: record.lastLoginAt ?? null
});

export async function getAdmSessionState(): Promise<AdmSessionState> {
  const cookieResult = await readAdmSessionCookie();
  if (!cookieResult.payload) {
    return {
      user: null,
      reason: cookieResult.reason === "valid" ? "invalid" : cookieResult.reason
    };
  }

  const userRecord = findAdmMockUserById(cookieResult.payload.sub);
  if (!userRecord || userRecord.status !== "active") {
    return {
      user: null,
      reason: "invalid"
    };
  }

  return {
    user: toAuthenticatedAdmUser(userRecord),
    reason: "authenticated"
  };
}

export async function getCurrentAdmUser() {
  const state = await getAdmSessionState();
  return state.user;
}

export function authenticateAdmCredentials(email: string, password: string) {
  const userRecord = authenticateAdmMockUser(email, password);
  return userRecord ? toAuthenticatedAdmUser(userRecord) : null;
}

export function getAdmMockProfiles() {
  return listAdmMockProfileOptions();
}

export function isAdmMockShortcutEnabled() {
  return shouldExposeAdmMockShortcuts();
}
