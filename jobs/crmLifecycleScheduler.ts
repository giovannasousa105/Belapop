/**
 * CRM Lifecycle Scheduler — fluxos de lifecycle baseados em comportamento.
 *
 * Crons:
 *   CARRINHO_ABANDONADO  — verificarCarrinhosAbandonados (enfileira via BullMQ interna)
 *   REATIVACAO           — verificarReativacao
 *   TIER_RISCO           — delegado ao popclubTierReview (via enviarTierRiscoRebaixamento)
 *
 * Em produção na Vercel Hobby: o crm-scheduler.ts (rota de cron) chama estas funções.
 * Em produção com BullMQ Pro: adicionar repeat jobs para frequências maiores.
 */

import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";

import { verificarCarrinhosAbandonados, verificarReativacao } from "@/lib/crm/flows/lifecycle";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const lifecycleQueue = new Queue("crm-lifecycle", { connection });

export const lifecycleWorker = new Worker(
  "crm-lifecycle",
  async (job: Job<{ tipo: string }>) => {
    const { tipo } = job.data;

    switch (tipo) {
      case "CARRINHO_ABANDONADO":
        await verificarCarrinhosAbandonados();
        break;
      case "REATIVACAO":
        await verificarReativacao();
        break;
      default:
        console.warn(`[crmLifecycle] Tipo desconhecido: ${tipo}`);
    }
  },
  { connection, concurrency: 2 }
);

/**
 * Inicializa crons internos via BullMQ repeat.
 * Usar em ambiente com BullMQ Pro — na Vercel Hobby, usar as rotas de cron.
 */
export async function iniciarLifecycleCrons() {
  await Promise.all([
    lifecycleQueue.add(
      "CARRINHO_ABANDONADO",
      { tipo: "CARRINHO_ABANDONADO" },
      { repeat: { pattern: "*/15 * * * *" } }
    ),
    lifecycleQueue.add(
      "REATIVACAO",
      { tipo: "REATIVACAO" },
      { repeat: { pattern: "0 10 * * *" } }
    ),
  ]);
  console.info("[crmLifecycle] Crons lifecycle registrados.");
}

if (require.main === module) {
  iniciarLifecycleCrons().catch(console.error);
}
