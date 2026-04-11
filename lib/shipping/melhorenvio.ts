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
const sanitizeToken = (value: string) => value.trim().replace(/^['"]|['"]$/g, "");
const isPlaceholderToken = (value: string) =>
  !value || /COLOQUE_SEU_TOKEN_AQUI/i.test(value);
const isPlaceholderPostalCode = (value: string) => !value || value === "00000000";

const parsePrice = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
    return Number(normalized);
  }
  return Number.NaN;
};

const smokeStubEnabled = process.env.ENABLE_SMOKE_SALE_STUB === "1";

export class ShippingProviderConfigError extends Error {
  code = "SHIPPING_PROVIDER_NOT_CONFIGURED" as const;
  provider = "melhorenvio" as const;
}

export class ShippingProviderQuoteError extends Error {
  code = "SHIPPING_QUOTE_FAILED" as const;
  provider = "melhorenvio" as const;
}

const buildSmokeOptions = (items: ShippingQuoteItem[]): ShippingOption[] => {
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const weight = items.reduce((sum, item) => sum + item.weightKg * item.quantity, 0);
  const insuredValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const basePrice = 12.9 + quantity * 1.75 + weight * 4.5 + insuredValue * 0.008;
  const price = Number(basePrice.toFixed(2));

  return [
    {
      serviceName: "Entrega smoke",
      price,
      deliveryTimeDays: 3,
      carrier: "BelaPop Smoke Carrier",
      serviceId: "smoke-standard"
    }
  ];
};

export const quoteShipping = async (
  toCep: string,
  items: ShippingQuoteItem[],
  fromPostalCodeOverride?: string
): Promise<ShippingOption[]> => {
  if (smokeStubEnabled) {
    return buildSmokeOptions(items);
  }

  const token = sanitizeToken(process.env.MELHORENVIO_TOKEN ?? "");
  const fromPostalCode =
    fromPostalCodeOverride ?? process.env.MELHORENVIO_FROM_POSTAL_CODE ?? "";

  if (
    isPlaceholderToken(token) ||
    isPlaceholderPostalCode(sanitizeCep(fromPostalCode ?? ""))
  ) {
    throw new ShippingProviderConfigError(
      "Melhor Envio nao esta configurado com credenciais validas."
    );
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
    throw new ShippingProviderQuoteError(
      `Melhor Envio error ${response.status}: ${text}`
    );
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
