import type { AdmMockProfileOption, AdmRole, AdmUserStatus } from "@/types/adm/auth";

import { ADM_ENABLE_MOCK_SHORTCUTS } from "@/lib/adm/auth/config";
import { getAdmRoleLabel } from "@/lib/adm/auth/roles";

type AdmMockUserRecord = {
  id: string;
  name: string;
  email: string;
  role: AdmRole;
  status: AdmUserStatus;
  lastLoginAt?: string | null;
  avatarUrl?: string | null;
};

export const ADM_MOCK_USERS: AdmMockUserRecord[] = [
  {
    id: "adm-001",
    name: "Helena Martins",
    email: "helena.master@belapop.internal",
    role: "admin_master",
    status: "active",
    lastLoginAt: "2026-04-05T19:10:00.000Z"
  },
  {
    id: "adm-002",
    name: "Sofia Prado",
    email: "sofia.curadoria@belapop.internal",
    role: "curadoria",
    status: "active",
    lastLoginAt: "2026-04-05T18:42:00.000Z"
  },
  {
    id: "adm-003",
    name: "Mateus Leal",
    email: "mateus.financeiro@belapop.internal",
    role: "financeiro",
    status: "active",
    lastLoginAt: "2026-04-05T17:55:00.000Z"
  },
  {
    id: "adm-004",
    name: "Livia Porto",
    email: "livia.logistica@belapop.internal",
    role: "logistica",
    status: "active",
    lastLoginAt: "2026-04-05T17:21:00.000Z"
  },
  {
    id: "adm-005",
    name: "Rafael Costa",
    email: "rafael.operação@belapop.internal",
    role: "operação",
    status: "active",
    lastLoginAt: "2026-04-05T16:48:00.000Z"
  },
  {
    id: "adm-006",
    name: "Clara Vidal",
    email: "clara.catalogo@belapop.internal",
    role: "catalogo_marca",
    status: "active",
    lastLoginAt: "2026-04-05T16:11:00.000Z"
  },
  {
    id: "adm-007",
    name: "Bruno Leme",
    email: "bruno.suporte@belapop.internal",
    role: "suporte",
    status: "active",
    lastLoginAt: "2026-04-05T15:33:00.000Z"
  },
  {
    id: "adm-008",
    name: "Ana Carvalho",
    email: "ana.leitura@belapop.internal",
    role: "leitura",
    status: "active",
    lastLoginAt: "2026-04-05T14:58:00.000Z"
  }
];

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function findAdmMockUserById(userId: string) {
  return ADM_MOCK_USERS.find((user) => user.id === userId) ?? null;
}

export function findAdmMockUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return ADM_MOCK_USERS.find((user) => normalizeEmail(user.email) === normalizedEmail) ?? null;
}

export function authenticateAdmMockUser(email: string, password: string) {
  const user = findAdmMockUserByEmail(email);
  if (!user) return null;
  if (user.status !== "active") return null;

  // Senha lida de env var em runtime — nunca hardcoded no código-fonte.
  // Em produção: defina ADM_ADMIN_PASSWORD na Vercel. Sem ela, auth é bloqueado.
  // .trim() defensivo previne falhas por newline vindo de pipe de CLI.
  const configuredPassword = (process.env.ADM_ADMIN_PASSWORD ?? "").trim();
  if (!configuredPassword) {
    if (process.env.NODE_ENV === "production") return null;
    // Desenvolvimento local: defina ADM_ADMIN_PASSWORD no .env.local
    const devFallback = (process.env.ADM_ADMIN_PASSWORD_DEV ?? "").trim();
    if (!devFallback || devFallback !== password.trim()) return null;
    return user;
  }

  if (configuredPassword !== password.trim()) return null;
  return user;
}

export function listAdmMockProfileOptions(): AdmMockProfileOption[] {
  return ADM_MOCK_USERS.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: getAdmRoleLabel(user.role)
  }));
}

export function shouldExposeAdmMockShortcuts() {
  return ADM_ENABLE_MOCK_SHORTCUTS;
}
