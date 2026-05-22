import { createCatalogQualityStandardSnapshot } from "@/lib/catalog-standards/domain/snapshot";
import type {
  CatalogQualityStandardSnapshot,
  ProductSkuStandard,
  SellerStandardRecord
} from "@/lib/catalog-standards/types";

export function toCatalogQualityStandardSnapshot({
  products,
  sellers
}: {
  products: ProductSkuStandard[];
  sellers: SellerStandardRecord[];
}): CatalogQualityStandardSnapshot {
  return createCatalogQualityStandardSnapshot(sellers, products);
}

export function hasUsableCatalogStandardSnapshot(snapshot: CatalogQualityStandardSnapshot) {
  return snapshot.sellers.length > 0 && snapshot.products.length > 0;
}
