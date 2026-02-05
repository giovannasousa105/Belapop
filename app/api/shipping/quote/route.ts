import { NextResponse } from "next/server";

import { sellers } from "@/data/sellers";
import { calculateShippingForSeller } from "@/lib/shipping/calculateShippingForSeller";
import { ShippingCartItem } from "@/lib/types";

const sanitizeCep = (value: string) => value.replace(/\D/g, "");

const normalizeItem = (item: ShippingCartItem): ShippingCartItem | null => {
  if (!item?.productId || !item?.sellerId) return null;
  const quantity = Number(item.quantity);
  const weightKg = Number(item.weightKg);
  const widthCm = Number(item.widthCm);
  const heightCm = Number(item.heightCm);
  const lengthCm = Number(item.lengthCm);
  const price = Number(item.price);

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(widthCm) ||
    !Number.isFinite(heightCm) ||
    !Number.isFinite(lengthCm) ||
    !Number.isFinite(price)
  ) {
    return null;
  }

  return {
    productId: String(item.productId),
    sellerId: String(item.sellerId),
    quantity: Math.max(1, Math.floor(quantity)),
    weightKg,
    widthCm,
    heightCm,
    lengthCm,
    price
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      destinationCep?: string;
      cartItems?: ShippingCartItem[];
    };

    const destinationCep = sanitizeCep(body?.destinationCep ?? "");
    if (destinationCep.length !== 8) {
      return NextResponse.json(
        { error: "CEP inválido. Use 8 dígitos." },
        { status: 400 }
      );
    }

    const cartItems = Array.isArray(body?.cartItems)
      ? body.cartItems.map(normalizeItem).filter(Boolean)
      : [];

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Itens inválidos para cálculo de frete." },
        { status: 400 }
      );
    }

    const grouped: Record<string, ShippingCartItem[]> = {};
    (cartItems as ShippingCartItem[]).forEach((item) => {
      if (!grouped[item.sellerId]) {
        grouped[item.sellerId] = [];
      }
      grouped[item.sellerId].push(item);
    });

    const results = await Promise.all(
      Object.entries(grouped).map(async ([sellerId, items]) => {
        try {
          const result = await calculateShippingForSeller(
            sellerId,
            items,
            destinationCep
          );
          return { sellerId, ...result };
        } catch (error) {
          console.error("[shipping/quote]", error);
          return {
            sellerId,
            error: "Não foi possível calcular o envio desta loja."
          };
        }
      })
    );

    const shipments = results
      .map((result) => result.shipment)
      .filter(Boolean);

    const errors = results
      .filter((result) => result.error)
      .map((result) => {
        const seller = sellers.find((item) => item.id === result.sellerId);
        return {
          sellerId: result.sellerId,
          sellerName: seller?.name ?? "Loja parceira",
          message: result.error
        };
      });

    const totalShipping = shipments.reduce(
      (total, shipment) => total + (shipment?.price ?? 0),
      0
    );

    return NextResponse.json({ shipments, totalShipping, errors });
  } catch (error) {
    console.error("[shipping/quote]", error);
    return NextResponse.json(
      { error: "Não foi possível calcular o frete agora." },
      { status: 500 }
    );
  }
}
