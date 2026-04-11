import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getStripe } from "@/lib/stripe/stripeClient";

export const runtime = "nodejs";

type OnboardRequest = {
  accountId?: string;
  email?: string;
  businessName?: string;
};

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OnboardRequest;
    const supabase = await getSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Autenticacao necessaria." },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { data: seller, error: sellerError } = await admin
      .from("sellers")
      .select("id,store_name,stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sellerError) {
      return NextResponse.json(
        { error: `Falha ao carregar seller: ${sellerError.message}` },
        { status: 500 }
      );
    }

    if (!seller) {
      return NextResponse.json(
        { error: "Seller nao encontrado para o usuario autenticado." },
        { status: 403 }
      );
    }

    const stripe = getStripe();

    let accountId = body.accountId ?? seller.stripe_account_id ?? undefined;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        email: body.email ?? user.email,
        business_profile: body.businessName
          ? {
              name: body.businessName
            }
          : seller.store_name
            ? {
                name: seller.store_name
              }
          : undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });
      accountId = account.id;
    }

    if (seller.stripe_account_id !== accountId) {
      const { error: updateError } = await admin
        .from("sellers")
        .update({ stripe_account_id: accountId })
        .eq("id", seller.id);

      if (updateError) {
        return NextResponse.json(
          { error: `Falha ao salvar stripe_account_id: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    const baseUrl = getBaseUrl();
    const refreshUrl =
      process.env.STRIPE_CONNECT_REFRESH_URL ||
      `${baseUrl}/parceiro?onboarding=refresh`;
    const returnUrl =
      process.env.STRIPE_CONNECT_RETURN_URL ||
      `${baseUrl}/parceiro?onboarding=success`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding"
    });

    return NextResponse.json({
      accountId,
      url: link.url
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao iniciar onboarding.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
