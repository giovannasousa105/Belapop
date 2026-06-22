import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { deliverEmailNotification, deliverWhatsAppNotification } from "@/lib/notifications/providers";
import { signUnsubscribeToken, buildUnsubscribeUrl } from "@/lib/circulo/jwt";
import { renderCirculoBoasVindas } from "@/lib/circulo/renderEmail";
import { buildWelcomeWhatsApp } from "@/lib/circulo/welcome-message";
import { getSubgroupRoute } from "@/lib/circulo/subgroup-routing";

export const runtime = "nodejs";
export const maxDuration = 20;

// ── Validação ─────────────────────────────────────────────────────────────────

/** Normaliza número para E.164 brasileiro: +55XXXXXXXXXXX */
function normalizeWhatsappBR(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // Aceita 10 ou 11 dígitos (sem DDI) ou com DDI 55 (12 ou 13 dígitos)
  if (digits.length === 11 || digits.length === 10) return `+55${digits}`;
  if ((digits.length === 13 || digits.length === 12) && digits.startsWith("55")) return `+${digits}`;
  return null;
}

const CONCERN_LABELS: Record<string, string> = {
  acne: "Acne e cravos",
  spots: "Manchas e tom desigual",
  barrier: "Barreira sensibilizada",
  aging: "Linhas finas e firmeza",
  shine: "Brilho e poros",
  unsure: "Ainda estou descobrindo",
};

const SubscribeSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres.").max(120),
  email: z
    .string()
    .email("Informe um e-mail válido.")
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  whatsapp: z
    .string()
    .min(10, "WhatsApp inválido.")
    .max(20)
    .refine((v) => normalizeWhatsappBR(v) !== null, { message: "Número de WhatsApp inválido. Use o formato (11) 99999-9999." }),
  skin_concern: z.enum(["acne", "spots", "barrier", "aging", "shine", "unsure"], {
    message: "Selecione uma opção de preocupação.",
  }),
  spend_range: z.enum(["lt150", "150_300", "300_600", "gt600"], {
    message: "Selecione uma faixa de investimento.",
  }),
  consent_skin_data: z.boolean().refine((value) => value === true, {
    message: "Autorize o uso dos dados de pele para a curadoria.",
  }),
  consent_marketing: z.boolean().refine((value) => value === true, {
    message: "Aceite receber comunicações do Círculo por WhatsApp e e-mail.",
  }),
  consent_terms: z.boolean().refine((value) => value === true, {
    message: "Aceite os Termos de Uso do Círculo BelaPop.",
  }),
  declared_over_18: z.boolean().refine((value) => value === true, {
    message: "Confirme que você tem 18 anos ou mais.",
  }),
  source: z.string().max(80).default("website_footer_form"),
});

type SubscribeInput = z.infer<typeof SubscribeSchema>;

// ── Helpers de notificação ────────────────────────────────────────────────────

async function sendWelcomeEmail(
  member: { id: string; name: string; email: string; skin_concern: string }
): Promise<void> {
  const token = await signUnsubscribeToken(member.id);
  const unsubscribeUrl = buildUnsubscribeUrl(token);
  const concernLabel = CONCERN_LABELS[member.skin_concern] ?? "skincare em geral";
  const subgroup = getSubgroupRoute(member.skin_concern);

  let html: string;
  try {
    html = await renderCirculoBoasVindas({
      nome: member.name,
      skin_concern_label: concernLabel,
      unsubscribe_url: unsubscribeUrl,
      subgroup_url: subgroup.url,
      subgroup_label: subgroup.label,
    });
  } catch (renderErr) {
    console.error("[círculo/subscribe] Falha ao renderizar email:", renderErr);
    html = `<p>Olá ${member.name}, você está no Círculo BelaPop. Em breve o próximo drop chegará no seu WhatsApp.</p>`;
  }

  const result = await deliverEmailNotification({
    to: member.email,
    subject: `${member.name}, você está no Círculo BelaPop`,
    body: `Olá ${member.name},\n\nVocê está no Círculo BelaPop. Em breve o próximo drop chegará no seu WhatsApp.`,
    html,
  });

  if (!result.ok) {
    console.warn("[círculo/subscribe] Falha ao enviar email de boas-vindas:", result.error);
  } else {
    // Registrar envio no banco
    const supabase = getSupabaseAdminClient();
    await supabase
      .from("circulo_members")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", member.id);
  }
}

async function sendWelcomeWhatsApp(
  member: { id: string; name: string; whatsapp_e164: string; skin_concern: string }
): Promise<void> {
  const message = buildWelcomeWhatsApp(member.name, member.skin_concern);

  const result = await deliverWhatsAppNotification({
    to: member.whatsapp_e164,
    body: message,
  });

  if (!result.ok) {
    console.warn("[círculo/subscribe] Falha ao enviar WhatsApp de boas-vindas:", result.error);
    // Enfileirar para envio manual (Redis se disponível, senão só loga)
    try {
      const redisUrl = process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_REST_URL;
      if (redisUrl) {
        // Enfileirar via fetch simples (Upstash HTTP API)
        // Formato: LPUSH circulo:whatsapp:pending <json>
        const payload = JSON.stringify({ member_id: member.id, to: member.whatsapp_e164, body: message, queued_at: new Date().toISOString() });
        await fetch(`${redisUrl}/lpush/círculo:whatsapp:pending/${encodeURIComponent(payload)}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN ?? ""}` },
        }).catch(() => {});
      }
    } catch { /* silencioso */ }
    return;
  }

  // Registrar envio no banco
  const supabase = getSupabaseAdminClient();
  await supabase
    .from("circulo_members")
    .update({ welcome_whatsapp_sent_at: new Date().toISOString() })
    .eq("id", member.id);
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Parse e validação
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data: SubscribeInput = parsed.data;
  const whatsapp_e164 = normalizeWhatsappBR(data.whatsapp)!;

  // 2. Inserir no banco (idempotente por email)
  const supabase = getSupabaseAdminClient();
  const payload = {
    name: data.name.trim(),
    email: data.email,
    whatsapp_e164,
    skin_concern: data.skin_concern,
    spend_range: data.spend_range,
    source: data.source,
    consent_lgpd: true,
    consent_skin_data: data.consent_skin_data,
    consent_marketing: data.consent_marketing,
    consent_terms: data.consent_terms,
    declared_over_18: data.declared_over_18,
    consent_at: new Date().toISOString(),
    unsubscribed_at: null,
  };

  // Tenta insert; se já existe (23505), faz update pelo email
  let member: { id: string; name: string; email: string; whatsapp_e164: string; skin_concern: string; welcome_email_sent_at: string | null; welcome_whatsapp_sent_at: string | null } | null = null;

  const insertMember = async (useLegacyPayload = false) => {
    const insertPayload = useLegacyPayload
      ? {
          name: payload.name,
          email: payload.email,
          whatsapp_e164: payload.whatsapp_e164,
          skin_concern: payload.skin_concern,
          spend_range: payload.spend_range,
          source: payload.source,
          consent_lgpd: payload.consent_lgpd,
          consent_marketing: payload.consent_marketing,
          consent_at: payload.consent_at,
          unsubscribed_at: payload.unsubscribed_at,
        }
      : payload;

    return supabase
      .from("circulo_members")
      .insert(insertPayload)
      .select("id, name, email, whatsapp_e164, skin_concern, welcome_email_sent_at, welcome_whatsapp_sent_at")
      .single();
  };

  let { data: inserted, error: insertError } = await insertMember();

  if (insertError?.code === "PGRST204") {
    console.warn("[círculo/subscribe] Colunas novas de consentimento ausentes; usando payload legado até migração.");
    ({ data: inserted, error: insertError } = await insertMember(true));
  }

  if (insertError) {
    if (insertError.code === "23505") {
      // Email já existe — atualiza dados e reativa
      const { data: updated, error: updateError } = await supabase
        .from("circulo_members")
        .update({
          name: payload.name,
          whatsapp_e164: payload.whatsapp_e164,
          skin_concern: payload.skin_concern,
          spend_range: payload.spend_range,
          consent_skin_data: payload.consent_skin_data,
          consent_marketing: payload.consent_marketing,
          consent_terms: payload.consent_terms,
          declared_over_18: payload.declared_over_18,
          unsubscribed_at: null,
        })
        .eq("email", data.email)
        .select("id, name, email, whatsapp_e164, skin_concern, welcome_email_sent_at, welcome_whatsapp_sent_at")
        .single();

      if (updateError?.code === "PGRST204") {
        console.warn("[círculo/subscribe] Colunas novas de consentimento ausentes no update; usando payload legado até migração.");
        const { data: legacyUpdated, error: legacyUpdateError } = await supabase
          .from("circulo_members")
          .update({
            name: payload.name,
            whatsapp_e164: payload.whatsapp_e164,
            skin_concern: payload.skin_concern,
            spend_range: payload.spend_range,
            consent_marketing: payload.consent_marketing,
            unsubscribed_at: null,
          })
          .eq("email", data.email)
          .select("id, name, email, whatsapp_e164, skin_concern, welcome_email_sent_at, welcome_whatsapp_sent_at")
          .single();

        if (legacyUpdateError || !legacyUpdated) {
          console.error("[círculo/subscribe] Erro ao atualizar membro existente:", legacyUpdateError?.message);
          return NextResponse.json({ error: "Não foi possível registrar sua inscrição. Tente novamente." }, { status: 500 });
        }
        member = legacyUpdated;
      } else if (updateError || !updated) {
        console.error("[círculo/subscribe] Erro ao atualizar membro existente:", updateError?.message);
        return NextResponse.json({ error: "Não foi possível registrar sua inscrição. Tente novamente." }, { status: 500 });
      } else {
        member = updated;
      }
    } else {
      console.error("[círculo/subscribe] Erro ao inserir membro:", insertError.message);
      return NextResponse.json({ error: "Não foi possível registrar sua inscrição. Tente novamente." }, { status: 500 });
    }
  } else {
    member = inserted;
  }

  if (!member) {
    return NextResponse.json({ error: "Erro inesperado ao salvar inscrição." }, { status: 500 });
  }

  // 3. Aguardar notificações antes de responder (serverless termina após o return)
  await Promise.allSettled([
    member.welcome_email_sent_at ? Promise.resolve() : sendWelcomeEmail(member),
    member.welcome_whatsapp_sent_at ? Promise.resolve() : sendWelcomeWhatsApp(member),
  ]);

  const protocolo = `BP-${member.id.slice(0, 8).toUpperCase()}`;
  const subgroup = getSubgroupRoute(member.skin_concern);

  return NextResponse.json(
    {
      success: true,
      protocolo,
      message: "Você está no Círculo. O próximo drop chega no seu WhatsApp em até 14 dias.",
      subgroup: { url: subgroup.url, label: subgroup.label },
    },
    { status: 201 }
  );
}
