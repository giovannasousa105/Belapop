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
  ListQueryParams,
  ListResponse,
  LogisticsIncident,
  Order,
  Refund,
  Shipment
} from "@/types/adm";

export type ShipmentListItem = Shipment & {
  sellerName: string;
  incidentId?: string;
  incidentPriority?: LogisticsIncident["priority"];
  incidentStatus?: LogisticsIncident["status"];
};

export type LogisticsIncidentListItem = LogisticsIncident & {
  sellerName: string;
};

export type ShipmentDetail = {
  shipment: ShipmentListItem;
  order: Order | null;
  productName?: string;
  customerName?: string;
  sellerName?: string;
  incident?: LogisticsIncidentListItem;
  refund?: Refund;
};

const withShipmentRelations = (
  shipment: Shipment,
  sellerMap: Record<string, { name: string }>,
  incidentByShipment: Record<string, LogisticsIncident>
): ShipmentListItem => {
  const incident = incidentByShipment[shipment.id];
  return {
    ...shipment,
    sellerName: sellerMap[shipment.sellerId]?.name ?? "Seller removido",
    incidentId: incident?.id,
    incidentPriority: incident?.priority,
    incidentStatus: incident?.status
  };
};

const withIncidentRelations = (
  incident: LogisticsIncident,
  sellerMap: Record<string, { name: string }>
): LogisticsIncidentListItem => ({
  ...incident,
  sellerName: sellerMap[incident.sellerId]?.name ?? "Seller removido"
});

export const logisticsRepository = {
  async listShipments(params: ListQueryParams): Promise<ListResponse<ShipmentListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "lastUpdateAt",
      defaultSortDir: "desc"
    });
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));
    const incidentByShipment = Object.fromEntries(
      adminMockData.logisticsIncidents.map((incident) => [incident.shipmentId, incident])
    );

    let rows = adminMockData.shipments.map((shipment) =>
      withShipmentRelations(shipment, sellerMap, incidentByShipment)
    );

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.shipment) rows = rows.filter((row) => row.id === query.shipment);
    if (query.order) rows = rows.filter((row) => row.orderId === query.order);
    if (query.priority) {
      rows = rows.filter((row) => row.incidentPriority === query.priority);
    }
    rows = applyDateRange(rows, query.dateRange, (row) => row.lastUpdateAt);

    rows = applySearch(rows, query.q, (row) =>
      `${row.id} ${row.orderId} ${row.trackingCode} ${row.sellerName} ${row.carrier}`
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      order: (row) => row.orderId,
      seller: (row) => row.sellerName,
      status: (row) => row.status,
      eta: (row) => row.eta,
      lastUpdateAt: (row) => row.lastUpdateAt
    });

    const partial = rows.some((row) => row.sellerName === "Seller removido");
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async listIncidents(params: ListQueryParams): Promise<ListResponse<LogisticsIncidentListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "openedAt",
      defaultSortDir: "desc"
    });
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));

    let rows = adminMockData.logisticsIncidents.map((incident) =>
      withIncidentRelations(incident, sellerMap)
    );

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);
    if (query.priority) rows = rows.filter((row) => row.priority === query.priority);
    if (query.shipment) rows = rows.filter((row) => row.shipmentId === query.shipment);
    if (query.order) rows = rows.filter((row) => row.orderId === query.order);
    rows = applyDateRange(rows, query.dateRange, (row) => row.openedAt);

    rows = applySearch(rows, query.q, (row) =>
      `${row.id} ${row.type} ${row.summary} ${row.shipmentId} ${row.orderId} ${row.sellerName}`
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      openedAt: (row) => row.openedAt,
      seller: (row) => row.sellerName,
      type: (row) => row.type,
      priority: (row) => row.priority,
      status: (row) => row.status
    });

    const partial = rows.some((row) => row.sellerName === "Seller removido");
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async getShipmentById(shipmentId: string): Promise<DetailResponse<ShipmentDetail>> {
    const adminMockData = await getAdmDataSource();
    const shipment = adminMockData.shipments.find((row) => row.id === shipmentId);
    if (!shipment) return toDetailResponse<ShipmentDetail>(null);
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));
    const orderMap = Object.fromEntries(adminMockData.orders.map((order) => [order.id, order]));
    const productMap = Object.fromEntries(adminMockData.products.map((product) => [product.id, product]));
    const customerMap = Object.fromEntries(adminMockData.customers.map((customer) => [customer.id, customer]));
    const incidentByShipment = Object.fromEntries(
      adminMockData.logisticsIncidents.map((incident) => [incident.shipmentId, incident])
    );

    const hydratedShipment = withShipmentRelations(shipment, sellerMap, incidentByShipment);
    const order = orderMap[shipment.orderId] ?? null;
    const incidentRaw = incidentByShipment[shipment.id];
    const incident = incidentRaw ? withIncidentRelations(incidentRaw, sellerMap) : undefined;
    const refund = incident?.refundId
      ? adminMockData.refunds.find((row) => row.id === incident.refundId)
      : undefined;

    const productName = order ? productMap[order.productId]?.name : undefined;
    const customerName = order ? customerMap[order.customerId]?.name : undefined;
    const sellerName = sellerMap[shipment.sellerId]?.name;

    return toDetailResponse({
      shipment: hydratedShipment,
      order,
      productName,
      customerName,
      sellerName,
      incident,
      refund
    });
  }
};
