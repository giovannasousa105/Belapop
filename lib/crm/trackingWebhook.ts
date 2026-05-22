import { Redis } from "ioredis";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EnvioStatus } from "./crmTypes";

export type ResendEventType =
  | "email.delivered"
  | "email.opened"
  | "email.clicked"
  | "email.bounced"
  | "email.spam_complained";

interface ResendWebhookEvent {
  type: ResendEventType;
  data: {
    email_id: string;
    from?: string;
    to?: string | string[];
    subject?: string;
    bounce?: { type?: "hard" | "soft" };
  };
}

const EVENT_STATUS: Partial<Record<ResendEventType, EnvioStatus>> = {
  "email.delivered": "ENTREGUE",
  "email.opened":    "ABERTO",
  "email.clicked":   "CLICADO",
  "email.bounced":   "BOUNCE",
  "email.spam_complained": "BOUNCE",
};

// Redis key para contador de soft bounces por email
function softBounceKey(email: string): string {
  return `crm:bounce:soft:${email}`;
}

const SOFT_BOUNCE_LIMITE = 3;
// TTL de 90 dias — janela de observação para soft bounces
const SOFT_BOUNCE_TTL_S = 90 * 24 * 3600;

export async function processarResendEvent(
  event: ResendWebhookEvent,
  redis?: Redis
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const provider_id = event.data.email_id;
  const status = EVENT_STATUS[event.type];

  if (!status) return;

  // Idempotência: buscar envio pelo provider_id do Resend
  const { data: envio } = await admin
    .from("crm_envios")
    .select("id, email, user_id, status, aberto_em, clicado_em")
    .eq("provider_id", provider_id)
    .maybeSingle();

  if (!envio) return; // envio não rastreado

  const agora = new Date().toISOString();

  // ── Atualização de status com idempotência ────────────────────────────────

  if (event.type === "email.delivered") {
    // Só avançar se status atual não é já ENTREGUE/ABERTO/CLICADO
    const statusAtual = envio.status as string;
    if (!["ENTREGUE", "ABERTO", "CLICADO"].includes(statusAtual)) {
      await admin.from("crm_envios").update({ status: "ENTREGUE" }).eq("id", envio.id as string);
    }
    return;
  }

  if (event.type === "email.opened") {
    // Idempotente: só registra a primeira abertura
    if (!(envio.aberto_em as string | null)) {
      await admin
        .from("crm_envios")
        .update({ status: "ABERTO", aberto_em: agora })
        .eq("id", envio.id as string)
        .is("aberto_em", null); // double-check no banco
    }
    return;
  }

  if (event.type === "email.clicked") {
    // Idempotente: só registra o primeiro clique
    if (!(envio.clicado_em as string | null)) {
      await admin
        .from("crm_envios")
        .update({ status: "CLICADO", clicado_em: agora })
        .eq("id", envio.id as string)
        .is("clicado_em", null);
    }
    return;
  }

  // ── Bounces ───────────────────────────────────────────────────────────────

  if (event.type === "email.bounced") {
    await admin.from("crm_envios").update({ status: "BOUNCE" }).eq("id", envio.id as string);

    const isBounceHard = event.data.bounce?.type === "hard" || event.data.bounce?.type === undefined;

    if (isBounceHard) {
      // Bounce hard → suprimir permanentemente (incluindo transacionais)
      await admin.from("crm_supressoes").upsert(
        {
          email: envio.email as string,
          user_id: (envio.user_id as string | null) ?? null,
          motivo: "BOUNCE_HARD",
          ativo: true,
        },
        { onConflict: "email, motivo, COALESCE(fluxo::text, '')", ignoreDuplicates: true }
      );
    } else {
      // Bounce soft → incrementar contador Redis; suprimir após SOFT_BOUNCE_LIMITE
      if (redis) {
        const key = softBounceKey(envio.email as string);
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, SOFT_BOUNCE_TTL_S);

        if (count >= SOFT_BOUNCE_LIMITE) {
          await admin.from("crm_supressoes").upsert(
            {
              email: envio.email as string,
              user_id: (envio.user_id as string | null) ?? null,
              motivo: "BOUNCE_SOFT_LIMITE",
              ativo: true,
            },
            { onConflict: "email, motivo, COALESCE(fluxo::text, '')", ignoreDuplicates: true }
          );
        }
      }
    }
    return;
  }

  // ── Spam complaint ────────────────────────────────────────────────────────

  if (event.type === "email.spam_complained") {
    await admin.from("crm_envios").update({ status: "BOUNCE" }).eq("id", envio.id as string);

    // 1. Registrar supressão permanente
    await admin.from("crm_supressoes").upsert(
      {
        email: envio.email as string,
        user_id: (envio.user_id as string | null) ?? null,
        motivo: "SPAM_REPORT",
        ativo: true,
      },
      { onConflict: "email, motivo, COALESCE(fluxo::text, '')", ignoreDuplicates: true }
    );

    // 2. Desabilitar todas as preferências de marketing (nunca desabilita transacional)
    if (envio.user_id) {
      await admin.from("crm_preferencias").upsert(
        {
          user_id: envio.user_id as string,
          aceita_lifecycle: false,
          aceita_pele: false,
          aceita_editorial: false,
          atualizado_em: agora,
        },
        { onConflict: "user_id" }
      );
    }
  }
}
