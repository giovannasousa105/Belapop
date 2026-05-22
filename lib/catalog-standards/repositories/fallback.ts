import "server-only";

import { belapopQualityStandard, mockProductStandards, mockSellerStandards } from "@/lib/catalog-standards/mock";
import type { CatalogStandardsRepository } from "@/lib/catalog-standards/repositories/catalog-standard-repository";
import type { CatalogQualityStandardSnapshot } from "@/lib/catalog-standards/types";

export const fallbackCatalogStandardsRepository: CatalogStandardsRepository = {
  source: "fallback-seed",
  async getProductByProductId(productId) {
    return mockProductStandards.find((product) => product.productId === productId) ?? null;
  },
  async getSellerBySellerId(sellerId) {
    return mockSellerStandards.find((seller) => seller.sellerId === sellerId) ?? null;
  },
  async getSnapshot() {
    return belapopQualityStandard as CatalogQualityStandardSnapshot;
  },
  async listProducts() {
    return mockProductStandards;
  },
  async listSellers() {
    return mockSellerStandards;
  }
};
