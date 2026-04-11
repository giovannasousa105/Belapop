import {
  applyDateRange,
  applySearch,
  applySort,
  normalizeListQuery,
  toDetailResponse,
  toListResponse
} from "@/lib/adm/repositories/base";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type {
  DetailResponse,
  FinancialAlert,
  ListQueryParams,
  ListResponse,
  Payout,
  Refund
} from "@/types/adm";

export type PayoutListItem = Payout & {
  sellerName: string;
};

export type RefundListItem = Refund & {
  sellerName: string;
};

export type FinancialAlertListItem = FinancialAlert & {
  sellerName: string;
};

export type FinanceSummary = {
  grossPayout: number;
  netPayout: number;
  refundAmount: number;
  openAlerts: number;
};

const withPayoutRelations = (
  payout: Payout,
  sellerMap: Record<string, { name: string }>
): PayoutListItem => ({
  ...payout,
  sellerName: sellerMap[payout.sellerId]?.name ?? "Seller removido"
});

const withRefundRelations = (
  refund: Refund,
  sellerMap: Record<string, { name: string }>
): RefundListItem => ({
  ...refund,
  sellerName: sellerMap[refund.sellerId]?.name ?? "Seller removido"
});

const withAlertRelations = (
  alert: FinancialAlert,
  sellerMap: Record<string, { name: string }>
): FinancialAlertListItem => ({
  ...alert,
  sellerName: sellerMap[alert.sellerId]?.name ?? "Seller removido"
});

export const financeRepository = {
  async getFinanceSummary(): Promise<FinanceSummary> {
    const adminMockData = await getAdmDataSource();
    const grossPayout = adminMockData.payouts.reduce((sum, row) => sum + row.grossAmount, 0);
    const netPayout = adminMockData.payouts.reduce((sum, row) => sum + row.netAmount, 0);
    const refundAmount = adminMockData.refunds.reduce((sum, row) => sum + row.amount, 0);
    const openAlerts = adminMockData.financialAlerts.filter((row) => row.status !== "resolvido").length;

    return { grossPayout, netPayout, refundAmount, openAlerts };
  },

  async listPayouts(params: ListQueryParams): Promise<ListResponse<PayoutListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "scheduledAt",
      defaultSortDir: "desc"
    });
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));

    let rows = adminMockData.payouts.map((payout) => withPayoutRelations(payout, sellerMap));

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.payout) rows = rows.filter((row) => row.id === query.payout);
    rows = applyDateRange(rows, query.dateRange, (row) => row.scheduledAt);

    rows = applySearch(rows, query.q, (row) => `${row.id} ${row.sellerName}`);

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      seller: (row) => row.sellerName,
      grossAmount: (row) => row.grossAmount,
      netAmount: (row) => row.netAmount,
      scheduledAt: (row) => row.scheduledAt,
      status: (row) => row.status
    });

    const partial = rows.some((row) => row.sellerName === "Seller removido");
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async listRefunds(params: ListQueryParams): Promise<ListResponse<RefundListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "requestedAt",
      defaultSortDir: "desc"
    });
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));

    let rows = adminMockData.refunds.map((refund) => withRefundRelations(refund, sellerMap));

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.order) rows = rows.filter((row) => row.orderId === query.order);
    if (query.refund) rows = rows.filter((row) => row.id === query.refund);
    rows = applyDateRange(rows, query.dateRange, (row) => row.requestedAt);

    rows = applySearch(rows, query.q, (row) =>
      `${row.id} ${row.orderId} ${row.reason} ${row.sellerName}`
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      order: (row) => row.orderId,
      seller: (row) => row.sellerName,
      amount: (row) => row.amount,
      requestedAt: (row) => row.requestedAt,
      status: (row) => row.status
    });

    const partial = rows.some((row) => row.sellerName === "Seller removido");
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async listFinancialAlerts(params: ListQueryParams): Promise<ListResponse<FinancialAlertListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc"
    });
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));

    let rows = adminMockData.financialAlerts.map((alert) => withAlertRelations(alert, sellerMap));

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.priority) rows = rows.filter((row) => row.priority === query.priority);
    if (query.order) rows = rows.filter((row) => row.orderId === query.order);
    if (query.alert) rows = rows.filter((row) => row.id === query.alert);
    rows = applyDateRange(rows, query.dateRange, (row) => row.createdAt);

    rows = applySearch(rows, query.q, (row) =>
      `${row.id} ${row.type} ${row.summary} ${row.sellerName}`
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      seller: (row) => row.sellerName,
      type: (row) => row.type,
      priority: (row) => row.priority,
      createdAt: (row) => row.createdAt,
      status: (row) => row.status
    });

    const partial = rows.some((row) => row.sellerName === "Seller removido");
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async getRefundById(refundId: string): Promise<DetailResponse<RefundListItem>> {
    const adminMockData = await getAdmDataSource();
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));
    const refund = adminMockData.refunds.find((row) => row.id === refundId);
    if (!refund) return toDetailResponse<RefundListItem>(null);
    return toDetailResponse(withRefundRelations(refund, sellerMap));
  },

  async getPayoutById(payoutId: string): Promise<DetailResponse<PayoutListItem>> {
    const adminMockData = await getAdmDataSource();
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));
    const payout = adminMockData.payouts.find((row) => row.id === payoutId);
    if (!payout) return toDetailResponse<PayoutListItem>(null);
    return toDetailResponse(withPayoutRelations(payout, sellerMap));
  },

  async getRefundByOrderId(orderId: string): Promise<DetailResponse<RefundListItem>> {
    const adminMockData = await getAdmDataSource();
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));
    const refund = adminMockData.refunds.find((row) => row.orderId === orderId);
    if (!refund) return toDetailResponse<RefundListItem>(null);
    return toDetailResponse(withRefundRelations(refund, sellerMap));
  },

  async getFinancialAlertById(alertId: string): Promise<DetailResponse<FinancialAlertListItem>> {
    const adminMockData = await getAdmDataSource();
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));
    const alert = adminMockData.financialAlerts.find((row) => row.id === alertId);
    if (!alert) return toDetailResponse<FinancialAlertListItem>(null);
    return toDetailResponse(withAlertRelations(alert, sellerMap));
  }
};
