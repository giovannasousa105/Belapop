import type {
  PermissionValue,
  SellerPermissionKey,
  SellerRbacRole
} from "@/lib/rbac/sellerPolicy";
import { getRoleDefaultPermissions } from "@/lib/rbac/sellerPolicy";

export type SellerAccessPresetKey =
  | "admin_default"
  | "operacao_default"
  | "financeiro_default"
  | "operacao_lider"
  | "financeiro_lider";

export type SellerAccessPreset = {
  key: SellerAccessPresetKey;
  label: string;
  description: string;
  role: SellerRbacRole;
  permissions: Record<SellerPermissionKey, PermissionValue>;
};

const withOverrides = (
  role: SellerRbacRole,
  overrides: Partial<Record<SellerPermissionKey, PermissionValue>>
): Record<SellerPermissionKey, PermissionValue> => {
  return {
    ...getRoleDefaultPermissions(role),
    ...overrides
  };
};

export const SELLER_ACCESS_PRESETS: SellerAccessPreset[] = [
  {
    key: "admin_default",
    label: "Admin (Default)",
    description: "Acesso total com governanca completa.",
    role: "ADMIN",
    permissions: withOverrides("ADMIN", {})
  },
  {
    key: "operacao_default",
    label: "Operacao (Default)",
    description: "Operacao diaria com limites de margem e sem financeiro sensivel.",
    role: "OPERACAO",
    permissions: withOverrides("OPERACAO", {})
  },
  {
    key: "financeiro_default",
    label: "Financeiro (Default)",
    description: "Controle de repasse e conciliacao sem operacao logistica.",
    role: "FINANCEIRO",
    permissions: withOverrides("FINANCEIRO", {})
  },
  {
    key: "operacao_lider",
    label: "Operacao Lider",
    description: "Operacao com mais autonomia de desconto e leitura de auditoria.",
    role: "OPERACAO",
    permissions: withOverrides("OPERACAO", {
      "audit.view": true,
      "promo.max_discount_percent": 20
    })
  },
  {
    key: "financeiro_lider",
    label: "Financeiro Lider",
    description: "Financeiro com acesso opcional a configuracoes criticas.",
    role: "FINANCEIRO",
    permissions: withOverrides("FINANCEIRO", {
      "settings.edit_store": true
    })
  }
];

export const getAccessPresetByKey = (key: string | null | undefined): SellerAccessPreset | null => {
  if (!key) return null;
  return SELLER_ACCESS_PRESETS.find((preset) => preset.key === key) ?? null;
};

export const buildPermissionDiff = (
  role: SellerRbacRole,
  permissions: Partial<Record<SellerPermissionKey, PermissionValue>>
) => {
  const roleDefaults = getRoleDefaultPermissions(role);
  const diff: Partial<Record<SellerPermissionKey, PermissionValue>> = {};
  for (const key of Object.keys(roleDefaults) as SellerPermissionKey[]) {
    if (!(key in permissions)) continue;
    const value = permissions[key];
    if (value === undefined) continue;
    if (roleDefaults[key] !== value) {
      diff[key] = value;
    }
  }
  return diff;
};
