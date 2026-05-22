import "server-only";

import type { ShippingOption, ShippingQuoteItem } from "@/lib/types";
import { resolveStoredMandaBemToken } from "@/lib/logistics/credentials";
import {
  LogisticsProviderError,
  type LogisticsConnectionTestResult,
  type LogisticsProvider,
  type LogisticsQuoteMode,
  type LogisticsQuoteRequest,
  type LogisticsQuoteResponse,
  type LogisticsShipmentRequest,
  type LogisticsShipmentResult,
  type LogisticsTrackingRequest,
  type LogisticsTrackingResult
} from "@/lib/logistics/types";

const DEFAULT_BASE_URL = "https://mandabem.com.br/ws";
const DEFAULT_BEARER_QUOTES_PATH = "/shipping/quotes";
const DEFAULT_BEARER_SHIPMENTS_PATH = "/shipments";
const DEFAULT_BEARER_TRACKING_PATH = "/shipments/track";
const DEFAULT_LEGACY_QUOTES_PATH = "/valor_envio";
const DEFAULT_LEGACY_SHIPMENTS_PATH = "/envio";
const DEFAULT_LEGACY_TRACKING_PATH = "/envio";

const SAMPLE_ORIGIN_CEP = "01311000";
const SAMPLE_DESTINATION_CEP = "20040030";

type MandaBemAuthMode = "auto" | "bearer" | "legacy_form";

type MandaBemCredential =
  | { mode: "bearer"; token: string }
  | { mode: "legacy_form"; platformId: string; platformKey: string };

type RequestOptions = {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  tokenOverride?: string;
  sandboxOverride?: boolean;
  endpointPath?: string;
};

function sanitizeCep(value: string) {
  return value.replace(/\D/g, "");
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeToken(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function resolveAuthMode(): MandaBemAuthMode {
  const raw = String(process.env.MANDABEM_AUTH_MODE ?? "auto").trim().toLowerCase();
  if (raw === "bearer" || raw === "legacy_form") return raw;
  return "auto";
}

function resolveSandboxEnabled(override?: boolean) {
  if (typeof override === "boolean") return override;
  return process.env.MANDABEM_SANDBOX_MODE === "1";
}

async function resolveCredential(tokenOverride?: string): Promise<MandaBemCredential> {
  const raw =
    sanitizeToken(tokenOverride ?? "") ||
    sanitizeToken((await resolveStoredMandaBemToken()).token ?? "");

  if (!raw) {
    throw new LogisticsProviderError(
      "mandabem",
      "LOGISTICS_PROVIDER_NOT_CONFIGURED",
      "Manda Bem sem token configurado."
    );
  }

  const authMode = resolveAuthMode();
  if (authMode === "legacy_form" || (authMode === "auto" && raw.includes(":"))) {
    const [platformId, platformKey] = raw.split(":");
    if (!platformId || !platformKey) {
      throw new LogisticsProviderError(
        "mandabem",
        "LOGISTICS_INVALID_TOKEN",
        "Token do Manda Bem invalido para modo legado."
      );
    }
    return {
      mode: "legacy_form",
      platformId: platformId.trim(),
      platformKey: platformKey.trim()
    };
  }

  return {
    mode: "bearer",
    token: raw
  };
}

function buildMandaBemOptions(
  items: ShippingQuoteItem[],
  mode: LogisticsQuoteMode
): ShippingOption[] {
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const weight = items.reduce((sum, item) => sum + item.weightKg * item.quantity, 0);
  const insuredValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const base = 14.5 + quantity * 1.65 + weight * 5.25 + insuredValue * 0.009;
  const economical = Number(base.toFixed(2));
  const express = Number((base * 1.34).toFixed(2));

  return [
    {
      serviceName: mode === "fallback" ? "Economica estimada" : "Economica",
      price: economical,
      deliveryTimeDays: 5,
      carrier: "Manda Bem Parceiras",
      serviceId: "mandabem-economic",
      badge: "Menor custo"
    },
    {
      serviceName: mode === "fallback" ? "Expressa estimada" : "Expressa",
      price: express,
      deliveryTimeDays: 2,
      carrier: "Manda Bem Parceiras",
      serviceId: "mandabem-express",
      badge: "Melhor prazo"
    }
  ];
}

async function requestMandaBem(
  credential: MandaBemCredential,
  options: RequestOptions
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.MANDABEM_TIMEOUT_MS ?? 12000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const baseUrl = String(process.env.MANDABEM_API_BASE_URL ?? DEFAULT_BASE_URL).trim();

  try {
    if (credential.mode === "legacy_form") {
      const payload = new URLSearchParams();
      payload.set("plataforma_id", credential.platformId);
      payload.set("plataforma_chave", credential.platformKey);

      Object.entries(options.body ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        payload.set(key, String(value));
      });

      const response = await fetch(
        `${baseUrl}${options.endpointPath ?? DEFAULT_LEGACY_QUOTES_PATH}`,
        {
          method: options.method ?? "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: payload.toString(),
          signal: controller.signal,
          cache: "no-store"
        }
      );

      const text = await response.text();
      if (!response.ok) {
        if (response.status === 401) {
          throw new LogisticsProviderError(
            "mandabem",
            "LOGISTICS_INVALID_TOKEN",
            "Token do Manda Bem recusado.",
            { httpStatus: response.status }
          );
        }
        if (response.status === 403) {
          throw new LogisticsProviderError(
            "mandabem",
            "LOGISTICS_AUTH_ERROR",
            "Autenticacao do Manda Bem recusada.",
            { httpStatus: response.status }
          );
        }
        throw new LogisticsProviderError(
          "mandabem",
          "LOGISTICS_QUOTE_FAILED",
          `Falha na API do Manda Bem (${response.status}).`,
          { httpStatus: response.status, retriable: response.status >= 500 }
        );
      }

      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    const response = await fetch(
      `${baseUrl}${options.endpointPath ?? DEFAULT_BEARER_QUOTES_PATH}`,
      {
        method: options.method ?? "POST",
        headers: {
          Authorization: `Bearer ${credential.token}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body:
          options.method === "GET" ? undefined : JSON.stringify(options.body ?? {}),
        signal: controller.signal,
        cache: "no-store"
      }
    );

    const text = await response.text();
    if (!response.ok) {
      if (response.status === 401) {
        throw new LogisticsProviderError(
          "mandabem",
          "LOGISTICS_INVALID_TOKEN",
          "Token do Manda Bem recusado.",
          { httpStatus: response.status }
        );
      }
      if (response.status === 403) {
        throw new LogisticsProviderError(
          "mandabem",
          "LOGISTICS_AUTH_ERROR",
          "Autenticacao do Manda Bem recusada.",
          { httpStatus: response.status }
        );
      }
      throw new LogisticsProviderError(
        "mandabem",
        "LOGISTICS_QUOTE_FAILED",
        `Falha na API do Manda Bem (${response.status}).`,
        { httpStatus: response.status, retriable: response.status >= 500 }
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new LogisticsProviderError(
        "mandabem",
        "LOGISTICS_PROVIDER_TIMEOUT",
        "Tempo limite excedido ao falar com o Manda Bem.",
        { retriable: true }
      );
    }

    if (error instanceof LogisticsProviderError) {
      throw error;
    }

    throw new LogisticsProviderError(
      "mandabem",
      "LOGISTICS_QUOTE_FAILED",
      "Falha inesperada ao falar com o Manda Bem.",
      { retriable: true }
    );
  } finally {
    clearTimeout(timeout);
  }
}

function extractMessage(payload: unknown) {
  if (typeof payload === "string") return payload;
  if (!isRecord(payload)) return null;

  const direct =
    payload.message ||
    payload.mensagem ||
    payload.error ||
    payload.erro ||
    payload.detail;

  if (typeof direct === "string" && direct.trim()) return direct;

  const resultado = payload.resultado;
  if (isRecord(resultado)) {
    const nested =
      resultado.message || resultado.mensagem || resultado.error || resultado.erro;
    if (typeof nested === "string" && nested.trim()) return nested;
  }

  return null;
}

function normalizeQuoteRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.quotes)) {
    return payload.quotes.filter(isRecord);
  }

  if (Array.isArray(payload.data)) {
    return payload.data.filter(isRecord);
  }

  if (isRecord(payload.resultado)) {
    const nested = payload.resultado;
    if (Array.isArray(nested.data)) {
      return nested.data.filter(isRecord);
    }
    if (Array.isArray(nested.cotacoes)) {
      return nested.cotacoes.filter(isRecord);
    }
    if (Array.isArray(nested.dados)) {
      return nested.dados.filter(isRecord);
    }
    if (isRecord(nested.dados)) {
      return [nested.dados];
    }
  }

  return [];
}

function toShippingOption(row: Record<string, unknown>): ShippingOption | null {
  const price = parseNumber(
    row.custom_price ??
      row.price ??
      row.valor ??
      row.preco ??
      row.total ??
      row.valor_total
  );
  const deliveryTimeDays = parseNumber(
    row.custom_delivery_time ??
      row.delivery_time ??
      row.prazo ??
      row.prazo_entrega ??
      row.tempo
  );
  const serviceName = String(
    row.name ??
      row.servico ??
      row.service ??
      row.modalidade ??
      row.nome ??
      "Frete"
  ).trim();
  const carrier = String(
    row.carrier ??
      row.transportadora ??
      (isRecord(row.company) ? row.company.name : undefined) ??
      row.empresa ??
      "Transportadora"
  ).trim();
  const serviceId = String(
    row.id ?? row.codigo ?? row.service_id ?? `${carrier}-${serviceName}`
  ).trim();

  if (!Number.isFinite(price) || price <= 0) return null;

  return {
    serviceName,
    price: Number(price.toFixed(2)),
    deliveryTimeDays: Number.isFinite(deliveryTimeDays)
      ? Math.max(1, Math.round(deliveryTimeDays))
      : 5,
    carrier,
    serviceId
  };
}

function buildLegacyQuotePayload(
  request: LogisticsQuoteRequest,
  service: string
): Record<string, unknown> {
  const declaredValue = request.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return {
    cep_origem: sanitizeCep(request.originCep),
    cep_destino: sanitizeCep(request.destinationCep),
    servico: service,
    valor_seguro: Number(declaredValue.toFixed(2)),
    peso: Number(
      request.items.reduce((sum, item) => sum + item.weightKg * item.quantity, 0).toFixed(3)
    )
  };
}

async function getLiveQuoteResponse(
  request: LogisticsQuoteRequest,
  tokenOverride?: string,
  sandboxOverride?: boolean,
  allowFallback = true
): Promise<LogisticsQuoteResponse> {
  const credential = await resolveCredential(tokenOverride);

  if (resolveSandboxEnabled(sandboxOverride ?? request.sandbox)) {
    return {
      provider: "mandabem",
      mode: "sandbox",
      options: buildMandaBemOptions(request.items, "sandbox"),
      warnings: ["Sandbox logistico ativo para o Manda Bem."]
    };
  }

  try {
    if (credential.mode === "legacy_form") {
      const services = String(process.env.MANDABEM_LEGACY_SERVICES ?? "PAC,SEDEX")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

      const rows: ShippingOption[] = [];

      for (const service of services) {
        const payload = await requestMandaBem(credential, {
          endpointPath: process.env.MANDABEM_QUOTES_PATH || DEFAULT_LEGACY_QUOTES_PATH,
          body: buildLegacyQuotePayload(request, service)
        });
        rows.push(...normalizeQuoteRows(payload).map(toShippingOption).filter(Boolean) as ShippingOption[]);
      }

      if (!rows.length) {
        const warning = extractMessage(
          await requestMandaBem(credential, {
            endpointPath: process.env.MANDABEM_QUOTES_PATH || DEFAULT_LEGACY_QUOTES_PATH,
            body: buildLegacyQuotePayload(request, services[0] ?? "PAC")
          })
        );
        throw new LogisticsProviderError(
          "mandabem",
          "LOGISTICS_UNAVAILABLE_FOR_POSTAL_CODE",
          warning ?? "Nenhuma cotacao disponivel para este CEP."
        );
      }

      return {
        provider: "mandabem",
        mode: "live",
        options: rows
      };
    }

    const payload = await requestMandaBem(credential, {
      endpointPath: process.env.MANDABEM_QUOTES_PATH || DEFAULT_BEARER_QUOTES_PATH,
      body: {
        origin_postal_code: sanitizeCep(request.originCep),
        destination_postal_code: sanitizeCep(request.destinationCep),
        currency: request.currency ?? "BRL",
        items: request.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          weight_kg: item.weightKg,
          width_cm: item.widthCm,
          height_cm: item.heightCm,
          length_cm: item.lengthCm,
          declared_value: item.price
        }))
      }
    });

    const options = normalizeQuoteRows(payload)
      .map(toShippingOption)
      .filter((option): option is ShippingOption => Boolean(option));

    if (!options.length) {
      throw new LogisticsProviderError(
        "mandabem",
        "LOGISTICS_UNAVAILABLE_FOR_POSTAL_CODE",
        extractMessage(payload) ?? "Nenhuma cotacao disponivel para este CEP."
      );
    }

    return {
      provider: "mandabem",
      mode: "live",
      options
    };
  } catch (error) {
    if (
      error instanceof LogisticsProviderError &&
      ["LOGISTICS_INVALID_TOKEN", "LOGISTICS_AUTH_ERROR"].includes(error.code)
    ) {
      console.warn("[mandabem] auth failure", {
        code: error.code,
        httpStatus: error.httpStatus ?? null
      });
      throw error;
    }

    if (!allowFallback) {
      console.warn("[mandabem] live quote failed", {
        code: error instanceof LogisticsProviderError ? error.code : "unknown",
        message: error instanceof Error ? error.message : "unknown"
      });
      throw error;
    }

    console.warn("[mandabem] fallback quote engaged", {
      code: error instanceof LogisticsProviderError ? error.code : "unknown",
      message: error instanceof Error ? error.message : "unknown"
    });

    return {
      provider: "mandabem",
      mode: "fallback",
      options: buildMandaBemOptions(request.items, "fallback"),
      warnings: [
        "Cotacao exibida em modo de contingencia por indisponibilidade temporaria do hub logistico."
      ]
    };
  }
}

export async function getShippingQuotes(
  request: LogisticsQuoteRequest,
  args?: { tokenOverride?: string; sandboxOverride?: boolean }
) {
  return getLiveQuoteResponse(request, args?.tokenOverride, args?.sandboxOverride, true);
}

export async function generateShipment(
  request: LogisticsShipmentRequest,
  args?: { tokenOverride?: string; sandboxOverride?: boolean }
): Promise<LogisticsShipmentResult> {
  if (resolveSandboxEnabled(args?.sandboxOverride ?? request.sandbox)) {
    return {
      provider: "mandabem",
      shipmentId: `sandbox-${request.orderId}`,
      status: "sandbox_created",
      trackingCode: `MB-${request.orderId.slice(0, 8).toUpperCase()}`,
      trackingUrl: `https://tracking.belapop.local/${request.orderId}`,
      labelUrl: `https://labels.belapop.local/${request.orderId}.pdf`,
      carrier: "Manda Bem Sandbox",
      serviceName: request.serviceId,
      sandbox: true
    };
  }

  const credential = await resolveCredential(args?.tokenOverride);
  const payload = await requestMandaBem(credential, {
    endpointPath:
      process.env.MANDABEM_SHIPMENT_PATH ||
      (credential.mode === "legacy_form"
        ? DEFAULT_LEGACY_SHIPMENTS_PATH
        : DEFAULT_BEARER_SHIPMENTS_PATH),
    body: {
      order_id: request.orderId,
      seller_id: request.sellerId,
      service_id: request.serviceId,
      origin_postal_code: sanitizeCep(request.originCep),
      destination_postal_code: sanitizeCep(request.destinationCep),
      recipient: request.recipient,
      items: request.items
    }
  });

  const record = isRecord(payload) ? payload : {};

  return {
    provider: "mandabem",
    shipmentId: String(record.id ?? record.shipment_id ?? request.orderId),
    status: String(record.status ?? "created"),
    trackingCode: String(record.tracking_code ?? record.codigo_rastreio ?? ""),
    trackingUrl: String(record.tracking_url ?? ""),
    labelUrl: String(record.label_url ?? record.etiqueta_url ?? ""),
    carrier: String(record.carrier ?? record.transportadora ?? ""),
    serviceName: String(record.service_name ?? request.serviceId),
    sandbox: false,
    raw: payload
  };
}

export async function trackShipment(
  request: LogisticsTrackingRequest,
  args?: { tokenOverride?: string; sandboxOverride?: boolean }
): Promise<LogisticsTrackingResult> {
  if (resolveSandboxEnabled(args?.sandboxOverride ?? request.sandbox)) {
    return {
      provider: "mandabem",
      status: "in_transit",
      trackingCode: request.trackingCode ?? "MB-SANDBOX",
      trackingUrl: `https://tracking.belapop.local/${request.trackingCode ?? "sandbox"}`,
      sandbox: true,
      events: [
        {
          status: "posted",
          detail: "Objeto postado no hub sandbox.",
          occurredAt: new Date().toISOString()
        }
      ]
    };
  }

  const credential = await resolveCredential(args?.tokenOverride);
  const payload = await requestMandaBem(credential, {
    endpointPath:
      process.env.MANDABEM_TRACKING_PATH ||
      (credential.mode === "legacy_form"
        ? DEFAULT_LEGACY_TRACKING_PATH
        : DEFAULT_BEARER_TRACKING_PATH),
    method: "POST",
    body: {
      shipment_id: request.shipmentId,
      tracking_code: request.trackingCode
    }
  });

  const record = isRecord(payload) ? payload : {};
  const events = Array.isArray(record.events)
    ? record.events
        .filter(isRecord)
        .map((event) => ({
          status: String(event.status ?? "update"),
          detail: String(event.detail ?? event.descricao ?? ""),
          location: String(event.location ?? event.local ?? ""),
          occurredAt: String(event.occurred_at ?? event.data ?? "")
        }))
    : [];

  return {
    provider: "mandabem",
    status: String(record.status ?? "unknown"),
    trackingCode: String(record.tracking_code ?? request.trackingCode ?? ""),
    trackingUrl: String(record.tracking_url ?? ""),
    sandbox: false,
    events,
    raw: payload
  };
}

export async function testConnection(args?: {
  tokenOverride?: string;
  sandboxOverride?: boolean;
}): Promise<LogisticsConnectionTestResult> {
  const checkedAt = new Date().toISOString();
  const sandbox = resolveSandboxEnabled(args?.sandboxOverride);
  const tokenSource = sanitizeToken(args?.tokenOverride ?? "") || (await resolveStoredMandaBemToken()).token || "";
  const tokenSuffix = tokenSource ? `••••${tokenSource.split(":").slice(-1)[0].slice(-4)}` : null;

  try {
    await getLiveQuoteResponse(
      {
        originCep: SAMPLE_ORIGIN_CEP,
        destinationCep: SAMPLE_DESTINATION_CEP,
        items: [
          {
            id: "sample",
            quantity: 1,
            weightKg: 0.3,
            widthCm: 12,
            heightCm: 6,
            lengthCm: 18,
            price: 189
          }
        ]
      },
      args?.tokenOverride,
      args?.sandboxOverride,
      false
    );

    return {
      ok: true,
      provider: "mandabem",
      status: "connected",
      message: sandbox
        ? "Sandbox do Manda Bem ativo e respondendo."
        : "Conexao com o Manda Bem validada com sucesso.",
      checkedAt,
      sandbox,
      tokenSuffix
    };
  } catch (error) {
    if (error instanceof LogisticsProviderError) {
      if (error.code === "LOGISTICS_INVALID_TOKEN") {
        return {
          ok: false,
          provider: "mandabem",
          status: "invalid_token",
          message: "Token invalido para o Manda Bem.",
          checkedAt,
          sandbox,
          tokenSuffix
        };
      }

      if (error.code === "LOGISTICS_AUTH_ERROR") {
        return {
          ok: false,
          provider: "mandabem",
          status: "auth_error",
          message: "Erro de autenticação com o Manda Bem.",
          checkedAt,
          sandbox,
          tokenSuffix
        };
      }

      return {
        ok: false,
        provider: "mandabem",
        status: "error",
        message: error.message,
        checkedAt,
        sandbox,
        tokenSuffix
      };
    }

    return {
      ok: false,
      provider: "mandabem",
      status: "error",
      message: "Não foi possivel validar a conexao com o Manda Bem.",
      checkedAt,
      sandbox,
      tokenSuffix
    };
  }
}

export const mandaBemProvider: LogisticsProvider = {
  id: "mandabem",
  displayName: "Manda Bem",
  getShippingQuotes,
  generateShipment,
  trackShipment,
  testConnection
};
