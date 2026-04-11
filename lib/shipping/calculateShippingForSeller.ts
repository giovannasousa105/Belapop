import "server-only";

import { sellers } from "@/data/sellers";
import {
  ShippingProviderConfigError,
  ShippingProviderQuoteError,
  quoteShipping
} from "@/lib/shipping/melhorenvio";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SellerShipment,
  ShippingCartItem,
  ShippingOption,
  ShippingQuoteItem
} from "@/lib/types";

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

type SellerShippingProfile = {
  storeName?: string | null;
  postalCode?: string | null;
};

const loadSellerShippingProfile = async (
  sellerId: string
): Promise<SellerShippingProfile> => {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("sellers")
    .select("store_name,postal_code")
    .eq("id", sellerId)
    .maybeSingle();

  if (error) {
    console.error("[shipping] seller lookup failed", { sellerId, error });
    return {};
  }

  return {
    storeName: data?.store_name ?? null,
    postalCode: data?.postal_code ?? null
  };
};

export const calculateShippingForSeller = async (
  sellerId: string,
  items: ShippingCartItem[],
  destinationCep: string
): Promise<{
  shipment?: SellerShipment;
  error?: string;
  errorCode?: string;
  sellerName?: string;
}> => {
  const dbSeller = await loadSellerShippingProfile(sellerId);
  const fallbackSeller = sellers.find((item) => item.id === sellerId);
  const sellerName = dbSeller.storeName ?? fallbackSeller?.name ?? "Loja parceira";
  const originCep = sanitizeCep(
    dbSeller.postalCode ??
      fallbackSeller?.postalCode ??
      process.env.MELHORENVIO_FROM_POSTAL_CODE ??
      ""
  );

  if (!originCep) {
    return {
      error: `CEP de origem nao encontrado para ${sellerName}.`,
      errorCode: "SELLER_ORIGIN_CEP_MISSING",
      sellerName
    };
  }

  let options: ShippingOption[];
  try {
    options = await quoteShipping(destinationCep, toQuoteItems(items), originCep);
  } catch (error) {
    if (error instanceof ShippingProviderConfigError) {
      return {
        error: "Frete indisponivel temporariamente. Melhor Envio nao esta configurado.",
        errorCode: error.code,
        sellerName
      };
    }

    if (error instanceof ShippingProviderQuoteError) {
      return {
        error: `Nao foi possivel cotar frete para ${sellerName}.`,
        errorCode: error.code,
        sellerName
      };
    }

    throw error;
  }

  if (!options.length) {
    return {
      error: `Sem opcoes de frete para ${sellerName}.`,
      errorCode: "SHIPPING_UNAVAILABLE",
      sellerName
    };
  }

  const selected = [...options].sort((a, b) => a.price - b.price)[0];
  const shipment: SellerShipment = {
    sellerId,
    sellerName,
    originCep,
    destinationCep,
    ...selected
  };

  return { shipment };
};
