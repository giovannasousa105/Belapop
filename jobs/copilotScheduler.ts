/**
 * Skin Copilot — scheduler + workers BullMQ
 *
 * Queues:
 *   copilot-hourly-decisions  → roda a cada hora; decide quem recebe o quê
 *   copilot-messages          → gera e entrega cada mensagem (concorrência 10)
 *   copilot-responses         → processa respostas das usuárias (async)
 *
 * Iniciar: node -r ts-node/register jobs/copilotScheduler.ts
 */

import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import Anthropic from "@anthropic-ai/sdk";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { decidirInteracaoDoDia } from "@/lib/copilot/copilotDecisionEngine";
import {
  registrarEnvio,
  registrarNudgeProduto,
  incrementarConsistenciaSemanal,
  calcularConsistenciaSemanalPct,
  recompraRecusadaKey,
} from "@/lib/copilot/cooldownGuard";
import { estimarFimDeProduto } from "@/lib/copilot/cadenceCalendar";
import { calcularHorarioAgendamento } from "@/lib/copilot/cadenceCalendar";
import type {
  CopilotConfig,
  CopilotSeed,
  DecisaoContexto,
  InteracaoDecidida,
  MensagemGerada,
  RespostaTipo,
} from "@/lib/copilot/copilotTypes";

// ─── Conexão Redis compartilhada ──────────────────────────────────────────────

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const SEED_CACHE_TTL = 300; // 5 minutos
const PAGE_SIZE = 500;

// ─── Queues ───────────────────────────────────────────────────────────────────

export const decisaoQueue = new Queue("copilot-hourly-decisions", { connection });
export const mensagemQueue = new Queue("copilot-messages", { connection });
export const respostaQueue = new Queue("copilot-responses", { connection });

// ─── Inicializar job repetível ────────────────────────────────────────────────

export async function iniciarCopilotScheduler(): Promise<void> {
  await decisaoQueue.add(
    "copilot-hourly-decisions",
    {},
    {
      repeat: { pattern: "0 * * * *" },
      removeOnComplete: 10,
      removeOnFail: 50,
    }
  );
  console.log("[copilot-scheduler] job repetível registrado (0 * * * *)");
}

// ─── Claude (opcional) ────────────────────────────────────────────────────────

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── Worker: decisão horária ──────────────────────────────────────────────────

export const decisaoWorker = new Worker(
  "copilot-hourly-decisions",
  async (_job: Job) => {
    const admin = getSupabaseAdminClient();
    const agora = new Date();
    let offset = 0;

    while (true) {
      const { data: configs, error } = await admin
        .from("copilot_configs")
        .select("*")
        .eq("ativo", true)
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw new Error(`[copilot] fetch configs: ${error.message}`);
      if (!configs || configs.length === 0) break;

      // Processar configs em paralelo — cada uma já é independente
      await Promise.allSettled(
        (configs as CopilotConfig[]).map((c) => processarConfig(c, agora))
      );

      if (configs.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  },
  { connection, concurrency: 1 }
);

// ─── Buscar CopilotSeed (cache Redis 5 min) ───────────────────────────────────

async function obterSeed(twin_id: string): Promise<CopilotSeed | null> {
  const key = `copilot:seed:${twin_id}`;
  const cached = await connection.get(key);
  if (cached) return JSON.parse(cached) as CopilotSeed;

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("skin_twins")
    .select("copilot_seed")
    .eq("id", twin_id)
    .single();

  if (error || !data?.copilot_seed) return null;

  const seed = data.copilot_seed as CopilotSeed;
  await connection.set(key, JSON.stringify(seed), "EX", SEED_CACHE_TTL);
  return seed;
}

// ─── Buscar contexto de decisão para uma usuária ──────────────────────────────
// Nota: usa N consultas por usuária — em produção substituir por RPC único.

async function obterContexto(
  config: CopilotConfig,
  consistenciaPct: number
): Promise<DecisaoContexto> {
  const admin = getSupabaseAdminClient();

  const [checkinResult, pedidosResult, marcoResult] = await Promise.all([
    // Último check-in respondido
    admin
      .from("copilot_respostas")
      .select("criado_em")
      .eq("user_id", config.user_id)
      .eq("tipo_resposta", "CHECKIN_ROTINA")
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Pedidos entregues nos últimos 120 dias com duração definida
    admin
      .from("pedidos")
      .select("id, criado_em")
      .eq("user_id", config.user_id)
      .eq("status", "ENTREGUE")
      .gte("criado_em", new Date(Date.now() - 120 * 86400000).toISOString()),

    // Último tipo de interação MARCO_ALCANCADO enviado
    admin
      .from("copilot_interacoes")
      .select("tipo")
      .eq("user_id", config.user_id)
      .eq("tipo", "MARCO_ALCANCADO")
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const diasDesdeUltimoCheckin = checkinResult.data
    ? Math.floor(
        (Date.now() - new Date(checkinResult.data.criado_em as string).getTime()) / 86400000
      )
    : 999;

  const produtosAcabando: string[] = [];
  if (pedidosResult.data && pedidosResult.data.length > 0) {
    for (const pedido of pedidosResult.data) {
      const { data: itens } = await admin
        .from("pedido_itens")
        .select("produto_id, produtos(id, duracao_media_dias)")
        .eq("pedido_id", pedido.id as string);

      for (const item of itens ?? []) {
        // A join pode ser objeto ou array dependendo da relação FK no schema
        const raw = item.produtos as unknown;
        const produto = (Array.isArray(raw) ? raw[0] : raw) as {
          id: string;
          duracao_media_dias?: number;
        } | null;
        if (!produto?.duracao_media_dias) continue;

        const { acabando } = estimarFimDeProduto({
          produto_id: produto.id,
          data_compra: new Date(pedido.criado_em as string),
          duracao_media_dias: produto.duracao_media_dias,
          consistencia_pct: consistenciaPct,
        });

        if (acabando) produtosAcabando.push(produto.id);
      }
    }
  }

  return {
    diasDesdeUltimoCheckin,
    produtosAcabando: [...new Set(produtosAcabando)],
    ultimoInsightTipoNotificado: (marcoResult.data?.tipo as string) ?? null,
    consistenciaSemanalPct: consistenciaPct,
  };
}

// ─── Processar config de uma usuária ─────────────────────────────────────────

async function processarConfig(config: CopilotConfig, agora: Date): Promise<void> {
  if (!config.twin_id) return;

  try {
    const seed = await obterSeed(config.twin_id);
    if (!seed) return;

    const consistenciaPct = await calcularConsistenciaSemanalPct(
      config.user_id,
      connection,
      agora
    );
    const contexto = await obterContexto(config, consistenciaPct);
    const interacao = await decidirInteracaoDoDia(config, seed, contexto, connection, agora);
    if (!interacao) return;

    // Persiste interação antes de gerar mensagem — status FALHOU em caso de erro
    // payload.metadata guarda o contexto da decisão (produto_id etc.) para a UI
    const admin = getSupabaseAdminClient();
    const { data: row, error: insertErr } = await admin
      .from("copilot_interacoes")
      .insert({
        user_id: config.user_id,
        twin_id: config.twin_id,
        tipo: interacao.tipo,
        canal: config.canal_preferido,
        status: "ENVIADA",
        seed_snapshot: seed as unknown as Record<string, unknown>,
        payload: { metadata: interacao.contexto },
      })
      .select("id")
      .single();

    if (insertErr || !row) {
      console.error("[copilot] insert interacao falhou", insertErr?.message);
      return;
    }

    const delayMs = Math.max(0, interacao.agendado_para.getTime() - Date.now());

    await mensagemQueue.add(
      "gerar-e-entregar",
      { interacao_id: row.id as string, interacao, seed },
      {
        delay: delayMs,
        removeOnComplete: 20,
        removeOnFail: 50,
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
      }
    );

    // Registrar cooldown apenas para NUDGE_RECOMPRA por produto
    if (interacao.tipo === "NUDGE_RECOMPRA") {
      const produto_id = interacao.contexto["produto_id"] as string | undefined;
      if (produto_id) {
        await registrarNudgeProduto(config.user_id, produto_id, connection, agora);
      }
    } else {
      await registrarEnvio(config.user_id, interacao.tipo, connection, agora);
    }
  } catch (err) {
    console.error("[copilot] processarConfig error", {
      user_id: config.user_id,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

// ─── Worker: geração e entrega de mensagens ───────────────────────────────────

type MensagemJobData = {
  interacao_id: string;
  interacao: InteracaoDecidida;
  seed: CopilotSeed;
};

export const mensagemWorker = new Worker(
  "copilot-messages",
  async (job: Job<MensagemJobData>) => {
    const { interacao_id, interacao, seed } = job.data;
    const admin = getSupabaseAdminClient();

    try {
      const mensagem = interacao.requer_claude
        ? await gerarMensagemClaude(interacao, seed)
        : gerarMensagemTemplate(interacao, seed);

      // Mescla metadata do contexto (produto_id etc.) com a mensagem gerada
      const payloadFinal = {
        ...mensagem,
        metadata: { ...interacao.contexto, ...(mensagem.metadata ?? {}) },
      };

      await Promise.all([
        admin
          .from("copilot_interacoes")
          .update({
            payload: payloadFinal as unknown as Record<string, unknown>,
            status: "ENTREGUE",
          })
          .eq("id", interacao_id),
        entregarMensagem(interacao, mensagem),
      ]);
    } catch (err) {
      await admin
        .from("copilot_interacoes")
        .update({ status: "FALHOU" })
        .eq("id", interacao_id);
      throw err;
    }
  },
  { connection, concurrency: 10 }
);

// ─── Templates locais (requer_claude: false) ──────────────────────────────────
// Fallback de Claude API — nunca bloqueia LEMBRETE.

function gerarMensagemTemplate(
  interacao: InteracaoDecidida,
  seed: CopilotSeed
): MensagemGerada {
  switch (interacao.tipo) {
    case "LEMBRETE_MANHA":
      return {
        titulo: "Bom dia",
        corpo: seed.mensagemMotivacionalCurta,
        cta: "Ver rotina manhã",
      };
    case "LEMBRETE_NOITE":
      return {
        titulo: "Hora da rotina noturna",
        corpo: "Sua pele se regenera durante o sono. Reserve 3 minutos agora.",
        cta: "Ver rotina noite",
      };
    case "LEMBRETE_SCAN": {
      const dias = interacao.contexto["dias_desde_scan"] as number | undefined;
      return {
        titulo: "Novo scan recomendado",
        corpo: `Já faz ${dias ?? "algumas semanas"} dias desde sua última leitura de pele.`,
        cta: "Fazer scan agora",
      };
    }
    default:
      return {
        titulo: "BelaPop Skin Copilot",
        corpo: seed.mensagemMotivacionalCurta,
      };
  }
}

// ─── Geração Claude com timeout 8s + fallback ─────────────────────────────────
// Falha no Claude nunca bloqueia entrega — cai para template.

async function gerarMensagemClaude(
  interacao: InteracaoDecidida,
  seed: CopilotSeed
): Promise<MensagemGerada> {
  const TIMEOUT_MS = 8000;
  const fallback = gerarMensagemTemplate(interacao, seed);

  if (!anthropic) return fallback;

  try {
    const result = await Promise.race<MensagemGerada>([
      (async () => {
        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{ role: "user", content: buildPrompt(interacao, seed) }],
        });
        const text =
          response.content[0]?.type === "text" ? response.content[0].text.trim() : null;
        if (!text) return fallback;
        return JSON.parse(text) as MensagemGerada;
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("CLAUDE_TIMEOUT")), TIMEOUT_MS)
      ),
    ]);
    return result;
  } catch {
    return fallback;
  }
}

function buildPrompt(interacao: InteracaoDecidida, seed: CopilotSeed): string {
  return `Você é o Skin Copilot da BelaPop. Gere uma mensagem de skincare em JSON.

Tipo: ${interacao.tipo}
Foco da pele: ${seed.marcadorFoco}
Insight atual: ${seed.ultimoInsightTipo}
Mensagem base: "${seed.mensagemMotivacionalCurta}"
Contexto: ${JSON.stringify(interacao.contexto)}

Retorne APENAS JSON válido:
{"titulo":"...","corpo":"...","cta":"..."}

Regras: português do Brasil elegante • titulo ≤ 40 chars • corpo ≤ 120 chars • cta ≤ 25 chars • nunca linguagem médica`;
}

// ─── Entrega por canal ────────────────────────────────────────────────────────

async function entregarMensagem(
  interacao: InteracaoDecidida,
  mensagem: MensagemGerada
): Promise<void> {
  const { canal_preferido, aceita_push, aceita_email, user_id } = interacao.config;

  if (canal_preferido === "push" && aceita_push) {
    // TODO: integrar com FCM / Expo Notifications
    console.log("[copilot] push placeholder", { user_id, titulo: mensagem.titulo });
    return;
  }

  if (canal_preferido === "email" && aceita_email) {
    // TODO: integrar com Resend / SendGrid
    console.log("[copilot] email placeholder", { user_id, titulo: mensagem.titulo });
    return;
  }

  // in_app: já persistido em copilot_interacoes — UI lê via GET /api/copilot/checkin
}

// ─── Worker: processamento de respostas (async) ───────────────────────────────

type RespostaJobData = {
  resposta_id: string;
  interacao_id: string;
  user_id: string;
  tipo_resposta: RespostaTipo;
  valor: Record<string, unknown>;
};

export const respostaWorker = new Worker(
  "copilot-responses",
  async (job: Job<RespostaJobData>) => {
    const { resposta_id, user_id, tipo_resposta, valor } = job.data;
    const admin = getSupabaseAdminClient();
    const agora = new Date();

    try {
      switch (tipo_resposta) {
        case "CHECKIN_ROTINA": {
          const fezRotina = valor["fez_rotina"] as boolean;
          const periodo = valor["periodo"] as "manha" | "noite";
          if (fezRotina) {
            await incrementarConsistenciaSemanal(user_id, periodo, connection, agora);
          }
          break;
        }

        case "NOTA_PELE": {
          const nota = Number(valor["nota"]);
          await admin
            .from("copilot_notas_pele")
            .insert({ user_id, nota: Math.round(nota) });

          // Verificar se nota <= 2 por 3 dias seguidos → antecipar CHECKIN_SEMANAL
          const { data: notas } = await admin
            .from("copilot_notas_pele")
            .select("nota, criado_em")
            .eq("user_id", user_id)
            .gte("criado_em", new Date(Date.now() - 3 * 86400000).toISOString())
            .order("criado_em", { ascending: false })
            .limit(3);

          if (notas && notas.length >= 3 && notas.every((n) => (n.nota as number) <= 2)) {
            // Remover cooldown para permitir checkin antecipado
            await connection.del(`copilot:cooldown:${user_id}:CHECKIN_SEMANAL`);
          }
          break;
        }

        case "RECOMPRA_ACEITA": {
          // Reservar lote e criar checkout — a resposta inclui produto_id
          // A integração com o lote usa o fluxo reservarLote existente
          const produto_id = valor["produto_id"] as string | undefined;
          if (produto_id) {
            // Buscar lote ativo para o produto
            const { data: lote } = await admin
              .from("lotes")
              .select("id")
              .eq("produto_id", produto_id)
              .eq("status", "ativo")
              .gt("qtd_disponivel", 0)
              .order("criado_em", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lote?.id) {
              // A URL de checkout é gerada no lado do cliente — apenas marcamos o lote
              console.log("[copilot] recompra aceita, lote_id:", lote.id, "produto:", produto_id);
            }
          }
          break;
        }

        case "RECOMPRA_RECUSADA": {
          const produto_id = valor["produto_id"] as string | undefined;
          if (produto_id) {
            const TTL_30_DIAS = 30 * 24 * 3600;
            await connection.set(
              recompraRecusadaKey(user_id, produto_id),
              "1",
              "EX",
              TTL_30_DIAS
            );
          }
          break;
        }

        case "SCAN_AGENDADO": {
          const dataStr = valor["data_pretendida"] as string | undefined;
          if (dataStr) {
            const dataAgendada = new Date(dataStr);
            const umDiaAntes = new Date(dataAgendada.getTime() - 86400000);

            // Atualizar proximo_scan_em no twin (se existir)
            await admin
              .from("skin_twins")
              .update({ proximo_scan_em: dataAgendada.toISOString() })
              .eq("user_id", user_id);

            // Remover cooldown de LEMBRETE_SCAN para agendamento específico
            await connection.del(`copilot:cooldown:${user_id}:LEMBRETE_SCAN`);

            // Buscar config para agendar lembrete 1 dia antes
            const { data: cfg } = await admin
              .from("copilot_configs")
              .select("horario_manha, timezone")
              .eq("user_id", user_id)
              .single();

            if (cfg) {
              const horario = calcularHorarioAgendamento({
                horarioBase: cfg.horario_manha as string,
                timezone: cfg.timezone as string,
                agora: umDiaAntes,
              });
              const delayMs = Math.max(0, horario.getTime() - Date.now());
              await decisaoQueue.add(
                "lembrete-scan-agendado",
                { user_id, tipo: "LEMBRETE_SCAN" },
                { delay: delayMs, removeOnComplete: 5 }
              );
            }
          }
          break;
        }

        case "DESCARTADA":
          // Sem ação — interação apenas marcada como respondida
          break;
      }

      // Marcar resposta como processada
      await admin
        .from("copilot_respostas")
        .update({ processada: true })
        .eq("id", resposta_id);
    } catch (err) {
      console.error("[copilot] processamento resposta erro", {
        resposta_id,
        tipo_resposta,
        error: err instanceof Error ? err.message : "unknown",
      });
      throw err; // BullMQ re-tenta
    }
  },
  { connection, concurrency: 5 }
);

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown() {
  console.log("[copilot] encerrando workers...");
  await Promise.all([
    decisaoWorker.close(),
    mensagemWorker.close(),
    respostaWorker.close(),
  ]);
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

// Inicializar ao rodar diretamente
if (require.main === module) {
  void iniciarCopilotScheduler().catch(console.error);
}
