import {
  applyDateRange,
  applySearch,
  applySort,
  normalizeListQuery,
  toDetailResponse,
  toListResponse
} from "@/lib/adm/repositories/base";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { DetailResponse, ListQueryParams, ListResponse, Order } from "@/types/adm";

export type OrderListItem = Order & {
  sellerName: string;
  customerName: string;
  productName: string;
};

export type OrderDetail = {
  order: OrderListItem;
};

const withRelations = (
  order: Order,
  maps: {
    sellerMap: Record<string, { name: string }>;
    customerMap: Record<string, { name: string }>;
    productMap: Record<string, { name: string }>;
  }
): OrderListItem => ({
  ...order,
  sellerName: maps.sellerMap[order.sellerId]?.name ?? "Seller removido",
  customerName: maps.customerMap[order.customerId]?.name ?? "Cliente removido",
  productName: maps.productMap[order.productId]?.name ?? "Produto removido"
});

export const ordersRepository = {
  async listOrders(params: ListQueryParams): Promise<ListResponse<OrderListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc"
    });
    const maps = {
      sellerMap: Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller])),
      customerMap: Object.fromEntries(adminMockData.customers.map((customer) => [customer.id, customer])),
      productMap: Object.fromEntries(adminMockData.products.map((product) => [product.id, product]))
    };

    let rows = adminMockData.orders.map((order) => withRelations(order, maps));

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.priority) rows = rows.filter((row) => row.priority === query.priority);
    if (query.order) rows = rows.filter((row) => row.id === query.order);
    if (query.product) rows = rows.filter((row) => row.productId === query.product);
    rows = applyDateRange(rows, query.dateRange, (row) => row.createdAt);

    rows = applySearch(rows, query.q, (row) =>
      `${row.id} ${row.customerName} ${row.sellerName} ${row.productName}`
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      createdAt: (row) => row.createdAt,
      seller: (row) => row.sellerName,
      customer: (row) => row.customerName,
      total: (row) => row.total,
      priority: (row) => row.priority,
      status: (row) => row.status
    });

    const partial = rows.some(
      (row) =>
        row.sellerName === "Seller removido" ||
        row.customerName === "Cliente removido" ||
        row.productName === "Produto removido"
    );

    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async listCriticalOrders(params: ListQueryParams): Promise<ListResponse<OrderListItem>> {
    const baseStatus = params.status ?? "critico";
    const statusFiltered = await this.listOrders({ ...params, status: baseStatus });
    if (statusFiltered.success) return statusFiltered;

    return this.listOrders({
      ...params,
      priority: params.priority ?? "critica"
    });
  },

  async getOrderById(orderId: string): Promise<DetailResponse<OrderDetail>> {
    const adminMockData = await getAdmDataSource();
    const order = adminMockData.orders.find((row) => row.id === orderId);
    if (!order) return toDetailResponse<OrderDetail>(null);
    const maps = {
      sellerMap: Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller])),
      customerMap: Object.fromEntries(adminMockData.customers.map((customer) => [customer.id, customer])),
      productMap: Object.fromEntries(adminMockData.products.map((product) => [product.id, product]))
    };

    return toDetailResponse({
      order: withRelations(order, maps)
    });
  }
};
