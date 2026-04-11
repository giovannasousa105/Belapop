import {
  applySearch,
  applySort,
  normalizeListQuery,
  toDetailResponse,
  toListResponse
} from "@/lib/adm/repositories/base";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { DetailResponse, ListQueryParams, ListResponse, Seller } from "@/types/adm";

export type SellerListItem = Seller & {
  incidentsCount: number;
  criticalIncidentsCount: number;
  openRefundsCount: number;
};

export type SellerDetail = {
  seller: SellerListItem;
  productsCount: number;
  pendingDocumentsCount: number;
  openFinancialAlertsCount: number;
};

const withRelations = (seller: Seller, data: Awaited<ReturnType<typeof getAdmDataSource>>): SellerListItem => {
  const incidents = data.logisticsIncidents.filter((row) => row.sellerId === seller.id);
  const openRefunds = data.refunds.filter(
    (row) => row.sellerId === seller.id && row.status !== "resolvido"
  );

  return {
    ...seller,
    incidentsCount: incidents.length,
    criticalIncidentsCount: incidents.filter((row) => row.priority === "critica").length,
    openRefundsCount: openRefunds.length
  };
};

export const sellersRepository = {
  async listSellers(params: ListQueryParams): Promise<ListResponse<SellerListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "qualityScore",
      defaultSortDir: "desc"
    });

    let rows = adminMockData.sellers.map((seller) => withRelations(seller, adminMockData));

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.id === query.seller);
    if (query.category) rows = rows.filter((row) => row.category === query.category);
    if (query.priority) rows = rows.filter((row) => row.riskLevel === query.priority);
    if (query.risk) rows = rows.filter((row) => row.riskLevel === query.risk);

    rows = applySearch(rows, query.q, (row) =>
      `${row.id} ${row.name} ${row.category} ${row.tier}`
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      name: (row) => row.name,
      category: (row) => row.category,
      qualityScore: (row) => row.qualityScore,
      gmv30d: (row) => row.gmv30d,
      activeProducts: (row) => row.activeProducts,
      riskLevel: (row) => row.riskLevel,
      status: (row) => row.status
    });

    return toListResponse(rows, query.page, query.pageSize);
  },

  async getSellerById(sellerId: string): Promise<DetailResponse<SellerDetail>> {
    const adminMockData = await getAdmDataSource();
    const seller = adminMockData.sellers.find((row) => row.id === sellerId);
    if (!seller) return toDetailResponse<SellerDetail>(null);

    const hydrated = withRelations(seller, adminMockData);
    const productsCount = adminMockData.products.filter((row) => row.sellerId === seller.id).length;
    const pendingDocumentsCount = adminMockData.documents.filter(
      (row) => row.sellerId === seller.id && row.status !== "aprovado"
    ).length;
    const openFinancialAlertsCount = adminMockData.financialAlerts.filter(
      (row) => row.sellerId === seller.id && row.status !== "resolvido"
    ).length;

    return toDetailResponse({
      seller: hydrated,
      productsCount,
      pendingDocumentsCount,
      openFinancialAlertsCount
    });
  }
};
