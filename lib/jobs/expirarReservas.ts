import { randomUUID } from "crypto";
import { logger } from "@/lib/logger";
import { expirarReservasVencidas, verificarEAplicarTransicao } from "@/lib/lote/loteService";
import { toLoteId } from "@/lib/lote/loteTypes";

export interface ExpiracaoResultado {
  total_expiradas:  number;
  lotes_afetados:   number;
  lote_ids:         string[];
  overflow:         boolean;
  duracao_ms:       number;
  erro:             string | null;
}

const TRANSICAO_TIMEOUT_MS = 20_000; // margem para Vercel (limite 25s)

function comTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms)
    ),
  ]);
}

export async function expirarReservas(): Promise<ExpiracaoResultado> {
  const run_id = randomUUID();
  const inicio = Date.now();

  try {
    // 1. Chamar RPC — SELECT FOR UPDATE SKIP LOCKED internamente
    const { lote_ids, overflow } = await expirarReservasVencidas(50);
    const total_expiradas = lote_ids.length; // RPC retorna 1 id por reserva

    // 2. Para cada lote: verificar transição com timeout
    const transicaoPromises = [...new Set(lote_ids)].map((id) =>
      comTimeout(
        verificarEAplicarTransicao(toLoteId(id)),
        TRANSICAO_TIMEOUT_MS
      ).catch((err) => {
        logger.warn({ job: "expirarReservas", lote_id: id, err: String(err), msg: "transição falhou — continuando" });
      })
    );

    // 3. allSettled — nunca rejeita mesmo se um lote falhar
    await Promise.allSettled(transicaoPromises);

    const lotes_ids_unicos = [...new Set(lote_ids)];
    const duracao_ms = Date.now() - inicio;

    if (overflow) {
      logger.warn({ job: "expirarReservas", run_id, msg: "overflow — ainda há reservas vencidas, próximo cron vai processar o restante" });
    }

    const resultado: ExpiracaoResultado = {
      total_expiradas,
      lotes_afetados: lotes_ids_unicos.length,
      lote_ids:       lotes_ids_unicos,
      overflow,
      duracao_ms,
      erro:           null,
    };

    logger.info({ job: "expirarReservas", run_id, resultado, duracao_ms });
    return resultado;

  } catch (err) {
    // Catch global — job NUNCA lança, sempre retorna ExpiracaoResultado
    const duracao_ms = Date.now() - inicio;
    logger.error({ job: "expirarReservas", run_id, err: err instanceof Error ? err.stack : String(err), duracao_ms });

    return {
      total_expiradas: 0,
      lotes_afetados:  0,
      lote_ids:        [],
      overflow:        false,
      duracao_ms,
      erro:            err instanceof Error ? err.message : String(err),
    };
  }
}
