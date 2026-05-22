import "server-only";

import { toCatalogQualityStandardSnapshot } from "@/lib/catalog-standards/adapters/snapshot";
import {
  isValidProductSkuStandard,
  isValidSellerStandardRecord
} from "@/lib/catalog-standards/domain/validation";
import { mapProductStandardRow, mapSellerStandardRow } from "@/lib/catalog-standards/mappers/supabase";
import type { CatalogStandardsRepository } from "@/lib/catalog-standards/repositories/catalog-standard-repository";
import { getCatalogStandardsSupabaseReadClient } from "@/lib/catalog-standards/supabase/client";
import type {
  CatalogStandardProductRow,
  CatalogStandardSellerRow
} from "@/lib/catalog-standards/supabase/types";
import type { ProductSkuStandard, SellerStandardRecord } from "@/lib/catalog-standards/types";

type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

const MISSING_SCHEMA_ERROR_CODES = new Set(["42P01", "42703", "PGRST204", "PGRST205"]);

const isRecoverableSupabaseError = (error: SupabaseErrorLike | null | undefined) => {
  if (!error) return false;
  if (error.code && MISSING_SCHEMA_ERROR_CODES.has(error.code)) return true;

  const message = String(error.message ?? "").toLowerCase();
  return (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
};

const assertClient = () => {
  const client = getCatalogStandardsSupabaseReadClient();
  if (!client) {
    throw new Error("Supabase catalog standards read client is not configured.");
  }
  return client;
};

const throwRepositoryError = (label: string, error: SupabaseErrorLike) => {
  const suffix = error.message ? `: ${error.message}` : "";
  const recoverable = isRecoverableSupabaseError(error) ? "recoverable " : "";
  throw new Error(`BelaPop Quality Standard ${recoverable}${label} query failed${suffix}`);
};

const isMappedProductStandard = (product: ProductSkuStandard | null): product is ProductSkuStandard =>
  product !== null && isValidProductSkuStandard(product);

const isMappedSellerStandard = (seller: SellerStandardRecord | null): seller is SellerStandardRecord =>
  seller !== null && isValidSellerStandardRecord(seller);

export function createSupabaseCatalogStandardsRepository(): CatalogStandardsRepository {
  return {
    source: "supabase",
    async getProductByProductId(productId) {
      const client = assertClient();
      const { data, error } = await client
        .from("catalog_standard_products")
        .select("*")
        .eq("product_id", productId)
        .limit(1);

      if (error) throwRepositoryError("product", error);
      const product = data?.[0] ? mapProductStandardRow(data[0] as CatalogStandardProductRow) : null;
      return product && isValidProductSkuStandard(product) ? product : null;
    },
    async getSellerBySellerId(sellerId) {
      const client = assertClient();
      const { data, error } = await client
        .from("catalog_standard_sellers")
        .select("*")
        .eq("seller_id", sellerId)
        .limit(1);

      if (error) throwRepositoryError("seller", error);
      const seller = data?.[0] ? mapSellerStandardRow(data[0] as CatalogStandardSellerRow) : null;
      return seller && isValidSellerStandardRecord(seller) ? seller : null;
    },
    async getSnapshot() {
      const [sellers, products] = await Promise.all([this.listSellers(), this.listProducts()]);
      return toCatalogQualityStandardSnapshot({ products, sellers });
    },
    async listProducts() {
      const client = assertClient();
      const { data, error } = await client
        .from("catalog_standard_products")
        .select("*")
        .order("quality_score", { ascending: false })
        .order("product_id", { ascending: true });

      if (error) throwRepositoryError("products", error);
      return (data ?? [])
        .map((row) => mapProductStandardRow(row as CatalogStandardProductRow))
        .filter(isMappedProductStandard);
    },
    async listSellers() {
      const client = assertClient();
      const { data, error } = await client
        .from("catalog_standard_sellers")
        .select("*")
        .order("quality_score", { ascending: false })
        .order("seller_id", { ascending: true });

      if (error) throwRepositoryError("sellers", error);
      return (data ?? [])
        .map((row) => mapSellerStandardRow(row as CatalogStandardSellerRow))
        .filter(isMappedSellerStandard);
    }
  };
}
