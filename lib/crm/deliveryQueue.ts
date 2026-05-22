import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { Resend } from "resend";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { verificarSupressao, registrarEnvio } from "./suppressionGuard";
import { renderizarTemplate } from "./templateRenderer";
import { FLUXO_GRUPO, type EnfileirarParams, type FluxoEnum } from "./crmTypes";

// ─── Conexão Redis ────────────────────────────────────────────────────────────

function resolveRedisUrl(): string | null {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) return null;

  if (
    process.env.NODE_ENV === "production" &&
    /(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(redisUrl)
  ) {
    console.warn("[deliveryQueue] REDIS_URL local ignorado em producao.");
    return null;
  }

  return redisUrl;
}

const redisUrl = resolveRedisUrl();

export const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    })
  : null;

// ─── Resend ───────────────────────────────────────────────────────────────────

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.CRM_FROM_EMAIL ?? "BelaPop <noreply@belapopoficial.com.br>";

// ─── Queue ────────────────────────────────────────────────────────────────────

export const emailQueue = redis ? new Queue("crm-emails", { connection: redis }) : null;

// ─── enfileirar ───────────────────────────────────────────────────────────────

export async function enfileirar(params: EnfileirarParams): Promise<string | null> {
  if (!redis || !emailQueue) {
    console.warn("[deliveryQueue] Redis indisponivel; email não enfileirado.", {
      fluxo: params.fluxo,
    });
    return null;
  }

  const admin = getSupabaseAdminClient();
  const agora = new Date();
  const grupo = FLUXO_GRUPO[params.fluxo];

  const check = await verificarSupressao(
    params.email, params.user_id, params.fluxo, grupo, agora, redis, params.produto_id
  );

  if (!check.permitido) {
    // Reagendar se fora do horário — não descartar
    if (check.reagendar_em && !params.agendado_para) {
      return enfileirar({ ...params, agendado_para: check.reagendar_em });
    }
    return null;
  }

  // INSERT crm_envios
  const { data: row, error } = await admin
    .from("crm_envios")
    .insert({
      user_id: params.user_id,
      email: params.email,
      fluxo: params.fluxo,
      grupo,
      template_id: params.template_id,
      subject: params.subject,
      metadata: params.metadata,
      agendado_para: params.agendado_para?.toISOString() ?? null,
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[deliveryQueue] insert crm_envios falhou", error?.message);
    return null;
  }

  const envio_id = row.id as string;
  const delayMs = params.agendado_para
    ? Math.max(0, params.agendado_para.getTime() - Date.now())
    : 0;

  await emailQueue.add(
    "send-email",
    { envio_id },
    {
      delay: delayMs,
      attempts: 3,
      backoff: { type: "exponential", delay: 60_000 },
      removeOnComplete: 20,
      removeOnFail: 50,
    }
  );

  await registrarEnvio(params.user_id, params.fluxo, redis, agora, params.produto_id);
  return envio_id;
}

// ─── Worker ───────────────────────────────────────────────────────────────────

async function tentarSendGrid(
  to: string,
  subject: string,
  html: string,
  envio_id: string
): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return false;
  try {
    // Importação dinâmica — @sendgrid/mail é opcional
    const fromMatch = FROM.match(/^(.*)<([^>]+)>$/);
    const fromEmail = fromMatch?.[2]?.trim() ?? FROM;
    const fromName = fromMatch?.[1]?.trim() || "BelaPop";
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [{ type: "text/html", value: html }],
        headers: { "X-Envio-Id": envio_id },
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export const emailWorker = redis ? new Worker(
  "crm-emails",
  async (job: Job<{ envio_id: string }>) => {
    const { envio_id } = job.data;
    const admin = getSupabaseAdminClient();

    const { data: envio } = await admin
      .from("crm_envios")
      .select("*")
      .eq("id", envio_id)
      .single();

    if (!envio) throw new Error(`envio_id não encontrado: ${envio_id}`);
    // Idempotência: se já enviado por retry anterior, sair sem re-enviar
    if ((envio.status as string) !== "ENFILEIRADO") return;

    const metadata = (envio.metadata as Record<string, unknown>) ?? {};
    // job.attemptsMade é 0-indexed; com attempts:3 a última tentativa é index 2
    const isUltimaTentativa = job.attemptsMade >= 2;

    await admin
      .from("crm_envios")
      .update({ tentativas: (envio.tentativas as number) + 1 })
      .eq("id", envio_id);

    const html = await renderizarTemplate(envio.template_id as string, metadata);

    // ── Tentativa Resend ──────────────────────────────────────────────────────
    let resendErroMsg: string | null = null;
    if (resend) {
      const { data: sent, error: resendError } = await resend.emails.send({
        from: FROM,
        to: envio.email as string,
        subject: envio.subject as string,
        html,
        headers: { "X-Envio-Id": envio_id },
      });

      if (!resendError && sent?.id) {
        await admin.from("crm_envios").update({
          status: "ENVIADO",
          provider_id: sent.id,
          enviado_em: new Date().toISOString(),
        }).eq("id", envio_id);
        return; // sucesso
      }

      resendErroMsg = resendError?.message ?? "Resend: resposta vazia";
    } else {
      resendErroMsg = "RESEND_API_KEY não configurada";
    }

    // ── Fallback SendGrid — apenas na última tentativa ────────────────────────
    if (isUltimaTentativa) {
      const sgOk = await tentarSendGrid(
        envio.email as string,
        envio.subject as string,
        html,
        envio_id
      );

      if (sgOk) {
        await admin.from("crm_envios").update({
          status: "ENVIADO",
          enviado_em: new Date().toISOString(),
          metadata: { ...metadata, provider: "sendgrid" },
        }).eq("id", envio_id);
        await registrarEnvio(
          (envio.user_id as string) ?? "",
          envio.fluxo as FluxoEnum,
          redis,
          new Date()
        );
        return; // sucesso via SendGrid
      }

      // Ambos falharam — marcar FALHOU sem throw (evita retry infinito = spam)
      await admin.from("crm_envios").update({
        status: "FALHOU",
        erro: `${resendErroMsg} · SendGrid também falhou`,
      }).eq("id", envio_id);
      return;
    }

    // Não é a última tentativa — throw para BullMQ retentar
    // NÃO seta status FALHOU aqui, pois isso bloquearia o próximo retry
    await admin.from("crm_envios").update({ erro: resendErroMsg }).eq("id", envio_id);
    throw new Error(resendErroMsg ?? "Falha no envio");
  },
  { connection: redis, concurrency: 20 }
) : null;
