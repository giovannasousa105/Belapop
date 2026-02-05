import "server-only";

import { sellers } from "@/data/sellers";
import { quoteShipping } from "@/lib/shipping/melhorenvio";
import { SellerShipment, ShippingCartItem, ShippingQuoteItem } from "@/lib/types";

const sanitizeCep = (value: string) => value.replace(/\D/g, "");

const toQuoteItems = (items: ShippingCartItem[]): ShippingQuoteItem[] =>
  items.map((item) => ({
    id: item.productId,
    quantity: item.quantity,
    weightKg: item.weightKg,
    widthCm: item.widthCm,
    heightCm: item.heightCm,
    lengthCm: item.lengthCm,
    price: item.price
  }));

export const calculateShippingForSeller = async (
  sellerId: string,
  items: ShippingCartItem[],
  destinationCep: string
): Promise<{ shipment?: SellerShipment; error?: string }> => {
  const seller = sellers.find((item) => item.id === sellerId);
  const originCep = sanitizeCep(
    seller?.postalCode ?? process.env.MELHORENVIO_FROM_POSTAL_CODE ?? ""
  );

  if (!originCep) {
    return {
      error: `CEP de origem não encontrado para ${seller?.name ?? "lojista"}.`
    };
  }

  const options = await quoteShipping(destinationCep, toQuoteItems(items), originCep);
  if (!options.length) {
    return {
      error: `Sem opções de frete para ${seller?.name ?? "lojista"}.`
    };
  }

  const selected = [...options].sort((a, b) => a.price - b.price)[0];
  const shipment: SellerShipment = {
    sellerId,
    sellerName: seller?.name ?? "Loja parceira",
    originCep,
    destinationCep,
    ...selected
  };

  return { shipment };
};
