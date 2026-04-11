import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  RBAC_PERMISSION_KEYS,
  type PermissionValue,
  type SellerPermissionKey
} from "@/lib/rbac/sellerPolicy";

type AnyError = { code?: string | null; message?: string | null } | null;

const numericKeys: SellerPermissionKey[] = ["promo.max_discount_percent"];

export const isMissingColumnError = (error: AnyError) => {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("column") && message.includes("does not exist");
};

export const isMissingTableError = (error: AnyError) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("relation") && message.includes("does not exist");
};

export const isPermissionKey = (value: string): value is SellerPermissionKey => {
  return RBAC_PERMISSION_KEYS.includes(value as SellerPermissionKey);
};

export const normalizePermissionValue = (
  key: SellerPermissionKey,
  rawValue: unknown
): PermissionValue | null => {
  if (rawValue === null) return null;
  if (numericKeys.includes(key)) {
    const number = Number(rawValue);
    if (!Number.isFinite(number) || number < 0) return null;
    return number;
  }
  if (typeof rawValue !== "boolean") return null;
  return rawValue;
};

export const loadPermissionOverridesForUsers = async (
  admin: SupabaseClient,
  sellerId: string,
  userIds: string[]
) => {
  if (!userIds.length) return new Map<string, Partial<Record<SellerPermissionKey, PermissionValue>>>();

  const lookup = await admin
    .from("seller_user_permissions")
    .select("user_id,permission_key,bool_value,number_value")
    .eq("seller_id", sellerId)
    .in("user_id", userIds);

  if (lookup.error) {
    if (isMissingColumnError(lookup.error)) {
      const legacyLookup = await admin
        .from("seller_user_permissions")
        .select("user_id,permission_key,bool_value,number_value")
        .in("user_id", userIds);

      if (legacyLookup.error) {
        if (!isMissingTableError(legacyLookup.error)) {
          console.error("[sellerAccess] legacy permission lookup failed", legacyLookup.error);
        }
        return new Map<string, Partial<Record<SellerPermissionKey, PermissionValue>>>();
      }

      const legacyMap = new Map<string, Partial<Record<SellerPermissionKey, PermissionValue>>>();
      for (const row of legacyLookup.data ?? []) {
        const key = String(row.permission_key ?? "");
        if (!isPermissionKey(key)) continue;
        const value =
          row.bool_value === null || row.bool_value === undefined
            ? Number(row.number_value)
            : Boolean(row.bool_value);
        const current = legacyMap.get(row.user_id) ?? {};
        current[key] = value;
        legacyMap.set(row.user_id, current);
      }
      return legacyMap;
    }

    if (!isMissingTableError(lookup.error)) {
      console.error("[sellerAccess] permission lookup failed", lookup.error);
    }
    return new Map<string, Partial<Record<SellerPermissionKey, PermissionValue>>>();
  }

  const map = new Map<string, Partial<Record<SellerPermissionKey, PermissionValue>>>();
  for (const row of lookup.data ?? []) {
    const key = String(row.permission_key ?? "");
    if (!isPermissionKey(key)) continue;
    const value =
      row.bool_value === null || row.bool_value === undefined
        ? Number(row.number_value)
        : Boolean(row.bool_value);
    const current = map.get(row.user_id) ?? {};
    current[key] = value;
    map.set(row.user_id, current);
  }
  return map;
};

export const syncPermissionOverrides = async (
  admin: SupabaseClient,
  sellerId: string,
  userId: string,
  values: Partial<Record<SellerPermissionKey, PermissionValue | null>>
) => {
  const deletes: SellerPermissionKey[] = [];
  const upserts: Array<{
    seller_id: string;
    user_id: string;
    permission_key: SellerPermissionKey;
    bool_value: boolean | null;
    number_value: number | null;
  }> = [];

  for (const key of RBAC_PERMISSION_KEYS) {
    if (!(key in values)) continue;
    const rawValue = values[key];
    if (rawValue === undefined || rawValue === null) {
      deletes.push(key);
      continue;
    }
    if (numericKeys.includes(key)) {
      upserts.push({
        seller_id: sellerId,
        user_id: userId,
        permission_key: key,
        bool_value: null,
        number_value: Number(rawValue)
      });
      continue;
    }
    upserts.push({
      seller_id: sellerId,
      user_id: userId,
      permission_key: key,
      bool_value: Boolean(rawValue),
      number_value: null
    });
  }

  if (deletes.length) {
    const del = await admin
      .from("seller_user_permissions")
      .delete()
      .eq("seller_id", sellerId)
      .eq("user_id", userId)
      .in("permission_key", deletes);
    if (del.error && !isMissingTableError(del.error) && !isMissingColumnError(del.error)) {
      return { ok: false, error: del.error.message };
    }

    if (del.error && isMissingColumnError(del.error)) {
      const legacyDelete = await admin
        .from("seller_user_permissions")
        .delete()
        .eq("user_id", userId)
        .in("permission_key", deletes);
      if (legacyDelete.error && !isMissingTableError(legacyDelete.error)) {
        return { ok: false, error: legacyDelete.error.message };
      }
    }
  }

  if (upserts.length) {
    const upsert = await admin
      .from("seller_user_permissions")
      .upsert(upserts, { onConflict: "seller_id,user_id,permission_key" });
    if (upsert.error) {
      if (isMissingColumnError(upsert.error)) {
        const legacyUpsert = await admin.from("seller_user_permissions").upsert(
          upserts.map(({ seller_id: _ignoredSellerId, ...legacy }) => legacy),
          { onConflict: "user_id,permission_key" }
        );
        if (legacyUpsert.error) {
          return { ok: false, error: legacyUpsert.error.message };
        }
        return { ok: true as const };
      }
      return { ok: false, error: upsert.error.message };
    }
  }

  return { ok: true as const };
};
