import type { AdmMockProfileOption, AdmRole, AdmUserStatus } from "@/types/adm/auth";

import { ADM_ENABLE_MOCK_SHORTCUTS, ADM_MOCK_DEFAULT_PASSWORD } from "@/lib/adm/auth/config";
import { getAdmRoleLabel } from "@/lib/adm/auth/roles";

type AdmMockUserRecord = {
  id: string;
  name: string;
  email: string;
  role: AdmRole;
  status: AdmUserStatus;
  password: string;
  lastLoginAt?: string | null;
  avatarUrl?: string | null;
};

const mockPassword = ADM_MOCK_DEFAULT_PASSWORD;

export const ADM_MOCK_USERS: AdmMockUserRecord[] = [
  {
    id: "adm-001",
    name: "Helena Martins",
    email: "helena.master@belapop.internal",
    role: "admin_master",
    status: "active",
    password: mockPassword,
    lastLoginAt: "2026-04-05T19:10:00.000Z"
  },
  {
    id: "adm-002",
    name: "Sofia Prado",
    email: "sofia.curadoria@belapop.internal",
    role: "curadoria",
    status: "active",
    password: mockPassword,
    lastLoginAt: "2026-04-05T18:42:00.000Z"
  },
  {
    id: "adm-003",
    name: "Mateus Leal",
    email: "mateus.financeiro@belapop.internal",
    role: "financeiro",
    status: "active",
    password: mockPassword,
    lastLoginAt: "2026-04-05T17:55:00.000Z"
  },
  {
    id: "adm-004",
    name: "Livia Porto",
    email: "livia.logistica@belapop.internal",
    role: "logistica",
    status: "active",
    password: mockPassword,
    lastLoginAt: "2026-04-05T17:21:00.000Z"
  },
  {
    id: "adm-005",
    name: "Rafael Costa",
    email: "rafael.operacao@belapop.internal",
    role: "operacao",
    status: "active",
    password: mockPassword,
    lastLoginAt: "2026-04-05T16:48:00.000Z"
  },
  {
    id: "adm-006",
    name: "Clara Vidal",
    email: "clara.catalogo@belapop.internal",
    role: "catalogo_marca",
    status: "active",
    password: mockPassword,
    lastLoginAt: "2026-04-05T16:11:00.000Z"
  },
  {
    id: "adm-007",
    name: "Bruno Leme",
    email: "bruno.suporte@belapop.internal",
    role: "suporte",
    status: "active",
    password: mockPassword,
    lastLoginAt: "2026-04-05T15:33:00.000Z"
  },
  {
    id: "adm-008",
    name: "Ana Carvalho",
    email: "ana.leitura@belapop.internal",
    role: "leitura",
    status: "active",
    password: mockPassword,
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
  if (user.password !== password) return null;
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
