"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/AuthContext";
import { getCookie, setCookie } from "@/lib/cookies";
import { liberarReserva, reservarLote } from "@/lib/stripe/reservarLote";

// ---------------------------------------------------------------------------

export type CheckoutState =
  | "idle"
  | "reservando"
  | "criando_session"
  | "redirecionando"
  | "erro";

export type UseCheckoutReturn = {
  state: CheckoutState;
  erro: string | null;
  iniciar: () => Promise<void>;
  resetar: () => void;
};

type UseCheckoutProps = {
  lote_id: string;
  produto_id: string;
  quantidade: number;
};

type SessionApiResponse = {
  url: string;
  session_id: string;
  expira_em: string;
};

type SessionApiError = {
  error?: string;
};

const CRIANDO_SESSION_TIMEOUT_MS = 10_000;

function mensagemPorMotivo(motivo: "ESGOTADO" | "LOTE_ENCERRADO" | "ERRO"): string {
  if (motivo === "ESGOTADO")
    return "Não há unidades suficientes disponíveis neste momento.";
  if (motivo === "LOTE_ENCERRADO")
    return "Este lote foi encerrado. Entre na lista de espera.";
  return "Não foi possível reservar. Tente novamente em instantes.";
}

function getOrCreateSessionBp(): string {
  const existing = getCookie("belapop_anon_id");
  if (existing) return existing;
  const newId = crypto.randomUUID();
  setCookie("belapop_anon_id", newId);
  return newId;
}

// ---------------------------------------------------------------------------

export function useCheckout({
  lote_id,
  produto_id,
  quantidade,
}: UseCheckoutProps): UseCheckoutReturn {
  const { user } = useAuth();
  const [state, setState] = useState<CheckoutState>("idle");
  const [erro, setErro] = useState<string | null>(null);

  // Tracks the reserva_id created during the flow so cleanup can release it
  const reservaIdRef = useRef<string | null>(null);
  const loteIdRef = useRef<string>(lote_id);
  loteIdRef.current = lote_id;

  // Cleanup: release reservation if component unmounts mid-flow
  useEffect(() => {
    return () => {
      const rid = reservaIdRef.current;
      const lid = loteIdRef.current;
      if (rid && lid) {
        liberarReserva(lid, rid);
      }
    };
  }, []);

  const resetar = useCallback(() => {
    reservaIdRef.current = null;
    setErro(null);
    setState("idle");
  }, []);

  const iniciar = useCallback(async () => {
    if (state !== "idle") return;

    setState("reservando");
    setErro(null);

    const sessionBp = getOrCreateSessionBp();
    const userId = user?.id ?? null;

    // Step 1: Reserve stock
    const reserva = await reservarLote(lote_id, quantidade, sessionBp, userId);

    if (!reserva.ok) {
      setErro(mensagemPorMotivo(reserva.motivo));
      setState("erro");
      return;
    }

    reservaIdRef.current = reserva.reserva_id;

    // Step 2: Create Stripe Checkout Session (with 10s timeout)
    setState("criando_session");

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), CRIANDO_SESSION_TIMEOUT_MS);
    });

    const sessionFetchPromise = fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lote_id, produto_id, quantidade, reserva_id: reserva.reserva_id }),
    });

    const fetchResult = await Promise.race([sessionFetchPromise, timeoutPromise]);

    if (fetchResult === null) {
      // Timeout — release reservation before giving up
      await liberarReserva(lote_id, reserva.reserva_id);
      reservaIdRef.current = null;
      setErro("Timeout ao preparar o pagamento. Tente novamente.");
      setState("erro");
      return;
    }

    const res = fetchResult as Response;

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as SessionApiError;
      await liberarReserva(lote_id, reserva.reserva_id);
      reservaIdRef.current = null;
      setErro(data.error ?? "Não foi possível iniciar o pagamento. Tente novamente.");
      setState("erro");
      return;
    }

    const session = (await res.json()) as SessionApiResponse;

    if (!session.url) {
      await liberarReserva(lote_id, reserva.reserva_id);
      reservaIdRef.current = null;
      setErro("Não foi possível iniciar o pagamento. Tente novamente.");
      setState("erro");
      return;
    }

    // Step 3: Redirect — reservation ownership transfers to Stripe session
    // Clear ref so cleanup effect doesn't double-release
    reservaIdRef.current = null;
    setState("redirecionando");
    window.location.href = session.url;
  }, [state, lote_id, produto_id, quantidade, user]);

  return { state, erro, iniciar, resetar };
}
