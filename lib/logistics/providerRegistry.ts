import "server-only";

import {
  quoteShipping,
  ShippingProviderConfigError,
  ShippingProviderQuoteError
} from "@/lib/shipping/melhorenvio";
import { readLogisticsRuntimeSettings } from "@/lib/logistics/settings";
import { mandaBemProvider } from "@/lib/logistics/mandabem";
import {
  LogisticsProviderError,
  type LogisticsProvider,
  type LogisticsProviderId,
  type LogisticsQuoteRequest,
  type LogisticsQuoteResponse,
  type LogisticsShipmentRequest,
  type LogisticsShipmentResult,
  type LogisticsTrackingRequest,
  type LogisticsTrackingResult
} from "@/lib/logistics/types";

const melhorEnvioProvider: LogisticsProvider = {
  id: "melhorenvio",
  displayName: "Melhor Envio",
  async getShippingQuotes(request: LogisticsQuoteRequest): Promise<LogisticsQuoteResponse> {
    let options;
    try {
      options = await quoteShipping(
        request.destinationCep,
        request.items,
        request.originCep
      );
    } catch (error) {
      if (error instanceof ShippingProviderConfigError) {
        throw new LogisticsProviderError(
          "melhorenvio",
          "LOGISTICS_PROVIDER_NOT_CONFIGURED",
          error.message
        );
      }

      if (error instanceof ShippingProviderQuoteError) {
        throw new LogisticsProviderError(
          "melhorenvio",
          "LOGISTICS_QUOTE_FAILED",
          error.message,
          { retriable: true }
        );
      }

      throw error;
    }

    return {
      provider: "melhorenvio",
      mode: "live",
      options
    };
  },
  async generateShipment(request: LogisticsShipmentRequest): Promise<LogisticsShipmentResult> {
    return {
      provider: "melhorenvio",
      shipmentId: `${request.orderId}-${request.serviceId}`,
      status: "manual_pending",
      trackingCode: null,
      trackingUrl: null,
      labelUrl: null,
      carrier: "Melhor Envio",
      serviceName: request.serviceId,
      sandbox: false
    };
  },
  async trackShipment(request: LogisticsTrackingRequest): Promise<LogisticsTrackingResult> {
    return {
      provider: "melhorenvio",
      status: "manual_tracking",
      trackingCode: request.trackingCode ?? null,
      trackingUrl: null,
      events: [],
      sandbox: false
    };
  },
  async testConnection() {
    return {
      ok: Boolean(process.env.MELHORENVIO_TOKEN),
      provider: "melhorenvio" as const,
      status: process.env.MELHORENVIO_TOKEN ? "connected" : "not_configured",
      message: process.env.MELHORENVIO_TOKEN
        ? "Melhor Envio configurado no ambiente."
        : "Melhor Envio ainda não configurado.",
      checkedAt: new Date().toISOString(),
      sandbox: process.env.ENABLE_SMOKE_SALE_STUB === "1",
      tokenSuffix: null
    };
  }
};

const frenetProvider: LogisticsProvider = {
  id: "frenet",
  displayName: "Frenet",
  async getShippingQuotes() {
    throw new LogisticsProviderError(
      "frenet",
      "LOGISTICS_PROVIDER_NOT_CONFIGURED",
      "Frenet ainda não configurado na BelaPop."
    );
  },
  async generateShipment() {
    throw new LogisticsProviderError(
      "frenet",
      "LOGISTICS_PROVIDER_NOT_CONFIGURED",
      "Frenet ainda não configurado na BelaPop."
    );
  },
  async trackShipment() {
    throw new LogisticsProviderError(
      "frenet",
      "LOGISTICS_PROVIDER_NOT_CONFIGURED",
      "Frenet ainda não configurado na BelaPop."
    );
  },
  async testConnection() {
    return {
      ok: false,
      provider: "frenet" as const,
      status: "not_configured" as const,
      message: "Frenet ainda não configurado.",
      checkedAt: new Date().toISOString(),
      sandbox: false,
      tokenSuffix: null
    };
  }
};

const providers: Record<LogisticsProviderId, LogisticsProvider> = {
  mandabem: mandaBemProvider,
  melhorenvio: melhorEnvioProvider,
  frenet: frenetProvider
};

export async function getActiveLogisticsProviderId(): Promise<LogisticsProviderId> {
  const runtime = await readLogisticsRuntimeSettings();
  if (runtime.activeProvider) return runtime.activeProvider;
  if (process.env.MELHORENVIO_TOKEN) return "melhorenvio";
  return "mandabem";
}

export async function getActiveLogisticsProvider(): Promise<LogisticsProvider> {
  const providerId = await getActiveLogisticsProviderId();
  return providers[providerId] ?? providers.mandabem;
}

export async function getProviderById(providerId: LogisticsProviderId) {
  return providers[providerId] ?? providers.mandabem;
}
