import { NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

export async function POST() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { user, supabase } = auth.ctx;
  const email = user.email;
  if (!email) {
    return NextResponse.json({ error: "E-mail nao disponivel para verificacao." }, { status: 400 });
  }

  if (user.email_confirmed_at) {
    return NextResponse.json({ ok: true, message: "E-mail ja verificado." });
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "E-mail de verificacao enviado." });
}
