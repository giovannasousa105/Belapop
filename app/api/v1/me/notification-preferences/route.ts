import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

type ChannelPrefs = {
  email?: boolean;
  whatsapp?: boolean;
};

type PutBody = {
  order_updates?: ChannelPrefs;
  support_updates?: ChannelPrefs;
  marketing?: ChannelPrefs;
  push?: boolean;
};

const toBool = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

export async function GET() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId, user } = auth.ctx;
  const { data, error } = await admin
    .from("notification_preferences")
    .select("email_opt_in,whatsapp_opt_in,push_opt_in")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const marketing = Boolean(user.user_metadata?.marketing_opt_in);
  return NextResponse.json({
    order_updates: {
      email: data?.email_opt_in ?? true,
      whatsapp: data?.whatsapp_opt_in ?? false
    },
    support_updates: {
      email: data?.email_opt_in ?? true,
      whatsapp: data?.whatsapp_opt_in ?? false
    },
    marketing: {
      email: marketing,
      whatsapp: marketing
    },
    push: data?.push_opt_in ?? false
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId, supabase, user } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as PutBody;

  const emailOptIn = toBool(body.order_updates?.email, true) || toBool(body.support_updates?.email, true);
  const whatsappOptIn =
    toBool(body.order_updates?.whatsapp, false) || toBool(body.support_updates?.whatsapp, false);
  const pushOptIn = toBool(body.push, false);
  const marketingOptIn =
    toBool(body.marketing?.email, false) || toBool(body.marketing?.whatsapp, false);

  const [{ error: prefError }, { error: userError }] = await Promise.all([
    admin.from("notification_preferences").upsert({
      user_id: userId,
      email_opt_in: emailOptIn,
      whatsapp_opt_in: whatsappOptIn,
      push_opt_in: pushOptIn
    }),
    supabase.auth.updateUser({
      data: {
        ...(user.user_metadata ?? {}),
        marketing_opt_in: marketingOptIn
      }
    })
  ]);

  if (prefError || userError) {
    return NextResponse.json(
      { error: prefError?.message ?? userError?.message ?? "Falha ao salvar preferencias." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    preferences: {
      order_updates: { email: emailOptIn, whatsapp: whatsappOptIn },
      support_updates: { email: emailOptIn, whatsapp: whatsappOptIn },
      marketing: { email: marketingOptIn, whatsapp: marketingOptIn },
      push: pushOptIn
    }
  });
}
