/**
 * CRM Scheduler — dispara fluxos de e-mail baseados em tempo.
 *
 * Crons:
 *   CARRINHO_ABANDONADO  — a cada 15 min: detecta carrinhos abandonados há 1h e 24h
 *   REATIVACAO           — diário 10h UTC: detecta usuários inativos há 30d e 60d
 *   TIER_RISCO           — diário 9h UTC: delegado ao popclubTierReview
 *   LEMBRETE_SCAN        — diário 11h UTC: detecta scans > 42 dias (6 semanas)
 *   PROGRESSO_TWIN       — 1º de cada mês 8h UTC: relato mensal de progresso
 *   CHECKIN_SEMANAL      — toda segunda 8h UTC: check-in semanal de pele
 *   CURADORIA            — toda sexta 11h UTC: curadoria editorial semanal
 *   RECOMPRA             — diário 10h UTC: detecta produtos prestes a acabar
 */

import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  enviarCarrinhoAbandonado,
  enviarReativacao,
  enviarLembreteScan,
  enviarCheckinSemanal,
  enviarProgressoTwinMensal,
  enviarRecompraAssistida,
} from "@/lib/crm/crmEngine";

// ─── Redis ────────────────────────────────────────────────────────────────────

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ─── Queues ───────────────────────────────────────────────────────────────────

export const crmSchedulerQueue = new Queue("crm-scheduler", { connection });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nomeMes(data: Date): string {
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// Supabase tipifica joins como array mesmo para relações N:1.
// Este helper normaliza o resultado para objeto ou null.
function joinRow<T>(v: unknown): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return (v[0] as T | undefined) ?? null;
  return v as T;
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export const crmSchedulerWorker = new Worker(
  "crm-scheduler",
  async (job: Job<{ tipo: string; agora?: string }>) => {
    const { tipo } = job.data;
    const agora = job.data.agora ? new Date(job.data.agora) : new Date();
    const admin = getSupabaseAdminClient();

    switch (tipo) {
      case "CARRINHO_ABANDONADO_1H": {
        const limite1h = new Date(agora.getTime() - 60 * 60 * 1000).toISOString();
        const limite2h = new Date(agora.getTime() - 2 * 60 * 60 * 1000).toISOString();
        const { data: carrinhos } = await admin
          .from("carts")
          .select("user_id, profiles!inner(email), items, total_cents, id")
          .eq("status", "active")
          .lt("updated_at", limite1h)
          .gt("updated_at", limite2h)
          .not("user_id", "is", null);

        for (const c of carrinhos ?? []) {
          const email = joinRow<{ email: string }>(c.profiles)?.email;
          if (!email) continue;
          await enviarCarrinhoAbandonado(c.user_id as string, email, {
            itens: (c.items as { nome: string; foto: string | null; preco_cents: number }[]) ?? [],
            versao: "urgente",
            checkout_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?carrinho=${c.id}`,
          });
        }
        break;
      }

      case "CARRINHO_ABANDONADO_24H": {
        const limite24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const limite26h = new Date(agora.getTime() - 26 * 60 * 60 * 1000).toISOString();
        const { data: carrinhos } = await admin
          .from("carts")
          .select("user_id, profiles!inner(email), items, total_cents, id")
          .eq("status", "active")
          .lt("updated_at", limite24h)
          .gt("updated_at", limite26h)
          .not("user_id", "is", null);

        for (const c of carrinhos ?? []) {
          const email = joinRow<{ email: string }>(c.profiles)?.email;
          if (!email) continue;
          await enviarCarrinhoAbandonado(c.user_id as string, email, {
            itens: (c.items as { nome: string; foto: string | null; preco_cents: number }[]) ?? [],
            versao: "editorial",
            checkout_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?carrinho=${c.id}`,
          });
        }
        break;
      }

      case "REATIVACAO_30D": {
        const limite30d  = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const limite31d  = new Date(agora.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();
        const { data: usuarios } = await admin
          .from("profiles")
          .select("id, email, full_name, last_order_at")
          .lt("last_order_at", limite30d)
          .gt("last_order_at", limite31d)
          .not("email", "is", null);

        for (const u of usuarios ?? []) {
          await enviarReativacao(u.id as string, u.email as string, {
            nome: (u.full_name as string | null) ?? undefined,
            dias_inativo: 30,
            destaques: [],
          });
        }
        break;
      }

      case "REATIVACAO_60D": {
        const limite60d = new Date(agora.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const limite61d = new Date(agora.getTime() - 61 * 24 * 60 * 60 * 1000).toISOString();
        const { data: usuarios } = await admin
          .from("profiles")
          .select("id, email, full_name, last_order_at")
          .lt("last_order_at", limite60d)
          .gt("last_order_at", limite61d)
          .not("email", "is", null);

        for (const u of usuarios ?? []) {
          await enviarReativacao(u.id as string, u.email as string, {
            nome: (u.full_name as string | null) ?? undefined,
            dias_inativo: 60,
            destaques: [],
          });
        }
        break;
      }

      case "LEMBRETE_SCAN": {
        // Usuários que não fizeram scan há mais de 42 dias
        const limite42d = new Date(agora.getTime() - 42 * 24 * 60 * 60 * 1000).toISOString();
        const { data: twins } = await admin
          .from("skin_twins")
          .select("user_id, profiles!inner(email, full_name), ultimo_scan_em")
          .lt("ultimo_scan_em", limite42d)
          .not("user_id", "is", null);

        for (const t of twins ?? []) {
          const email = joinRow<{ email: string; full_name: string | null }>(t.profiles)?.email;
          if (!email) continue;
          const diasDesde = Math.floor(
            (agora.getTime() - new Date(t.ultimo_scan_em as string).getTime()) / 86_400_000
          );
          await enviarLembreteScan(t.user_id as string, email, {
            nome: joinRow<{ full_name: string | null }>(t.profiles)?.full_name ?? undefined,
            ultimo_scan_dias: diasDesde,
          });
        }
        break;
      }

      case "CHECKIN_SEMANAL": {
        // Todos os usuários ativos com preferência de receber e-mails de pele
        const { data: prefs } = await admin
          .from("crm_preferencias")
          .select("user_id, profiles!inner(email, full_name)")
          .eq("aceita_pele", true);

        for (const p of prefs ?? []) {
          const email = joinRow<{ email: string; full_name: string | null }>(p.profiles)?.email;
          if (!email) continue;
          await enviarCheckinSemanal(p.user_id as string, email, {
            nome: joinRow<{ full_name: string | null }>(p.profiles)?.full_name ?? undefined,
            consistencia_pct: 0,
            streak_semanas: 0,
            dica_semana: "",
          });
        }
        break;
      }

      case "PROGRESSO_TWIN_MENSAL": {
        const mesRef = nomeMes(agora);
        const { data: twins } = await admin
          .from("skin_twins")
          .select("user_id, profiles!inner(email, full_name), scores_historico")
          .not("user_id", "is", null);

        for (const t of twins ?? []) {
          const email = joinRow<{ email: string; full_name: string | null }>(t.profiles)?.email;
          if (!email) continue;
          await enviarProgressoTwinMensal(t.user_id as string, email, {
            nome: joinRow<{ full_name: string | null }>(t.profiles)?.full_name ?? undefined,
            mes_ref: mesRef,
            scores: {},
            evolucao: {},
            tipo_pele: "",
            ativos_top: [],
          });
        }
        break;
      }

      case "RECOMPRA_ASSISTIDA": {
        // Produtos da rotina do usuário com previsão de esgotamento em até 7 dias
        const { data: rotinas } = await admin
          .from("skin_twins")
          .select("user_id, profiles!inner(email, full_name), produtos_rotina")
          .not("produtos_rotina", "is", null);

        for (const r of rotinas ?? []) {
          const email = joinRow<{ email: string; full_name: string | null }>(r.profiles)?.email;
          if (!email) continue;
          const produtos = (r.produtos_rotina as {
            nome: string; foto: string | null; slug: string; preco_cents: number; dias_para_acabar?: number
          }[] | null) ?? [];
          const urgentes = produtos.filter((p) => (p.dias_para_acabar ?? 99) <= 7);
          if (urgentes.length === 0) continue;
          await enviarRecompraAssistida(r.user_id as string, email, {
            produto: urgentes[0],
            dias_para_acabar: urgentes[0].dias_para_acabar ?? 7,
          }, urgentes[0].slug);
        }
        break;
      }
    }
  },
  { connection, concurrency: 5 }
);

// ─── Crons ────────────────────────────────────────────────────────────────────

export async function iniciarCrons() {
  await Promise.all([
    crmSchedulerQueue.add("CARRINHO_ABANDONADO_1H",  { tipo: "CARRINHO_ABANDONADO_1H"  }, { repeat: { pattern: "*/15 * * * *" } }),
    crmSchedulerQueue.add("CARRINHO_ABANDONADO_24H", { tipo: "CARRINHO_ABANDONADO_24H" }, { repeat: { pattern: "*/15 * * * *" } }),
    crmSchedulerQueue.add("REATIVACAO_30D",          { tipo: "REATIVACAO_30D"          }, { repeat: { pattern: "0 10 * * *" } }),
    crmSchedulerQueue.add("REATIVACAO_60D",          { tipo: "REATIVACAO_60D"          }, { repeat: { pattern: "0 10 * * *" } }),
    crmSchedulerQueue.add("LEMBRETE_SCAN",           { tipo: "LEMBRETE_SCAN"           }, { repeat: { pattern: "0 11 * * *" } }),
    crmSchedulerQueue.add("CHECKIN_SEMANAL",         { tipo: "CHECKIN_SEMANAL"         }, { repeat: { pattern: "0 8 * * 1" } }),
    crmSchedulerQueue.add("PROGRESSO_TWIN_MENSAL",   { tipo: "PROGRESSO_TWIN_MENSAL"   }, { repeat: { pattern: "0 8 1 * *" } }),
    crmSchedulerQueue.add("RECOMPRA_ASSISTIDA",      { tipo: "RECOMPRA_ASSISTIDA"      }, { repeat: { pattern: "0 10 * * *" } }),
  ]);
}

if (require.main === module) {
  iniciarCrons().then(() => console.log("[crmScheduler] crons registrados"));
}
