import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type SellerRbacRole = "ADMIN" | "OPERACAO" | "FINANCEIRO";

export const RBAC_PERMISSION_KEYS = [
  "finance.view_details",
  "finance.export",
  "finance.open_dispute",
  "finance.approve_adjustment",
  "promo.create",
  "promo.pause",
  "promo.max_discount_percent",
  "ads.budget_change",
  "users.manage_roles",
  "audit.view",
  "settings.edit_store",
  "pii.view_full"
] as const;

export type SellerPermissionKey = (typeof RBAC_PERMISSION_KEYS)[number];

export type PermissionValue = boolean | number;

export type SellerRbacContext = {
  sellerId: string;
  userId: string;
  role: SellerRbacRole;
  permissions: Record<SellerPermissionKey, PermissionValue>;
};

const DEFAULT_ROLE_PERMISSIONS: Record<SellerRbacRole, Record<SellerPermissionKey, PermissionValue>> = {
  ADMIN: {
    "finance.view_details": true,
    "finance.export": true,
    "finance.open_dispute": true,
    "finance.approve_adjustment": true,
    "promo.create": true,
    "promo.pause": true,
    "promo.max_discount_percent": 80,
    "ads.budget_change": true,
    "users.manage_roles": true,
    "audit.view": true,
    "settings.edit_store": true,
    "pii.view_full": true
  },
  OPERACAO: {
    "finance.view_details": false,
    "finance.export": false,
    "finance.open_dispute": false,
    "finance.approve_adjustment": false,
    "promo.create": true,
    "promo.pause": true,
    "promo.max_discount_percent": 15,
    "ads.budget_change": true,
    "users.manage_roles": false,
    "audit.view": false,
    "settings.edit_store": false,
    "pii.view_full": false
  },
  FINANCEIRO: {
    "finance.view_details": true,
    "finance.export": true,
    "finance.open_dispute": true,
    "finance.approve_adjustment": true,
    "promo.create": false,
    "promo.pause": false,
    "promo.max_discount_percent": 0,
    "ads.budget_change": false,
    "users.manage_roles": false,
    "audit.view": true,
    "settings.edit_store": false,
    "pii.view_full": false
  }
};

const isMissingTableError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("relation") && message.includes("does not exist");
};

const isMissingColumnError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("column") && message.includes("does not exist");
};

const mapLegacyRole = (legacyRole: string | null): SellerRbacRole | null => {
  if (!legacyRole) return null;
  const normalized = legacyRole.toLowerCase();
  if (normalized === "admin") return "ADMIN";
  if (normalized === "seller") return "OPERACAO";
  return null;
};

const parseRole = (value: string | null): SellerRbacRole | null => {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized === "ADMIN" || normalized === "OPERACAO" || normalized === "FINANCEIRO") {
    return normalized;
  }
  return null;
};

const cloneRoleDefaults = (role: SellerRbacRole): Record<SellerPermissionKey, PermissionValue> => {
  return { ...DEFAULT_ROLE_PERMISSIONS[role] };
};

export const getRoleDefaultPermissions = (
  role: SellerRbacRole
): Record<SellerPermissionKey, PermissionValue> => {
  return cloneRoleDefaults(role);
};

export const resolveSellerRbacContext = async (
  userId: string,
  sellerId: string
): Promise<SellerRbacContext | null> => {
  const admin = getSupabaseAdminClient();

  let role: SellerRbacRole | null = null;
  const roleLookup = await admin
    .from("seller_user_roles")
    .select("role")
    .eq("seller_id", sellerId)
    .eq("user_id", userId)
    .maybeSingle();

  if (
    roleLookup.error &&
    !isMissingTableError(roleLookup.error) &&
    !isMissingColumnError(roleLookup.error)
  ) {
    console.error("[rbac] seller_user_roles lookup failed", roleLookup.error);
    return null;
  }

  role = parseRole((roleLookup.data?.role as string | undefined) ?? null);

  if (!role && isMissingColumnError(roleLookup.error)) {
    const legacyRoleLookup = await admin
      .from("seller_user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (legacyRoleLookup.error && !isMissingTableError(legacyRoleLookup.error)) {
      console.error("[rbac] legacy seller_user_roles lookup failed", legacyRoleLookup.error);
      return null;
    }

    role = parseRole((legacyRoleLookup.data?.role as string | undefined) ?? null);
  }

  if (!role) {
    const legacyLookup = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (legacyLookup.error) {
      console.error("[rbac] user_roles fallback lookup failed", legacyLookup.error);
      return null;
    }
    role = mapLegacyRole((legacyLookup.data?.role as string | undefined) ?? null);
  }

  if (!role) return null;

  const permissions = cloneRoleDefaults(role);
  const permissionLookup = await admin
    .from("seller_user_permissions")
    .select("permission_key,bool_value,number_value")
    .eq("seller_id", sellerId)
    .eq("user_id", userId);

  if (permissionLookup.error) {
    if (isMissingColumnError(permissionLookup.error)) {
      const legacyPermissionLookup = await admin
        .from("seller_user_permissions")
        .select("permission_key,bool_value,number_value")
        .eq("user_id", userId);

      if (legacyPermissionLookup.error) {
        if (!isMissingTableError(legacyPermissionLookup.error)) {
          console.error(
            "[rbac] legacy seller_user_permissions lookup failed",
            legacyPermissionLookup.error
          );
        }
        return { sellerId, userId, role, permissions };
      }

      for (const row of legacyPermissionLookup.data ?? []) {
        const key = row.permission_key as SellerPermissionKey;
        if (!RBAC_PERMISSION_KEYS.includes(key)) continue;
        if (row.bool_value !== null && row.bool_value !== undefined) {
          permissions[key] = Boolean(row.bool_value);
          continue;
        }
        if (row.number_value !== null && row.number_value !== undefined) {
          permissions[key] = Number(row.number_value);
        }
      }

      return { sellerId, userId, role, permissions };
    }

    if (!isMissingTableError(permissionLookup.error)) {
      console.error("[rbac] seller_user_permissions lookup failed", permissionLookup.error);
    }
    return { sellerId, userId, role, permissions };
  }

  for (const row of permissionLookup.data ?? []) {
    const key = row.permission_key as SellerPermissionKey;
    if (!RBAC_PERMISSION_KEYS.includes(key)) continue;
    if (row.bool_value !== null && row.bool_value !== undefined) {
      permissions[key] = Boolean(row.bool_value);
      continue;
    }
    if (row.number_value !== null && row.number_value !== undefined) {
      permissions[key] = Number(row.number_value);
    }
  }

  return { sellerId, userId, role, permissions };
};

export const isRoleAllowed = (context: SellerRbacContext, roles: SellerRbacRole[]) => {
  if (context.role === "ADMIN") return true;
  return roles.includes(context.role);
};

export const hasPermission = (context: SellerRbacContext, key: SellerPermissionKey) => {
  if (context.role === "ADMIN") return true;
  const value = context.permissions[key];
  if (typeof value === "number") return value > 0;
  return value === true;
};

export const getNumericPermission = (
  context: SellerRbacContext,
  key: SellerPermissionKey,
  fallback = 0
) => {
  if (context.role === "ADMIN") return Number.MAX_SAFE_INTEGER;
  const value = context.permissions[key];
  if (typeof value === "number") return value;
  return fallback;
};

const obfuscateMiddle = (value: string, keepStart: number, keepEnd: number, mask = "*") => {
  if (!value) return "";
  if (value.length <= keepStart + keepEnd) return value;
  const start = value.slice(0, keepStart);
  const end = value.slice(value.length - keepEnd);
  const middle = mask.repeat(Math.max(3, value.length - keepStart - keepEnd));
  return `${start}${middle}${end}`;
};

export const maskEmail = (email: string | null | undefined, canViewFull: boolean) => {
  if (!email) return email ?? "";
  if (canViewFull) return email;
  const [local, domain] = email.split("@");
  if (!local || !domain) return obfuscateMiddle(email, 2, 2);
  return `${local.slice(0, 2)}***@${domain}`;
};

export const maskPhone = (phone: string | null | undefined, canViewFull: boolean) => {
  if (!phone) return phone ?? "";
  if (canViewFull) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "***";
  const normalized = digits.length > 11 ? digits.slice(-11) : digits;
  const ddd = normalized.length >= 10 ? normalized.slice(0, 2) : "**";
  const tail = normalized.slice(-4);
  return `(${ddd}) *****-${tail}`;
};

export const maskName = (name: string | null | undefined, canViewFull: boolean) => {
  if (!name) return name ?? "";
  if (canViewFull) return name;

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "***";

  const first = parts[0];
  if (parts.length === 1) {
    const prefix = first.slice(0, Math.min(2, first.length));
    return `${prefix}***`;
  }

  const last = parts[parts.length - 1];
  return `${first} ${last.charAt(0)}.`;
};

export const maskZip = (zip: string | null | undefined, canViewFull: boolean) => {
  if (!zip) return zip ?? "";
  if (canViewFull) return zip;
  const digits = zip.replace(/\D/g, "");
  if (digits.length !== 8) return "***";
  return `${digits.slice(0, 3)}**-***`;
};

type AddressLike = Record<string, unknown>;

export const maskAddress = (
  address: AddressLike | null | undefined,
  canViewFull: boolean
): AddressLike | null => {
  if (!address) return null;
  if (canViewFull) return address;

  const masked: AddressLike = { ...address };

  const zipSource =
    typeof masked.zipcode === "string"
      ? masked.zipcode
      : typeof masked.postal_code === "string"
        ? masked.postal_code
        : typeof masked.cep === "string"
          ? masked.cep
          : "";
  const maskedZip = maskZip(zipSource, false);

  if ("zipcode" in masked) masked.zipcode = maskedZip;
  if ("postal_code" in masked) masked.postal_code = maskedZip;
  if ("cep" in masked) masked.cep = maskedZip;

  if ("line1" in masked) masked.line1 = null;
  if ("line2" in masked) masked.line2 = null;
  if ("street" in masked) masked.street = null;
  if ("logradouro" in masked) masked.logradouro = null;
  if ("number" in masked) masked.number = null;
  if ("complement" in masked) masked.complement = null;
  if ("district" in masked) masked.district = null;
  if ("bairro" in masked) masked.bairro = null;

  if (typeof masked.email === "string") masked.email = maskEmail(masked.email, false);
  if (typeof masked.phone === "string") masked.phone = maskPhone(masked.phone, false);
  if (typeof masked.name === "string") masked.name = maskName(masked.name, false);
  if (typeof masked.recipient_name === "string") {
    masked.recipient_name = maskName(masked.recipient_name, false);
  }

  return masked;
};
