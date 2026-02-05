import "server-only";

import { ShippingOption, ShippingQuoteItem } from "@/lib/types";

type MelhorEnvioQuoteResponse = {
  id?: number | string;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number | string;
  custom_delivery_time?: number | string;
  company?: { name?: string };
  error?: string | null;
};

const sanitizeCep = (value: string) => value.replace(/\D/g, "");

const parsePrice = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
    return Number(normalized);
  }
  return Number.NaN;
};

export const quoteShipping = async (
  toCep: string,
  items: ShippingQuoteItem[],
  fromPostalCodeOverride?: string
): Promise<ShippingOption[]> => {
  const token = process.env.MELHORENVIO_TOKEN;
  const fromPostalCode =
    fromPostalCodeOverride ?? process.env.MELHORENVIO_FROM_POSTAL_CODE;

  if (!token || !fromPostalCode) {
    throw new Error("Missing MELHORENVIO_TOKEN or MELHORENVIO_FROM_POSTAL_CODE");
  }

  const toPostalCode = sanitizeCep(toCep);
  const from = sanitizeCep(fromPostalCode);

  const payload = {
    from: { postal_code: from },
    to: { postal_code: toPostalCode },
    products: items.map((item) => ({
      id: item.id,
      width: item.widthCm,
      height: item.heightCm,
      length: item.lengthCm,
      weight: item.weightKg,
      insurance_value: item.price,
      quantity: item.quantity
    }))
  };

  const response = await fetch(
    "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Melhor Envio error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as MelhorEnvioQuoteResponse[] | {
    data?: MelhorEnvioQuoteResponse[];
  };
  const options = Array.isArray(data) ? data : data.data ?? [];

  return options
    .filter((option) => !option.error)
    .map((option) => {
      const price = parsePrice(option.custom_price ?? option.price);
      return {
        serviceName: option.name ?? "Frete",
        price,
        deliveryTimeDays: Number(option.custom_delivery_time ?? option.delivery_time ?? 0),
        carrier: option.company?.name ?? "Transportadora",
        serviceId: String(option.id ?? option.name ?? "service")
      };
    })
    .filter((option) => Number.isFinite(option.price) && option.price > 0);
};
