import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe/stripeClient";

export const runtime = "nodejs";

type PaymentIntentItem = {
  productId: string;
  sellerId: string;
  sellerName?: string;
  stripeAccountId?: string;
  commissionRate?: number;
  quantity: number;
  price: number;
};

type PaymentIntentShipment = {
  sellerId: string;
  price: number;
  serviceName?: string;
};

type PaymentIntentRequest = {
  orderId: string;
  currency?: string;
  items: PaymentIntentItem[];
  shipments?: PaymentIntentShipment[];
};

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (value: number) => Number((value / 100).toFixed(2));

const normalizeRate = (rate?: number) => {
  if (typeof rate !== "number" || Number.isNaN(rate)) return undefined;
  if (rate > 1) return rate / 100;
  return rate;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PaymentIntentRequest;
    const currency = body.currency || "brl";
    const items = body.items ?? [];
    const shipments = body.shipments ?? [];
    const orderId = body.orderId;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId é obrigatório." },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Itens do carrinho são obrigatórios." },
        { status: 400 }
      );
    }

    const defaultRate =
      normalizeRate(
        Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? "10")
      ) ?? 0.1;

    const groups = new Map<
      string,
      {
        sellerId: string;
        sellerName?: string;
        stripeAccountId?: string;
        commissionRate: number;
        productTotalCents: number;
        shippingTotalCents: number;
      }
    >();

    items.forEach((item) => {
      const rate = normalizeRate(item.commissionRate) ?? defaultRate;
      const current = groups.get(item.sellerId) ?? {
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        stripeAccountId: item.stripeAccountId,
        commissionRate: rate,
        productTotalCents: 0,
        shippingTotalCents: 0
      };
      current.productTotalCents += toCents(item.price) * item.quantity;
      if (!current.stripeAccountId && item.stripeAccountId) {
        current.stripeAccountId = item.stripeAccountId;
      }
      if (!current.sellerName && item.sellerName) {
        current.sellerName = item.sellerName;
      }
      current.commissionRate = rate;
      groups.set(item.sellerId, current);
    });

    shipments.forEach((shipment) => {
      const current = groups.get(shipment.sellerId);
      if (!current) return;
      current.shippingTotalCents = toCents(shipment.price);
      groups.set(shipment.sellerId, current);
    });

    const missing = Array.from(groups.values()).filter(
      (group) => !group.stripeAccountId
    );
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "SELLER_NOT_CONNECTED",
          missing: missing.map((group) => ({
            sellerId: group.sellerId,
            sellerName: group.sellerName
          }))
        },
        { status: 400 }
      );
    }

    const splits = Array.from(groups.values()).map((group) => {
      const platformFeeCents = Math.round(
        group.productTotalCents * group.commissionRate
      );
      const sellerNetCents =
        group.productTotalCents + group.shippingTotalCents - platformFeeCents;
      return {
        sellerId: group.sellerId,
        sellerName: group.sellerName,
        stripeAccountId: group.stripeAccountId,
        commissionRate: group.commissionRate,
        productTotalCents: group.productTotalCents,
        shippingTotalCents: group.shippingTotalCents,
        platformFeeCents,
        sellerNetCents
      };
    });

    const totalAmountCents = splits.reduce(
      (total, item) => total + item.productTotalCents + item.shippingTotalCents,
      0
    );

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId,
        sellerSplits: JSON.stringify(
          splits.map((item) => ({
            sellerId: item.sellerId,
            stripeAccountId: item.stripeAccountId,
            productTotalCents: item.productTotalCents,
            shippingTotalCents: item.shippingTotalCents,
            platformFeeCents: item.platformFeeCents,
            sellerNetCents: item.sellerNetCents
          }))
        )
      },
      transfer_group: orderId
    });

    return NextResponse.json({
      orderId,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      totalAmount: fromCents(totalAmountCents),
      splits: splits.map((item) => ({
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        productTotal: fromCents(item.productTotalCents),
        shippingTotal: fromCents(item.shippingTotalCents),
        platformFee: fromCents(item.platformFeeCents),
        sellerNetAmount: fromCents(item.sellerNetCents),
        commissionRate: item.commissionRate
      }))
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar pagamento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
