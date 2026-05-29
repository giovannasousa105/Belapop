import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdmSessionState } from "@/lib/adm/auth/current-user";
import { hasPermission } from "@/lib/adm/auth/guards";
import { getStripe } from "@/lib/stripe/stripeClient";
import { deliverEmailNotification, deliverWhatsAppNotification } from "@/lib/notifications/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

async function requireAdmAuth() {
  const session = await getAdmSessionState();
  if (!session.user) return null;
  if (!hasPermission(session.user, "manage_products")) return null;
  return session.user;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br").replace(/\/+$/, "");

/**
 * POST /api/adm/drops/[id]/publish
 *
 * 1. Valida que o drop está em rascunho e tem itens
 * 2. Gera Stripe Payment Links para cada item sem link
 * 3. Atualiza status para "live"
 * 4. Dispara broadcast (email + WhatsApp) para membros do Círculo com consent_marketing=true
 * 5. Registra broadcast em drop_broadcasts
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmAuth();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  // 1. Carregar drop + itens
  const { data: drop, error: dropError } = await supabase
    .from("drops")
    .select("id, number, title, status, opens_at, closes_at")
    .eq("id", id)
    .single();

  if (dropError || !drop) {
    return NextResponse.json({ error: "Drop não encontrado." }, { status: 404 });
  }
  if (drop.status !== "draft") {
    return NextResponse.json({ error: "Somente drops em rascunho podem ser publicados." }, { status: 409 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("drop_items")
    .select("id, product_id, drop_price_cents, max_quantity, stripe_payment_link_url, products(name, slug)")
    .eq("drop_id", id);

  if (itemsError || !items?.length) {
    return NextResponse.json({ error: "O drop precisa ter pelo menos um SKU." }, { status: 422 });
  }

  // 2. Gerar Stripe Payment Links para itens sem link
  const stripe = getStripe();
  const linkErrors: string[] = [];

  await Promise.allSettled(
    items.map(async (item) => {
      if (item.stripe_payment_link_url) return; // já tem link

      try {
        const product = item.products as { name?: string; slug?: string } | null;
        const productName = product?.name ?? `Produto ${item.product_id.slice(0, 8)}`;
        const productSlug = product?.slug ?? item.product_id;

        // Criar Stripe Price inline
        const stripeProduct = await stripe.products.create({
          name: `${productName} — Drop #${drop.number} BelaPop`,
          metadata: { drop_id: id, drop_item_id: item.id, belapop_product_id: item.product_id },
        });

        const price = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: item.drop_price_cents,
          currency: "brl",
        });

        const link = await stripe.paymentLinks.create({
          line_items: [{ price: price.id, quantity: 1, adjustable_quantity: { enabled: true, minimum: 1, maximum: item.max_quantity } }],
          after_completion: {
            type: "redirect",
            redirect: { url: `${SITE_URL}/produto/${productSlug}?drop_purchase=1` },
          },
          metadata: { drop_id: id, drop_item_id: item.id },
        });

        await supabase
          .from("drop_items")
          .update({
            stripe_payment_link_url: link.url,
            stripe_payment_link_id: link.id,
          })
          .eq("id", item.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        linkErrors.push(`item ${item.id}: ${msg}`);
        console.error("[drops/publish] Falha ao criar Payment Link:", msg);
      }
    })
  );

  // 3. Atualizar status do drop para live
  await supabase.from("drops").update({ status: "live" }).eq("id", id);

  // 4. Broadcast para membros do Círculo
  const { data: members } = await supabase
    .from("circulo_members")
    .select("id, name, email, whatsapp_e164")
    .eq("consent_marketing", true)
    .is("unsubscribed_at", null)
    .limit(5000);

  const recipientsCount = members?.length ?? 0;
  let emailErrors = 0;
  let wppErrors = 0;

  if (members && members.length > 0) {
    const opensDate = new Date(drop.opens_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
    const dropUrl = `${SITE_URL}/circulo#drops`;

    // Email
    const emailResult = await deliverEmailNotification({
      to: members.map((m) => m.email).join(","), // batch simples — para produção usar Resend batch
      subject: `Drop #${drop.number} BelaPop — ${drop.title} — abertura em ${opensDate}`,
      body: `${drop.title}\n\nO Drop #${drop.number} do Círculo BelaPop abre em ${opensDate}.\nAcesse: ${dropUrl}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px">
          <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#aaa;margin:0 0 20px">Círculo BelaPop</p>
          <h1 style="font-size:22px;font-weight:600;color:#1e1e1e;margin:0 0 8px">${drop.title}</h1>
          <p style="font-size:13px;color:#666;margin:0 0 24px">Drop #${drop.number} · Abertura em ${opensDate}</p>
          <a href="${dropUrl}" style="display:inline-block;background:#1e1e1e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:12px;letter-spacing:0.12em;font-weight:600">Ver o drop</a>
          <p style="font-size:11px;color:#ccc;margin:24px 0 0">Você recebe isso por ser membro do Círculo BelaPop.</p>
        </div>
      `,
    });
    if (!emailResult.ok) emailErrors += 1;

    // WhatsApp — enviado individualmente para personalização
    await Promise.allSettled(
      members.slice(0, 500).map(async (member) => { // limite prático por rate limit Twilio
        const firstName = member.name.split(" ")[0] ?? member.name;
        const result = await deliverWhatsAppNotification({
          to: member.whatsapp_e164,
          body: `${firstName}, o Drop #${drop.number} do Círculo BelaPop está aberto.\n\n${drop.title}\n\nAcesse agora: ${dropUrl}`,
        });
        if (!result.ok) wppErrors += 1;
      })
    );
  }

  // 5. Registrar broadcasts
  await supabase.from("drop_broadcasts").insert([
    {
      drop_id: id,
      channel: "email",
      recipients_count: recipientsCount,
      error_log: emailErrors > 0 ? `${emailErrors} erro(s) de email` : null,
      triggered_by: user.id,
    },
    {
      drop_id: id,
      channel: "whatsapp",
      recipients_count: Math.min(recipientsCount, 500),
      error_log: wppErrors > 0 ? `${wppErrors} erro(s) de WhatsApp` : null,
      triggered_by: user.id,
    },
  ]);

  return NextResponse.json({
    success: true,
    drop_number: drop.number,
    recipients: recipientsCount,
    link_errors: linkErrors,
    message: `Drop #${drop.number} publicado. ${recipientsCount} membros notificados.`,
  });
}
