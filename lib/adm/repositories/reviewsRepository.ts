import {
  applyDateRange,
  applySearch,
  applySort,
  normalizeListQuery,
  toDetailResponse,
  toListResponse
} from "@/lib/adm/repositories/base";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { DetailResponse, ListQueryParams, ListResponse, Review } from "@/types/adm";

export type ReviewListItem = Review & {
  sellerName: string;
  productName: string;
};

const withRelations = (
  review: Review,
  maps: {
    sellerMap: Record<string, { name: string }>;
    productMap: Record<string, { name: string }>;
  }
): ReviewListItem => ({
  ...review,
  sellerName: maps.sellerMap[review.sellerId]?.name ?? "Seller removido",
  productName: maps.productMap[review.productId]?.name ?? "Produto removido"
});

export const reviewsRepository = {
  async listReviews(params: ListQueryParams): Promise<ListResponse<ReviewListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc"
    });
    const maps = {
      sellerMap: Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller])),
      productMap: Object.fromEntries(adminMockData.products.map((product) => [product.id, product]))
    };

    let rows = adminMockData.reviews.map((review) => withRelations(review, maps));

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.product) rows = rows.filter((row) => row.productId === query.product);
    if (query.review) rows = rows.filter((row) => row.id === query.review);
    rows = applyDateRange(rows, query.dateRange, (row) => row.createdAt);

    rows = applySearch(rows, query.q, (row) =>
      `${row.id} ${row.excerpt} ${row.sellerName} ${row.productName} ${row.sentiment}`
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      createdAt: (row) => row.createdAt,
      seller: (row) => row.sellerName,
      product: (row) => row.productName,
      rating: (row) => row.rating,
      sentiment: (row) => row.sentiment,
      status: (row) => row.status
    });

    const partial = rows.some(
      (row) => row.sellerName === "Seller removido" || row.productName === "Produto removido"
    );
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async getReviewById(reviewId: string): Promise<DetailResponse<ReviewListItem>> {
    const adminMockData = await getAdmDataSource();
    const review = adminMockData.reviews.find((row) => row.id === reviewId);
    if (!review) return toDetailResponse<ReviewListItem>(null);
    const maps = {
      sellerMap: Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller])),
      productMap: Object.fromEntries(adminMockData.products.map((product) => [product.id, product]))
    };
    return toDetailResponse(withRelations(review, maps));
  }
};
