"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useCart } from "@/lib/CartContext";
import { SellerShipment, ShippingCartItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/tracker";

type ShippingCalculatorProps = {
  cartItems: ShippingCartItem[];
  tone?: "light" | "dark";
  autoQuote?: boolean;
  mode?: "replace" | "merge";
};

type ShippingError = {
  sellerId: string;
  sellerName: string;
  message: string;
};

const maskCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const sanitizeCep = (value: string) => value.replace(/\D/g, "").slice(0, 8);

export const ShippingCalculator = ({
  cartItems,
  tone = "dark",
  autoQuote = true,
  mode = "replace"
}: ShippingCalculatorProps) => {
  const { shippingCep, setShipments, setShippingCep } = useCart();
  const [cep, setCep] = useState(shippingCep ? maskCep(shippingCep) : "");
  const [shipments, setLocalShipments] = useState<SellerShipment[]>([]);
  const [errors, setErrors] = useState<ShippingError[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isLight = tone === "light";
  const itemsKey = useMemo(
    () =>
      cartItems
        .map(
          (item) =>
            `${item.productId}:${item.sellerId}:${item.quantity}:${item.weightKg}:${item.widthCm}:${item.heightCm}:${item.lengthCm}:${item.price}`
        )
        .join("|")
        .toString(),
    [cartItems]
  );
  const autoKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!shippingCep) return;
    const masked = maskCep(shippingCep);
    if (maskCep(cep) !== masked) {
      setCep(masked);
    }
  }, [shippingCep, cep]);

  useEffect(() => {
    const cleaned = sanitizeCep(cep);
    if (shippingCep && cleaned !== shippingCep) {
      setLocalShipments([]);
      setErrors([]);
    }
  }, [cep, shippingCep]);

  const handleQuote = async (forcedCep?: string) => {
    const rawCep = forcedCep ?? cep;
    const cleanedCep = sanitizeCep(rawCep);

    if (cleanedCep.length !== 8) {
      setMessage("Informe um CEP válido com 8 dígitos.");
      return;
    }

    if (cartItems.length === 0) {
      setMessage("Adicione produtos para calcular o frete.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setShippingCep(cleanedCep);

    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationCep: cleanedCep, cartItems })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(
          data?.error ??
            "Não foi possível calcular o frete. Tente novamente."
        );
        setLocalShipments([]);
        setErrors([]);
        setLoading(false);
        return;
      }

      const nextShipments: SellerShipment[] = Array.isArray(data?.shipments)
        ? data.shipments
        : [];
      const nextErrors: ShippingError[] = Array.isArray(data?.errors)
        ? data.errors
        : [];

      if (nextShipments.length === 0 && nextErrors.length === 0) {
        setMessage("Nenhuma opção disponível para este CEP.");
      }

      setLocalShipments(nextShipments);
      setErrors(nextErrors);
      setShipments(nextShipments, mode);

      if (nextShipments.length > 0) {
        void trackEvent({
          type: "select_shipping",
          metadata: {
            destinationCep: cleanedCep,
            sellerIds: nextShipments.map((shipment) => shipment.sellerId),
            shippingCount: nextShipments.length
          }
        });
      }
    } catch (error) {
      console.error(error);
      setMessage("Erro inesperado ao calcular. Tente novamente.");
      setLocalShipments([]);
      setErrors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoQuote) return;
    const cleanedCep = sanitizeCep(cep || shippingCep);
    if (cleanedCep.length !== 8 || cartItems.length === 0) return;
    const key = `${cleanedCep}:${itemsKey}`;
    if (autoKeyRef.current === key) return;
    autoKeyRef.current = key;
    void handleQuote(cleanedCep);
  }, [autoQuote, cep, shippingCep, itemsKey, cartItems.length]);

  return (
    <div
      className={`rounded-2xl p-6 ${
        isLight ? "border border-black/10 bg-white shadow-sm" : "glass-panel"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p
            className={`text-xs uppercase tracking-[0.3em] ${
              isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"
            }`}
          >
            Frete por vendedor
          </p>
          <h3
            className={`mt-2 font-display text-xl ${
              isLight ? "text-bpBlack" : "text-bpOffWhite"
            }`}
          >
            Calcular frete
          </h3>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <label htmlFor="shipping-cep" className="sr-only">
          CEP
        </label>
        <input
          id="shipping-cep"
          value={cep}
          onChange={(event) => setCep(maskCep(event.target.value))}
          placeholder="Digite seu CEP"
          inputMode="numeric"
          pattern="\d*"
          className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:border-bpPink/60 md:max-w-[220px] ${
            isLight
              ? "border-slate-200 bg-white text-bpBlackSoft placeholder:text-bpGraphite/60"
              : "border-white/10 bg-bpBlackSoft text-bpOffWhite placeholder:text-bpPinkSoft/50"
          }`}
        />
        <LuxuryButton
          type="button"
          onClick={() => handleQuote()}
          tone={isLight ? "retail" : "default"}
          className="w-full md:w-auto"
          aria-label="Calcular frete"
        >
          {loading ? "Calculando..." : "Calcular"}
        </LuxuryButton>
      </div>

      {message ? (
        <p
          className={`mt-3 text-xs ${
            isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/70"
          }`}
        >
          {message}
        </p>
      ) : null}

      {errors.length > 0 ? (
        <div className="mt-4 space-y-2 text-xs text-rose-500">
          {errors.map((error) => (
            <p key={error.sellerId}>
              Não foi possível calcular o envio da {error.sellerName}.
            </p>
          ))}
        </div>
      ) : null}

      {shipments.length > 0 ? (
        <div className="mt-5 space-y-3">
          <p
            className={`text-xs uppercase tracking-[0.2em] ${
              isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"
            }`}
          >
            Opções encontradas
          </p>
          {shipments.map((shipment) => (
            <div
              key={`${shipment.sellerId}-${shipment.serviceId}`}
              className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 text-sm ${
                isLight
                  ? "border-slate-200 bg-white"
                  : "border-white/10 bg-bpBlackSoft/40"
              }`}
            >
              <span
                className={`font-medium ${
                  isLight ? "text-bpBlackSoft" : "text-bpOffWhite"
                }`}
              >
                {shipment.sellerName} • {shipment.carrier}
              </span>
              <span className={isLight ? "text-bpGraphite/80" : "text-bpPinkSoft/70"}>
                {shipment.serviceName} • {shipment.originCep} → {shipment.destinationCep}
              </span>
              <span className={isLight ? "text-bpBlackSoft" : "text-bpOffWhite"}>
                {formatPrice(shipment.price)} • {shipment.deliveryTimeDays} dia(s)
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
