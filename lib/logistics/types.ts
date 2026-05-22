import type { ShippingOption, ShippingQuoteItem } from "@/lib/types";

export type LogisticsProviderId = "mandabem" | "melhorenvio" | "frenet";

export type LogisticsQuoteMode = "live" | "sandbox" | "fallback";

export type LogisticsConnectionStatus =
  | "connected"
  | "invalid_token"
  | "auth_error"
  | "error"
  | "not_configured";

export type LogisticsQuoteRequest = {
  originCep: string;
  destinationCep: string;
  items: ShippingQuoteItem[];
  orderValue?: number;
  currency?: string;
  sandbox?: boolean;
};

export type ShipmentRecipient = {
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode: string;
};

export type LogisticsShipmentRequest = {
  orderId: string;
  sellerId: string;
  originCep: string;
  destinationCep: string;
  serviceId: string;
  items: ShippingQuoteItem[];
  recipient: ShipmentRecipient;
  declaredValue?: number;
  referenceId?: string | null;
  sandbox?: boolean;
};

export type LogisticsTrackingEvent = {
  status: string;
  detail?: string;
  location?: string;
  occurredAt?: string;
};

export type LogisticsTrackingRequest = {
  shipmentId?: string | null;
  trackingCode?: string | null;
  sandbox?: boolean;
};

export type LogisticsQuoteResponse = {
  provider: LogisticsProviderId;
  mode: LogisticsQuoteMode;
  options: ShippingOption[];
  warnings?: string[];
};

export type LogisticsShipmentResult = {
  provider: LogisticsProviderId;
  shipmentId: string;
  status: string;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  carrier?: string | null;
  serviceName?: string | null;
  sandbox: boolean;
  raw?: unknown;
};

export type LogisticsTrackingResult = {
  provider: LogisticsProviderId;
  status: string;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  events: LogisticsTrackingEvent[];
  sandbox: boolean;
  raw?: unknown;
};

export type LogisticsConnectionTestResult = {
  ok: boolean;
  provider: LogisticsProviderId;
  status: LogisticsConnectionStatus;
  message: string;
  checkedAt: string;
  sandbox: boolean;
  tokenSuffix?: string | null;
};

export type LogisticsProvider = {
  id: LogisticsProviderId;
  displayName: string;
  getShippingQuotes: (request: LogisticsQuoteRequest) => Promise<LogisticsQuoteResponse>;
  generateShipment: (
    request: LogisticsShipmentRequest
  ) => Promise<LogisticsShipmentResult>;
  trackShipment: (
    request: LogisticsTrackingRequest
  ) => Promise<LogisticsTrackingResult>;
  testConnection: (args?: {
    tokenOverride?: string;
    sandboxOverride?: boolean;
  }) => Promise<LogisticsConnectionTestResult>;
};

export type LogisticsProviderErrorCode =
  | "LOGISTICS_PROVIDER_NOT_CONFIGURED"
  | "LOGISTICS_INVALID_TOKEN"
  | "LOGISTICS_AUTH_ERROR"
  | "LOGISTICS_PROVIDER_TIMEOUT"
  | "LOGISTICS_QUOTE_FAILED"
  | "LOGISTICS_SHIPMENT_FAILED"
  | "LOGISTICS_TRACKING_FAILED"
  | "LOGISTICS_UNAVAILABLE_FOR_POSTAL_CODE";

export class LogisticsProviderError extends Error {
  readonly code: LogisticsProviderErrorCode;
  readonly provider: LogisticsProviderId;
  readonly httpStatus?: number;
  readonly retriable: boolean;

  constructor(
    provider: LogisticsProviderId,
    code: LogisticsProviderErrorCode,
    message: string,
    options?: { httpStatus?: number; retriable?: boolean }
  ) {
    super(message);
    this.name = "LogisticsProviderError";
    this.provider = provider;
    this.code = code;
    this.httpStatus = options?.httpStatus;
    this.retriable = options?.retriable ?? false;
  }
}

export const sortShippingOptions = (options: ShippingOption[]) =>
  [...options].sort((left, right) => {
    if (left.price !== right.price) return left.price - right.price;
    if (left.deliveryTimeDays !== right.deliveryTimeDays) {
      return left.deliveryTimeDays - right.deliveryTimeDays;
    }
    return left.serviceName.localeCompare(right.serviceName, "pt-BR");
  });

export const pickPreferredShippingOption = (options: ShippingOption[]) =>
  sortShippingOptions(options)[0];
