import {
  applySearch,
  applySort,
  normalizeListQuery,
  toDetailResponse,
  toListResponse
} from "@/lib/adm/repositories/base";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { DetailResponse, ListQueryParams, ListResponse, Order, Product, Seller } from "@/types/adm";

export type ProductListItem = Product & {
  sellerName: string;
  sellerStatus: Seller["status"] | "pendente";
  openOrders: number;
};

export type ProductDetail = {
  product: ProductListItem;
  seller: Seller | null;
  relatedOrders: Array<
    Order & {
      customerName?: string;
    }
  >;
};

const withRelations = (
  product: Product,
  data: Awaited<ReturnType<typeof getAdmDataSource>>,
  sellerMap: Record<string, Seller>
): ProductListItem => {
  const seller = sellerMap[product.sellerId];
  const openOrders = data.orders.filter(
    (order) => order.productId === product.id && order.status !== "resolvido"
  ).length;

  return {
    ...product,
    sellerName: seller?.name ?? "Seller removido",
    sellerStatus: seller?.status ?? "pendente",
    openOrders
  };
};

export const productsRepository = {
  async listProducts(params: ListQueryParams): Promise<ListResponse<ProductListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "qualityScore",
      defaultSortDir: "desc"
    });
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));

    let rows = adminMockData.products.map((product) => withRelations(product, adminMockData, sellerMap));

    if (query.status) rows = rows.filter((row) => row.status === query.status || row.curationStatus === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.category) rows = rows.filter((row) => row.category === query.category);
    if (query.priority) {
      rows = rows.filter((row) =>
        adminMockData.orders.some(
          (order) => order.productId === row.id && order.priority === query.priority
        )
      );
    }

    rows = applySearch(rows, query.q, (row) =>
      `${row.id} ${row.name} ${row.category} ${row.sellerName}`
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      name: (row) => row.name,
      seller: (row) => row.sellerName,
      qualityScore: (row) => row.qualityScore,
      price: (row) => row.price,
      stock: (row) => row.stock,
      status: (row) => row.status
    });

    const partial = rows.some((row) => row.sellerName === "Seller removido");
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async getProductById(productId: string): Promise<DetailResponse<ProductDetail>> {
    const adminMockData = await getAdmDataSource();
    const product = adminMockData.products.find((row) => row.id === productId);
    if (!product) return toDetailResponse<ProductDetail>(null);
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));
    const customerMap = Object.fromEntries(
      adminMockData.customers.map((customer) => [customer.id, customer])
    );

    const seller = sellerMap[product.sellerId] ?? null;
    const relatedOrders = adminMockData.orders
      .filter((order) => order.productId === product.id)
      .map((order) => ({
        ...order,
        customerName: customerMap[order.customerId]?.name
      }));

    return toDetailResponse({
      product: withRelations(product, adminMockData, sellerMap),
      seller,
      relatedOrders
    });
  }
};
