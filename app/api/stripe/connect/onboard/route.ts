import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe/stripeClient";

export const runtime = "nodejs";

type OnboardRequest = {
  accountId?: string;
  email?: string;
  businessName?: string;
};

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OnboardRequest;
    const stripe = getStripe();

    let accountId = body.accountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        email: body.email,
        business_profile: body.businessName
          ? {
              name: body.businessName
            }
          : undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });
      accountId = account.id;
    }

    const baseUrl = getBaseUrl();
    const refreshUrl =
      process.env.STRIPE_CONNECT_REFRESH_URL ||
      `${baseUrl}/seller/dashboard?onboarding=refresh`;
    const returnUrl =
      process.env.STRIPE_CONNECT_RETURN_URL ||
      `${baseUrl}/seller/dashboard?onboarding=success`;

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
