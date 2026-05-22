"use client";

/**
 * INVARIANTE DE ARQUITETURA — OPTIMISTIC UI COM FIRE-AND-FORGET
 *
 * Toda interação do Copilot que a usuária responde com toque
 * DEVE atualizar o estado visual ANTES do POST completar.
 *
 * Por quê: a percepção humana de "travamento" começa em ~100ms.
 * Se o card espera o servidor para colapsar, qualquer latência de rede
 * (3G, WiFi ruim, servidor ocupado) torna a UI parecer com bug.
 *
 * Padrão obrigatório:
 *   1. setState imediato (< 16ms — próximo frame)
 *   2. POST fire-and-forget (void, não await no caminho visual)
 *   3. Retry silencioso em falha de rede / 5xx (3 tentativas, backoff linear)
 *   4. Rollback visual APENAS em 4xx (erro de negócio) — nunca em rede
 *
 * O que NÃO fazer (causa travamento visual):
 *   const handleClick = async () => {
 *     await fetch('/api/copilot/resposta', ...)  ← NUNCA assim
 *     setRespondida(true)                        ← tarde demais
 *   }
 */

import { useCallback, useRef, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RespostaPayload {
  interacao_id: string;
  tipo_resposta: string;
  valor: unknown;
}

export interface UseOptimisticRespostaReturn {
  readonly respondida: boolean;
  readonly enviando: boolean;
  readonly erro: "NEGOCIO" | null; // só erros de negócio chegam à usuária
  /** SÍNCRONO — nunca retorna Promise — nunca usar async aqui */
  readonly responder: (payload: RespostaPayload) => void;
  readonly resetar: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_TENTATIVAS = 3;
const INTERVALO_BASE_MS = 5000; // backoff linear: 5s, 10s, 15s

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOptimisticResposta(
  onSucesso?: () => void,
  onErroNegocio?: (mensagem: string) => void
): UseOptimisticRespostaReturn {
  const [respondida, setRespondida] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<"NEGOCIO" | null>(null);

  const tentativasRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enviarComRetry = useCallback(
    async (payload: RespostaPayload, tentativa: number): Promise<void> => {
      try {
        const res = await fetch("/api/copilot/resposta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setEnviando(false);
          onSucesso?.();
          return;
        }

        // 4xx: erro de negócio — rollback visual, informar usuária, não retry
        if (res.status >= 400 && res.status < 500) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          setEnviando(false);
          setErro("NEGOCIO");
          setRespondida(false); // rollback: só aqui
          onErroNegocio?.(body.error ?? "Não foi possível registrar sua resposta.");
          return;
        }

        // 5xx: retry silencioso
        throw new Error(`Servidor retornou ${res.status}`);
      } catch {
        // Erro de rede ou 5xx — retry sem mostrar nada para a usuária
        if (tentativa < MAX_TENTATIVAS) {
          timeoutRef.current = setTimeout(
            () => void enviarComRetry(payload, tentativa + 1),
            INTERVALO_BASE_MS * tentativa // backoff linear: 5s, 10s, 15s
          );
        } else {
          // Esgotou retries — falha silenciosa
          // Estado visual (respondida: true) mantido — scheduler reprocessa
          setEnviando(false);
          console.warn("[CopilotGuard] Resposta não registrada após 3 tentativas", {
            interacao_id: payload.interacao_id,
            tipo_resposta: payload.tipo_resposta,
          });
        }
      }
    },
    [onSucesso, onErroNegocio]
  );

  // SÍNCRONO — retorna void, nunca Promise
  // TypeScript garante: qualquer chamada `await responder(...)` é erro de tipo
  const responder = useCallback(
    (payload: RespostaPayload): void => {
      // Passo 1: estado visual imediato — < 16ms (síncrono, próximo frame)
      setRespondida(true);
      setEnviando(true);
      setErro(null);
      tentativasRef.current = 0;

      // Passo 2: POST fire-and-forget — void explícito documenta a intenção
      void enviarComRetry(payload, 1);
    },
    [enviarComRetry]
  );

  const resetar = useCallback((): void => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setRespondida(false);
    setEnviando(false);
    setErro(null);
    tentativasRef.current = 0;
  }, []);

  return { respondida, enviando, erro, responder, resetar };
}

// Uso correto em CheckinRotina:
//
//   const { responder } = useOptimisticResposta(() => colapsarCard())
//
//   const handleCheckin = (fezRotina: boolean): void => {
//     colapsarCard()           // visual imediato
//     responder({              // POST fire-and-forget
//       interacao_id,
//       tipo_resposta: 'CHECKIN_ROTINA',
//       valor: { fez_rotina: fezRotina, periodo }
//     })
//   }
