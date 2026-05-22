import "server-only";

import { sellers } from "@/data/sellers";
import {
  LogisticsProviderError,
  pickPreferredShippingOption,
  sortShippingOptions
} from "@/lib/logistics/types";
import { getActiveLogisticsProvider } from "@/lib/logistics/providerRegistry";
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
      error: `CEP de origem não encontrado para ${sellerName}.`,
      errorCode: "SELLER_ORIGIN_CEP_MISSING",
      sellerName
    };
  }

  let options: ShippingOption[];
  let providerId = "mandabem";
  let quoteMode: SellerShipment["quoteMode"] = "live";
  try {
    const provider = await getActiveLogisticsProvider();
    providerId = provider.id;
    const quoteResponse = await provider.getShippingQuotes({
      originCep,
      destinationCep,
      items: toQuoteItems(items)
    });
    options = sortShippingOptions(quoteResponse.options);
    quoteMode = quoteResponse.mode;
  } catch (error) {
    if (error instanceof LogisticsProviderError) {
      if (error.code === "LOGISTICS_PROVIDER_NOT_CONFIGURED") {
        return {
          error: "Frete indisponivel temporariamente. Provider logistico não esta configurado.",
          errorCode: "SHIPPING_PROVIDER_NOT_CONFIGURED",
          sellerName
        };
      }

      if (
        error.code === "LOGISTICS_UNAVAILABLE_FOR_POSTAL_CODE"
      ) {
        return {
          error: `Não encontramos frete disponivel para ${sellerName} neste CEP.`,
          errorCode: "SHIPPING_UNAVAILABLE",
          sellerName
        };
      }

      if (
        error.code === "LOGISTICS_INVALID_TOKEN" ||
        error.code === "LOGISTICS_AUTH_ERROR"
      ) {
        return {
          error: "Frete indisponivel temporariamente. Credenciais do hub logistico precisam de revisao.",
          errorCode: "SHIPPING_PROVIDER_NOT_CONFIGURED",
          sellerName
        };
      }

      return {
        error: `Não foi possivel cotar frete para ${sellerName}.`,
        errorCode: "SHIPPING_QUOTE_FAILED",
        sellerName
      };
    }

    throw error;
  }

  if (!options.length) {
    return {
      error: `Sem opções de frete para ${sellerName}.`,
      errorCode: "SHIPPING_UNAVAILABLE",
      sellerName
    };
  }

  const selected = pickPreferredShippingOption(options);
  const shipment: SellerShipment = {
    sellerId,
    sellerName,
    originCep,
    destinationCep,
    provider: providerId,
    quoteMode,
    availableOptions: options,
    ...selected
  };

  return { shipment };
};
