"use client";

import { useEffect, useState } from "react";

type PixQrCodeProps = {
  amountCents: number;
  qrCodeUrl: string;
  qrCodeData: string;
  expiresAt: number | string;
  orderId: string;
  orderCode?: string;
  paymentIntentId: string;
  onPaid?: (payload?: {
    orderId?: string;
    orderCode?: string;
    paymentIntentId?: string;
    status?: string;
  }) => void;
};

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PixQrCode({
  amountCents,
  qrCodeUrl,
  qrCodeData,
  expiresAt,
  orderId,
  paymentIntentId,
  onPaid
}: PixQrCodeProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [expired, setExpired] = useState(false);

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      const expiresAtMs =
        typeof expiresAt === "number" ? expiresAt * 1000 : new Date(expiresAt).getTime();
      const remaining = expiresAtMs - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        setExpired(true);
      } else {
        setTimeLeft(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Poll for payment confirmation
  useEffect(() => {
    if (expired) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/stripe/pix-status?pi=${encodeURIComponent(paymentIntentId)}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: string;
          orderId?: string;
          orderCode?: string;
        };
        const { status } = data;
        if (status === "paid" || status === "succeeded") {
          clearInterval(poll);
          onPaid?.({
            orderCode: data.orderCode,
            orderId: data.orderId ?? orderId,
            paymentIntentId,
            status
          });
        }
      } catch {}
    }, 5000);

    return () => clearInterval(poll);
  }, [orderId, paymentIntentId, expired, onPaid]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeData);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-[#e8e0d8] bg-white p-8 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#9b9b96]">
        Pix · Confirmação imediata
      </p>
      <p className="mt-2 text-sm text-[#4a4a47]">
        Escaneie o QR Code ou copie o código Pix no seu aplicativo bancário
      </p>
      <p className="mt-4 text-2xl font-light text-[#1e1e1e]">
        {(amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </p>

      {/* QR Code image */}
      <div className="mt-6 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrCodeUrl}
          alt="QR Code Pix"
          className="h-48 w-48 rounded-xl border border-[#e8e0d8]"
        />
      </div>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className="mt-5 w-full rounded-full border border-[#d4845f]/40 bg-[#d4845f]/10 py-3 text-xs font-medium uppercase tracking-[0.25em] text-[#d4845f] transition hover:bg-[#d4845f]/20"
      >
        {copied ? "✓ Código copiado!" : "Copiar código Pix"}
      </button>

      {/* Timer */}
      {!expired ? (
        <p className="mt-4 text-xs text-[#9b9b96]">
          Expira em{" "}
          <span className="tabular-nums font-semibold text-[#1e1e1e]">
            {formatCountdown(timeLeft)}
          </span>
        </p>
      ) : (
        <p className="mt-4 text-xs font-semibold text-red-600">Código Pix expirado. Reinicie o pagamento.</p>
      )}

      {/* Waiting indicator */}
      {!expired ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#9b9b96]">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#d51e71]" />
          Aguardando confirmação do pagamento...
        </div>
      ) : null}
    </div>
  );
}
