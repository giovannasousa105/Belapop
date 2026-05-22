"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ScanStatus =
  | "AGUARDANDO"
  | "PROCESSANDO_CV"
  | "SCORING"
  | "RECOMENDANDO"
  | "CONCLUIDO"
  | "ERRO";

export interface ScanStatusData {
  scan_id: string;
  skin_id: string | null;
  status: ScanStatus;
  descricao: string;
  concluido: boolean;
  erro: boolean;
  erro_mensagem: string | null;
  duracao_ms: number | null;
  atualizado_em: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2_000;
const TIMEOUT_MS = 30_000;

export function useScanStatus(scanId: string) {
  const [data, setData] = useState<ScanStatusData | null>(null);
  const [erroFetch, setErroFetch] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const stoppedRef = useRef(false);

  const poll = useCallback(async () => {
    if (stoppedRef.current) return;
    try {
      const res = await fetch(`/api/skin-scan/${scanId}/status`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setErroFetch(true);
        return;
      }
      const json = (await res.json()) as ScanStatusData;
      setData(json);

      if (json.concluido || json.erro) {
        stoppedRef.current = true; // para o intervalo — sem leak
      }
    } catch {
      setErroFetch(true);
    }
  }, [scanId]);

  useEffect(() => {
    stoppedRef.current = false;
    setData(null);
    setErroFetch(false);
    setTimedOut(false);

    poll(); // primeira chamada imediata

    const interval = setInterval(() => {
      if (!stoppedRef.current) poll();
      else clearInterval(interval);
    }, POLL_INTERVAL_MS);

    const timeout = setTimeout(() => {
      if (!stoppedRef.current) setTimedOut(true);
    }, TIMEOUT_MS);

    return () => {
      stoppedRef.current = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [scanId, poll]);

  return { data, erroFetch, timedOut };
}
