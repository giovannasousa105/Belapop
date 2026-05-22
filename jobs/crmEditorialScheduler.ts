/**
 * CRM Editorial Scheduler — curadoria, lote esgotando, recompra assistida.
 *
 * Crons:
 *   CURADORIA_SEMANAL  — toda segunda às 8h
 *   RECOMPRA_ASSISTIDA — diário às 14h
 *   LOTE_ESGOTANDO     — disparado por evento (verificarEAplicarTransicao)
 *
 * Em produção na Vercel Hobby: as rotas de cron chamam as funções diretamente.
 * LOTE_ESGOTANDO: nunca via cron — sempre via evento do loteService.
 */

import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";

import { enviarCuradoriaSemanal, verificarRecompra } from "@/lib/crm/flows/editoriais";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const editorialQueue = new Queue("crm-editorial", { connection });

export const editorialWorker = new Worker(
  "crm-editorial",
  async (job: Job<{ tipo: string }>) => {
    const { tipo } = job.data;

    switch (tipo) {
      case "CURADORIA_SEMANAL":
        await enviarCuradoriaSemanal();
        break;
      case "RECOMPRA_ASSISTIDA":
        await verificarRecompra();
        break;
      default:
        console.warn(`[crmEditorial] Tipo desconhecido: ${tipo}`);
    }
  },
  { connection, concurrency: 3 }
);

/**
 * Inicializa crons editoriais via BullMQ repeat.
 */
export async function iniciarEditorialCrons() {
  await Promise.all([
    editorialQueue.add(
      "CURADORIA_SEMANAL",
      { tipo: "CURADORIA_SEMANAL" },
      { repeat: { pattern: "0 8 * * 1" } } // toda segunda
    ),
    editorialQueue.add(
      "RECOMPRA_ASSISTIDA",
      { tipo: "RECOMPRA_ASSISTIDA" },
      { repeat: { pattern: "0 14 * * *" } } // diário 14h
    ),
  ]);
  console.info("[crmEditorial] Crons editoriais registrados.");
}

if (require.main === module) {
  iniciarEditorialCrons().catch(console.error);
}
