import type { SupabaseClient } from "@supabase/supabase-js";

import type { SubOrderRow } from "@/lib/api/v1/orders";

type SellerRow = {
  id: string;
  store_name: string | null;
};

type StoreRow = {
  id: string;
  seller_id: string | null;
  name: string | null;
  is_active: boolean | null;
  created_at?: string | null;
};

export type ShipmentLookupRow = {
  id: string;
  order_id: string;
  seller_id?: string | null;
  store_id: string;
  carrier: string | null;
  tracking_code: string | null;
  service_level?: string | null;
  status?: string | null;
  updated_at?: string | null;
  created_at: string | null;
};

type SellerStoreBridge = {
  sellerNames: Record<string, string>;
  storeIdsBySellerId: Record<string, string>;
};

const uniqueValues = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

export async function loadSellerStoreBridge(
  admin: SupabaseClient,
  sellerIds: string[]
): Promise<SellerStoreBridge> {
  const normalizedSellerIds = uniqueValues(sellerIds);
  if (!normalizedSellerIds.length) {
    return {
      sellerNames: {},
      storeIdsBySellerId: {}
    };
  }

  const { data: sellerRows, error: sellerError } = await admin
    .from("sellers")
    .select("id,store_name")
    .in("id", normalizedSellerIds);

  if (sellerError) {
    return {
      sellerNames: normalizedSellerIds.reduce<Record<string, string>>((acc, sellerId) => {
        acc[sellerId] = "Lojista";
        return acc;
      }, {}),
      storeIdsBySellerId: normalizedSellerIds.reduce<Record<string, string>>((acc, sellerId) => {
        acc[sellerId] = sellerId;
        return acc;
      }, {})
    };
  }

  const sellers = (sellerRows ?? []) as SellerRow[];
  const { data: storeRows } = normalizedSellerIds.length
    ? await admin
        .from("stores")
        .select("id,seller_id,name,is_active,created_at")
        .in("seller_id", normalizedSellerIds)
    : { data: [] };

  const stores = (storeRows ?? []) as StoreRow[];
  const storesBySeller = stores.reduce<Record<string, StoreRow[]>>((acc, store) => {
    if (!store.seller_id) return acc;
    if (!acc[store.seller_id]) acc[store.seller_id] = [];
    acc[store.seller_id].push(store);
    return acc;
  }, {});

  const sellerNames: Record<string, string> = {};
  const storeIdsBySellerId: Record<string, string> = {};

  for (const sellerId of normalizedSellerIds) {
    const seller = sellers.find((row) => row.id === sellerId);
    const linkedStores = storesBySeller[sellerId] ?? [];
    const exactStore = linkedStores.find((store) => store.id === sellerId) ?? null;
    const preferredStore =
      exactStore ??
      linkedStores.find((store) => store.is_active !== false) ??
      linkedStores
        .slice()
        .sort((left, right) => {
          const leftTs = Date.parse(String(left.created_at ?? ""));
          const rightTs = Date.parse(String(right.created_at ?? ""));
          if (!Number.isFinite(leftTs) && !Number.isFinite(rightTs)) return 0;
          if (!Number.isFinite(leftTs)) return 1;
          if (!Number.isFinite(rightTs)) return -1;
          return leftTs - rightTs;
        })[0] ??
      null;

    sellerNames[sellerId] = seller?.store_name ?? preferredStore?.name ?? "Lojista";
    storeIdsBySellerId[sellerId] = preferredStore?.id ?? sellerId;
  }

  return {
    sellerNames,
    storeIdsBySellerId
  };
}

export async function resolveStoreIdForSeller(
  admin: SupabaseClient,
  sellerId: string
) {
  const bridge = await loadSellerStoreBridge(admin, [sellerId]);
  return bridge.storeIdsBySellerId[sellerId] ?? sellerId;
}

export async function resolveSellerIdForShipment(
  admin: SupabaseClient,
  shipment: { seller_id?: string | null; store_id?: string | null }
) {
  const directSellerId = String(shipment.seller_id ?? "").trim();
  if (directSellerId) return directSellerId;

  const storeId = String(shipment.store_id ?? "").trim();
  if (!storeId) return null;

  const { data: storeRow, error } = await admin
    .from("stores")
    .select("seller_id")
    .eq("id", storeId)
    .maybeSingle();

  if (error) return storeId;
  return String(storeRow?.seller_id ?? storeId).trim() || null;
}

export async function loadLatestShipmentsForSubOrders(
  admin: SupabaseClient,
  subOrders: Pick<SubOrderRow, "id" | "order_id" | "seller_id">[],
  select =
    "id,order_id,seller_id,store_id,carrier,tracking_code,service_level,status,updated_at,created_at"
) {
  const bridge = await loadSellerStoreBridge(
    admin,
    subOrders.map((subOrder) => subOrder.seller_id)
  );

  const orderIds = uniqueValues(subOrders.map((subOrder) => subOrder.order_id));
  const { data: shipmentRows, error } =
    orderIds.length
      ? await admin
          .from("shipments")
          .select(select)
          .in("order_id", orderIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  const shipments = error ? [] : ((shipmentRows ?? []) as ShipmentLookupRow[]);
  const byOrderSeller = shipments.reduce<Record<string, ShipmentLookupRow>>((acc, shipment) => {
    const sellerId = String(shipment.seller_id ?? "").trim();
    if (!sellerId) return acc;
    const key = `${shipment.order_id}:${sellerId}`;
    if (!acc[key]) acc[key] = shipment;
    return acc;
  }, {});

  const byOrderStore = shipments.reduce<
    Record<string, ShipmentLookupRow>
  >((acc, shipment) => {
    const key = `${shipment.order_id}:${shipment.store_id}`;
    if (!acc[key]) acc[key] = shipment;
    return acc;
  }, {});

  const shipmentsBySubOrderId = subOrders.reduce<Record<string, ShipmentLookupRow | null>>(
    (acc, subOrder) => {
      const resolvedStoreId = bridge.storeIdsBySellerId[subOrder.seller_id] ?? subOrder.seller_id;
      const sellerKey = `${subOrder.order_id}:${subOrder.seller_id}`;
      const storeKey = `${subOrder.order_id}:${resolvedStoreId}`;
      const legacyKey = `${subOrder.order_id}:${subOrder.seller_id}`;
      acc[subOrder.id] =
        byOrderSeller[sellerKey] ??
        byOrderStore[storeKey] ??
        byOrderStore[legacyKey] ??
        null;
      return acc;
    },
    {}
  );

  return {
    bridge,
    shipmentsBySubOrderId
  };
}
