import {
  applyDateRange,
  applySearch,
  applySort,
  normalizeListQuery,
  toDetailResponse,
  toListResponse
} from "@/lib/adm/repositories/base";
import { admDataSource as adminMockData } from "@/lib/adm/repositories/source";
import type { ComplianceFlag, CurationRule, DetailResponse, ListQueryParams, ListResponse } from "@/types/adm";

export type CurationRuleListItem = CurationRule & {
  targetName: string;
  sellerId?: string;
  sellerName?: string;
  productId?: string;
  productName?: string;
};

export type ComplianceFlagListItem = ComplianceFlag & {
  sellerName: string;
  productName?: string;
  documentType?: string;
  alertType?: string;
};

const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));
const productMap = Object.fromEntries(adminMockData.products.map((product) => [product.id, product]));
const documentMap = Object.fromEntries(adminMockData.documents.map((document) => [document.id, document]));
const alertMap = Object.fromEntries(adminMockData.financialAlerts.map((alert) => [alert.id, alert]));

const withRuleRelations = (rule: CurationRule): CurationRuleListItem => {
  const product = rule.targetType === "product" ? productMap[rule.targetId] : undefined;
  const seller =
    rule.targetType === "seller"
      ? sellerMap[rule.targetId]
      : product
        ? sellerMap[product.sellerId]
        : undefined;

  return {
    ...rule,
    targetName: rule.targetType === "seller" ? seller?.name ?? "Seller removido" : product?.name ?? "Produto removido",
    sellerId: seller?.id,
    sellerName: seller?.name,
    productId: product?.id,
    productName: product?.name
  };
};

const withComplianceRelations = (flag: ComplianceFlag): ComplianceFlagListItem => ({
  ...flag,
  sellerName: sellerMap[flag.sellerId]?.name ?? "Seller removido",
  productName: flag.productId ? productMap[flag.productId]?.name : undefined,
  documentType: flag.documentId ? documentMap[flag.documentId]?.type : undefined,
  alertType: flag.alertId ? alertMap[flag.alertId]?.type : undefined
});

export const governanceRepository = {
  listCurationRules(params: ListQueryParams): ListResponse<CurationRuleListItem> {
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "updatedAt",
      defaultSortDir: "desc"
    });

    let rows = adminMockData.curationRules.map(withRuleRelations);

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.product) rows = rows.filter((row) => row.productId === query.product);
    if (query.priority) rows = rows.filter((row) => row.priority === query.priority);
    rows = applyDateRange(rows, query.dateRange, (row) => row.updatedAt);

    rows = applySearch(rows, query.q, (row) =>
      [
        row.id,
        row.name,
        row.scope,
        row.owner,
        row.condition,
        row.action,
        row.targetName,
        row.sellerName,
        row.productName
      ]
        .filter(Boolean)
        .join(" ")
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      name: (row) => row.name,
      scope: (row) => row.scope,
      owner: (row) => row.owner,
      updatedAt: (row) => row.updatedAt,
      status: (row) => row.status,
      priority: (row) => row.priority
    });

    return toListResponse(rows, query.page, query.pageSize);
  },

  getCurationRuleById(ruleId: string): DetailResponse<CurationRuleListItem> {
    const rule = adminMockData.curationRules.find((row) => row.id === ruleId);
    if (!rule) return toDetailResponse<CurationRuleListItem>(null);
    return toDetailResponse(withRuleRelations(rule));
  },

  listComplianceFlags(params: ListQueryParams): ListResponse<ComplianceFlagListItem> {
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc"
    });

    let rows = adminMockData.complianceFlags.map(withComplianceRelations);

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.product) rows = rows.filter((row) => row.productId === query.product);
    if (query.document) rows = rows.filter((row) => row.documentId === query.document);
    if (query.alert) rows = rows.filter((row) => row.alertId === query.alert);
    if (query.priority) rows = rows.filter((row) => row.priority === query.priority);
    rows = applyDateRange(rows, query.dateRange, (row) => row.createdAt);

    rows = applySearch(rows, query.q, (row) =>
      [
        row.id,
        row.type,
        row.summary,
        row.sellerName,
        row.productName,
        row.documentType,
        row.alertType
      ]
        .filter(Boolean)
        .join(" ")
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      type: (row) => row.type,
      seller: (row) => row.sellerName,
      createdAt: (row) => row.createdAt,
      status: (row) => row.status,
      priority: (row) => row.priority
    });

    return toListResponse(rows, query.page, query.pageSize);
  },

  getComplianceFlagById(flagId: string): DetailResponse<ComplianceFlagListItem> {
    const flag = adminMockData.complianceFlags.find((row) => row.id === flagId);
    if (!flag) return toDetailResponse<ComplianceFlagListItem>(null);
    return toDetailResponse(withComplianceRelations(flag));
  }
};
