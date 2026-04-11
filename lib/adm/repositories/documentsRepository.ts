import {
  applyDateRange,
  applySearch,
  applySort,
  normalizeListQuery,
  toDetailResponse,
  toListResponse
} from "@/lib/adm/repositories/base";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { DetailResponse, Document, ListQueryParams, ListResponse } from "@/types/adm";

export type DocumentListItem = Document & {
  sellerName: string;
};

const withRelations = (
  document: Document,
  sellerMap: Record<string, { name: string }>
): DocumentListItem => ({
  ...document,
  sellerName: sellerMap[document.sellerId]?.name ?? "Seller removido"
});

export const documentsRepository = {
  async listDocuments(params: ListQueryParams): Promise<ListResponse<DocumentListItem>> {
    const adminData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "dueDate",
      defaultSortDir: "asc"
    });
    const sellerMap = Object.fromEntries(adminData.sellers.map((seller) => [seller.id, seller]));

    let rows = adminData.documents.map((document) => withRelations(document, sellerMap));

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.document) rows = rows.filter((row) => row.id === query.document);
    rows = applyDateRange(rows, query.dateRange, (row) => row.dueDate);

    rows = applySearch(rows, query.q, (row) =>
      `${row.id} ${row.type} ${row.owner} ${row.sellerName}`
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      seller: (row) => row.sellerName,
      type: (row) => row.type,
      owner: (row) => row.owner,
      dueDate: (row) => row.dueDate,
      status: (row) => row.status
    });

    const partial = rows.some((row) => row.sellerName === "Seller removido");
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async getDocumentById(documentId: string): Promise<DetailResponse<DocumentListItem>> {
    const adminData = await getAdmDataSource();
    const sellerMap = Object.fromEntries(adminData.sellers.map((seller) => [seller.id, seller]));
    const document = adminData.documents.find((row) => row.id === documentId);
    if (!document) return toDetailResponse<DocumentListItem>(null);
    return toDetailResponse(withRelations(document, sellerMap));
  }
};
