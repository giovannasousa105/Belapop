import "server-only";

import { randomUUID } from "node:crypto";

import { buildShippingItems } from "@/lib/shipping/prepareItems";
import { calculateShippingForSeller } from "@/lib/shipping/calculateShippingForSeller";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { Address, Product } from "@/lib/types";

type CheckoutItemInput = {
  productId: string;
  quantity: number;
};

type CheckoutCreateInput = {
  customerId: string;
  items: CheckoutItemInput[];
  address: Address;
  paymentMethod: "cartao" | "pix" | "boleto";
  currency?: string;
  allowUnconnectedSellers?: boolean;
};

type DraftSplit = {
  subOrderId: string;
  sellerId: string;
  sellerName: string;
  stripeAccountId?: string | null;
  commissionRate: number;
  shippingService: string;
  shippingServiceId: string;
  shippingCarrier: string;
  shippingDays: number;
  originCep: string;
  destinationCep: string;
  productTotalCents: number;
  shippingTotalCents: number;
  platformFeeCents: number;
  sellerNetCents: number;
};

type DraftOrder = {
  orderId: string;
  currency: string;
  createdAt: string;
  destinationCep: string;
  productTotalCents: number;
  shippingTotalCents: number;
  totalAmountCents: number;
  splits: DraftSplit[];
  pricingSnapshot: Record<string, unknown>;
  shippingSnapshot: Record<string, unknown>;
};

type PersistedSplit = {
  sellerId: string;
  sellerName: string;
  stripeAccountId: string;
  sellerNetCents: number;
};

const PRODUCT_SELECT =
  "id,name,price_cents,currency,category,description,images,status,created_at,updated_at,seller_id,weight_kg,width_cm,height_cm,length_cm,highlights,image_tone,is_featured,stock_quantity";

const SELLER_SELECT = "id,store_name,status,postal_code,stripe_account_id,commission_rate";

const toCentsFromAmount = (value: number) => Math.round(value * 100);
const fromCentsToAmount = (value: number) => Number((value / 100).toFixed(2));

const normalizeRate = (rate?: number | null) => {
  if (typeof rate !== "number" || Number.isNaN(rate)) return undefined;
  if (rate > 1) return rate / 100;
  return rate;
};

const sanitizeCep = (value: string) => value.replace(/\D/g, "");

const mapProductRow = (row: Record<string, unknown>): Product => ({
  id: String(row.id ?? ""),
  name: String(row.name ?? ""),
  price: fromCentsToAmount(Number(row.price_cents ?? 0)),
  category: String(row.category ?? "Skincare") as Product["category"],
  description: String(row.description ?? ""),
  images: Array.isArray(row.images) ? (row.images as string[]) : [],
  status: String(row.status ?? "draft") as Product["status"],
  createdAt: String(row.created_at ?? new Date().toISOString()),
  updatedAt: String(row.updated_at ?? ""),
  sellerId: String(row.seller_id ?? ""),
  weightKg:
    typeof row.weight_kg === "number" ? row.weight_kg : Number(row.weight_kg ?? NaN),
  widthCm:
    typeof row.width_cm === "number" ? row.width_cm : Number(row.width_cm ?? NaN),
  heightCm:
    typeof row.height_cm === "number" ? row.height_cm : Number(row.height_cm ?? NaN),
  lengthCm:
    typeof row.length_cm === "number" ? row.length_cm : Number(row.length_cm ?? NaN),
  highlights: Array.isArray(row.highlights) ? (row.highlights as string[]) : [],
  imageTone: (row.image_tone ?? undefined) as Product["imageTone"],
  featured: Boolean(row.is_featured),
  stockQuantity:
    row.stock_quantity === null || row.stock_quantity === undefined
      ? undefined
      : Number(row.stock_quantity)
});

const assertRequiredAddress = (address: Address) => {
  const required: Array<keyof Address> = [
    "fullName",
    "street",
    "number",
    "city",
    "state",
    "zip"
  ];

  for (const field of required) {
    if (!String(address[field] ?? "").trim()) {
      throw new Error("Preencha os dados essenciais do endereco.");
    }
  }

  const destinationCep = sanitizeCep(address.zip);
  if (destinationCep.length !== 8) {
    throw new Error("CEP invalido. Use 8 digitos.");
  }

  return destinationCep;
};

const groupRequestedItems = (items: CheckoutItemInput[]) => {
  const grouped = new Map<string, number>();

  for (const item of items) {
    const productId = String(item.productId ?? "").trim();
    const quantity = Math.max(1, Math.floor(Number(item.quantity ?? 0)));
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Itens do carrinho sao invalidos.");
    }
    grouped.set(productId, (grouped.get(productId) ?? 0) + quantity);
  }

  if (grouped.size === 0) {
    throw new Error("Itens do carrinho sao obrigatorios.");
  }

  return grouped;
};

const loadProducts = async (productIds: string[]) => {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", productIds);

  if (error) {
    throw new Error(`Falha ao carregar produtos: ${error.message}`);
  }

  return new Map(
    ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const product = mapProductRow(row);
      return [product.id, product] as const;
    })
  );
};

const loadSellers = async (sellerIds: string[]) => {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("sellers")
    .select(SELLER_SELECT)
    .in("id", sellerIds);

  if (error) {
    throw new Error(`Falha ao carregar sellers: ${error.message}`);
  }

  return new Map(
    ((data ?? []) as Array<Record<string, unknown>>).map((seller) => [
      String(seller.id),
      {
        id: String(seller.id),
        storeName: String(seller.store_name ?? "Loja parceira"),
        status: String(seller.status ?? "draft"),
        stripeAccountId:
          typeof seller.stripe_account_id === "string" && seller.stripe_account_id.trim()
            ? seller.stripe_account_id
            : null,
        commissionRate:
          normalizeRate(
            seller.commission_rate === null || seller.commission_rate === undefined
              ? undefined
              : Number(seller.commission_rate)
          ) ?? 0.1
      }
    ])
  );
};

const insertOrderDraft = async ({
  orderId,
  customerId,
  productTotalCents,
  shippingTotalCents,
  totalAmountCents,
  createdAt,
  address,
  destinationCep
}: {
  orderId: string;
  customerId: string;
  productTotalCents: number;
  shippingTotalCents: number;
  totalAmountCents: number;
  createdAt: string;
  address: Address;
  destinationCep: string;
}) => {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("orders").insert({
    id: orderId,
    customer_id: customerId,
    total_products_cents: productTotalCents,
    total_shipping_cents: shippingTotalCents,
    total_order_cents: totalAmountCents,
    status: "created",
    created_at: createdAt,
    address,
    destination_cep: destinationCep,
    payment_status: "pending"
  });

  if (error) {
    throw new Error(`Falha ao criar pedido: ${error.message}`);
  }
};

const insertSubOrderDrafts = async ({
  orderId,
  createdAt,
  groupedItems,
  splits
}: {
  orderId: string;
  createdAt: string;
  groupedItems: Map<
    string,
    Array<{
      productId: string;
      sellerId: string;
      quantity: number;
      unitPriceCents: number;
      totalPriceCents: number;
    }>
  >;
  splits: DraftSplit[];
}) => {
  const admin = getSupabaseAdminClient();
  const payload = splits.map((split) => ({
    id: split.subOrderId,
    order_id: orderId,
    seller_id: split.sellerId,
    items: groupedItems.get(split.sellerId) ?? [],
    shipping_total_cents: split.shippingTotalCents,
    shipping_service: split.shippingService,
    shipping_days: split.shippingDays,
    status: "created",
    created_at: createdAt,
    product_total_cents: split.productTotalCents,
    platform_fee_cents: split.platformFeeCents,
    seller_net_cents: split.sellerNetCents,
    payment_status: "pending"
  }));

  const { error } = await admin.from("sub_orders").insert(payload);
  if (error) {
    throw new Error(`Falha ao criar subpedidos: ${error.message}`);
  }
};

export const createCheckoutDraft = async (
  input: CheckoutCreateInput
): Promise<DraftOrder> => {
  const destinationCep = assertRequiredAddress(input.address);
  const requestedItems = groupRequestedItems(input.items);
  const productIds = Array.from(requestedItems.keys());
  const productMap = await loadProducts(productIds);

  const productPayload = productIds.map((productId) => {
    const product = productMap.get(productId);
    if (!product) {
      throw new Error("Um ou mais produtos nao foram encontrados.");
    }
    if (product.status !== "published") {
      throw new Error(`O produto ${product.name} nao esta disponivel para venda.`);
    }
    if (
      typeof product.stockQuantity === "number" &&
      Number.isFinite(product.stockQuantity) &&
      product.stockQuantity < (requestedItems.get(productId) ?? 0)
    ) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }

    return {
      product,
      quantity: requestedItems.get(productId) ?? 0
    };
  });

  const sellerIds = Array.from(new Set(productPayload.map((item) => item.product.sellerId)));
  const sellerMap = await loadSellers(sellerIds);
  const groupedProducts = new Map<string, typeof productPayload>();
  const groupedSubItems = new Map<
    string,
    Array<{
      productId: string;
      sellerId: string;
      quantity: number;
      unitPriceCents: number;
      totalPriceCents: number;
    }>
  >();

  for (const entry of productPayload) {
    const sellerId = entry.product.sellerId;
    const seller = sellerMap.get(sellerId);
    if (!seller) {
      throw new Error(`Seller ausente para ${entry.product.name}.`);
    }
    if (!["active", "approved"].includes(seller.status)) {
      throw new Error(`A loja ${seller.storeName} nao esta apta para vender.`);
    }
    if (!input.allowUnconnectedSellers && !seller.stripeAccountId) {
      const error = new Error("SELLER_NOT_CONNECTED") as Error & {
        sellerId?: string;
        sellerName?: string;
      };
      error.sellerId = seller.id;
      error.sellerName = seller.storeName;
      throw error;
    }

    const bucket = groupedProducts.get(sellerId) ?? [];
    bucket.push(entry);
    groupedProducts.set(sellerId, bucket);

    const subItems = groupedSubItems.get(sellerId) ?? [];
    subItems.push({
      productId: entry.product.id,
      sellerId,
      quantity: entry.quantity,
      unitPriceCents: toCentsFromAmount(entry.product.price),
      totalPriceCents: toCentsFromAmount(entry.product.price) * entry.quantity
    });
    groupedSubItems.set(sellerId, subItems);
  }

  const splits: DraftSplit[] = [];
  for (const [sellerId, entries] of groupedProducts.entries()) {
    const seller = sellerMap.get(sellerId)!;
    const shippingItems = buildShippingItems(
      entries.map((entry) => ({ product: entry.product, quantity: entry.quantity }))
    );
    const shippingResult = await calculateShippingForSeller(
      sellerId,
      shippingItems,
      destinationCep
    );

    if (!shippingResult.shipment) {
      const error = new Error(
        shippingResult.error ?? `Nao foi possivel calcular frete para ${sellerId}.`
      ) as Error & {
        code?: string;
        sellerId?: string;
        sellerName?: string;
      };
      error.code = shippingResult.errorCode ?? "SHIPPING_UNAVAILABLE";
      error.sellerId = sellerId;
      error.sellerName = seller.storeName;
      throw error;
    }

    const productTotalCents = entries.reduce(
      (total, entry) => total + toCentsFromAmount(entry.product.price) * entry.quantity,
      0
    );
    const shippingTotalCents = toCentsFromAmount(shippingResult.shipment.price);
    const platformFeeCents = Math.round(productTotalCents * seller.commissionRate);
    const sellerNetCents = productTotalCents + shippingTotalCents - platformFeeCents;

    splits.push({
      subOrderId: randomUUID(),
      sellerId,
      sellerName: seller.storeName,
      stripeAccountId: seller.stripeAccountId,
      commissionRate: seller.commissionRate,
      shippingService: shippingResult.shipment.serviceName,
      shippingServiceId: shippingResult.shipment.serviceId,
      shippingCarrier: shippingResult.shipment.carrier,
      shippingDays: shippingResult.shipment.deliveryTimeDays,
      originCep: shippingResult.shipment.originCep,
      destinationCep: shippingResult.shipment.destinationCep,
      productTotalCents,
      shippingTotalCents,
      platformFeeCents,
      sellerNetCents
    });
  }

  const productTotalCents = splits.reduce((total, split) => total + split.productTotalCents, 0);
  const shippingTotalCents = splits.reduce((total, split) => total + split.shippingTotalCents, 0);
  const totalAmountCents = productTotalCents + shippingTotalCents;
  const orderId = randomUUID();
  const createdAt = new Date().toISOString();
  const currency = (input.currency ?? "brl").toLowerCase();

  const pricingSnapshot = {
    version: 1,
    currency: currency.toUpperCase(),
    order: {
      product_total_cents: productTotalCents,
      shipping_total_cents: shippingTotalCents,
      total_amount_cents: totalAmountCents
    },
    sellers: splits.map((split) => ({
      sub_order_id: split.subOrderId,
      seller_id: split.sellerId,
      seller_name: split.sellerName,
      commission_rate: split.commissionRate,
      product_total_cents: split.productTotalCents,
      shipping_total_cents: split.shippingTotalCents,
      platform_fee_cents: split.platformFeeCents,
      seller_net_cents: split.sellerNetCents
    }))
  } satisfies Record<string, unknown>;

  const shippingSnapshot = {
    version: 1,
    destination_cep: destinationCep,
    address: {
      city: input.address.city,
      state: input.address.state,
      zip: input.address.zip
    },
    sellers: splits.map((split) => ({
      sub_order_id: split.subOrderId,
      seller_id: split.sellerId,
      seller_name: split.sellerName,
      origin_cep: split.originCep,
      destination_cep: split.destinationCep,
      service_name: split.shippingService,
      service_id: split.shippingServiceId,
      carrier: split.shippingCarrier,
      delivery_time_days: split.shippingDays,
      shipping_total_cents: split.shippingTotalCents
    }))
  } satisfies Record<string, unknown>;

  await insertOrderDraft({
    orderId,
    customerId: input.customerId,
    productTotalCents,
    shippingTotalCents,
    totalAmountCents,
    createdAt,
    address: input.address,
    destinationCep
  });

  try {
    await insertSubOrderDrafts({
      orderId,
      createdAt,
      groupedItems: groupedSubItems,
      splits
    });
  } catch (error) {
    await deleteCheckoutDraft(orderId);
    throw error;
  }

  return {
    orderId,
    currency,
    createdAt,
    destinationCep,
    productTotalCents,
    shippingTotalCents,
    totalAmountCents,
    splits,
    pricingSnapshot,
    shippingSnapshot
  };
};

export const attachPaymentIntentToOrder = async (
  orderId: string,
  paymentIntentId: string
) => {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ payment_intent_id: paymentIntentId, payment_provider: "stripe" })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Falha ao anexar payment intent: ${error.message}`);
  }
};

export const deleteCheckoutDraft = async (orderId: string) => {
  const admin = getSupabaseAdminClient();

  const subOrdersDelete = await admin.from("sub_orders").delete().eq("order_id", orderId);
  if (subOrdersDelete.error) {
    throw new Error(`Falha ao remover subpedidos pendentes: ${subOrdersDelete.error.message}`);
  }

  const orderDelete = await admin.from("orders").delete().eq("id", orderId);
  if (orderDelete.error) {
    throw new Error(`Falha ao remover pedido pendente: ${orderDelete.error.message}`);
  }
};

export const loadPersistedSplitsForOrder = async (
  orderId: string
): Promise<PersistedSplit[]> => {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("sub_orders")
    .select("seller_id,seller_net_cents")
    .eq("order_id", orderId);

  if (error) {
    throw new Error(`Falha ao carregar subpedidos para transfer: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{ seller_id: string; seller_net_cents: number | null }>;
  const sellerIds = Array.from(new Set(rows.map((row) => row.seller_id)));
  if (sellerIds.length === 0) return [];

  const { data: sellers, error: sellerError } = await admin
    .from("sellers")
    .select("id,store_name,stripe_account_id")
    .in("id", sellerIds);

  if (sellerError) {
    throw new Error(`Falha ao carregar sellers para transfer: ${sellerError.message}`);
  }

  const sellerMap = new Map(
    ((sellers ?? []) as Array<Record<string, unknown>>).map((seller) => [
      String(seller.id),
      {
        storeName: String(seller.store_name ?? "Loja parceira"),
        stripeAccountId:
          typeof seller.stripe_account_id === "string" ? seller.stripe_account_id : ""
      }
    ])
  );

  return rows
    .map((row) => {
      const seller = sellerMap.get(row.seller_id);
      return {
        sellerId: row.seller_id,
        sellerName: seller?.storeName ?? row.seller_id,
        stripeAccountId: seller?.stripeAccountId ?? "",
        sellerNetCents: Number(row.seller_net_cents ?? 0)
      };
    })
    .filter((row) => row.stripeAccountId && row.sellerNetCents > 0);
};

export const loadPersistedCheckoutBreakdown = async (
  orderId: string
): Promise<{
  totalAmountCents: number;
  currency: string;
  splits: DraftSplit[];
}> => {
  const admin = getSupabaseAdminClient();
  const orderLookup = await admin
    .from("orders")
    .select("total_order_cents,destination_cep")
    .eq("id", orderId)
    .maybeSingle();

  if (orderLookup.error) {
    throw new Error(`Falha ao carregar order breakdown: ${orderLookup.error.message}`);
  }

  const subOrdersLookup = await admin
    .from("sub_orders")
    .select(
      "id,seller_id,product_total_cents,shipping_total_cents,platform_fee_cents,seller_net_cents,shipping_service,shipping_days"
    )
    .eq("order_id", orderId);

  if (subOrdersLookup.error) {
    throw new Error(`Falha ao carregar sub_orders breakdown: ${subOrdersLookup.error.message}`);
  }

  const subOrderRows = (subOrdersLookup.data ?? []) as Array<Record<string, unknown>>;
  const sellerIds = Array.from(new Set(subOrderRows.map((row) => String(row.seller_id ?? ""))));

  const sellersLookup =
    sellerIds.length > 0
      ? await admin
          .from("sellers")
          .select("id,store_name,stripe_account_id,commission_rate,postal_code")
          .in("id", sellerIds)
      : { data: [], error: null };

  if (sellersLookup.error) {
    throw new Error(`Falha ao carregar sellers breakdown: ${sellersLookup.error.message}`);
  }

  const sellerMap = new Map(
    ((sellersLookup.data ?? []) as Array<Record<string, unknown>>).map((seller) => [
      String(seller.id),
      {
        sellerName: String(seller.store_name ?? "Loja parceira"),
        stripeAccountId:
          typeof seller.stripe_account_id === "string" ? seller.stripe_account_id : null,
        commissionRate:
          normalizeRate(
            seller.commission_rate === null || seller.commission_rate === undefined
              ? undefined
              : Number(seller.commission_rate)
          ) ?? 0.1,
        postalCode: sanitizeCep(String(seller.postal_code ?? ""))
      }
    ])
  );

  const destinationCep = sanitizeCep(String(orderLookup.data?.destination_cep ?? ""));

  return {
    totalAmountCents: Number(orderLookup.data?.total_order_cents ?? 0),
    currency: "brl",
    splits: subOrderRows.map((row) => {
      const sellerId = String(row.seller_id ?? "");
      const seller = sellerMap.get(sellerId);
      return {
        subOrderId: String(row.id ?? ""),
        sellerId,
        sellerName: seller?.sellerName ?? sellerId,
        stripeAccountId: seller?.stripeAccountId ?? null,
        commissionRate: seller?.commissionRate ?? 0.1,
        shippingService: String(row.shipping_service ?? "Frete"),
        shippingServiceId: String(row.shipping_service ?? "service"),
        shippingCarrier: "Transportadora",
        shippingDays: Number(row.shipping_days ?? 0),
        originCep: seller?.postalCode ?? "",
        destinationCep,
        productTotalCents: Number(row.product_total_cents ?? 0),
        shippingTotalCents: Number(row.shipping_total_cents ?? 0),
        platformFeeCents: Number(row.platform_fee_cents ?? 0),
        sellerNetCents: Number(row.seller_net_cents ?? 0)
      };
    })
  };
};
