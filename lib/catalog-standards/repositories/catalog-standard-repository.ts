import type {
  CatalogQualityStandardSnapshot,
  ProductSkuStandard,
  SellerStandardRecord
} from "@/lib/catalog-standards/types";

export type CatalogStandardsRepositorySource = "supabase" | "fallback-seed";

export interface CatalogStandardsRepository {
  getProductByProductId(productId: string): Promise<ProductSkuStandard | null>;
  getSellerBySellerId(sellerId: string): Promise<SellerStandardRecord | null>;
  getSnapshot(): Promise<CatalogQualityStandardSnapshot>;
  listProducts(): Promise<ProductSkuStandard[]>;
  listSellers(): Promise<SellerStandardRecord[]>;
  source: CatalogStandardsRepositorySource;
}
