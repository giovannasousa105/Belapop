import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { hasMinTwoWords, isValidCpf, normalizeCpf, normalizePhone } from "@/lib/api/v1/validators";

type PatchBody = {
  full_name?: string;
  cpf?: string;
  phone?: string;
  birth_date?: string | null;
  marketing_opt_in?: boolean;
};

export async function GET() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId, user } = auth.ctx;
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,full_name,role,created_at")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("notification_preferences")
      .select("email_opt_in,whatsapp_opt_in,push_opt_in")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  const metadata = user.user_metadata ?? {};
  const cpf = typeof metadata.cpf === "string" ? metadata.cpf : null;
  const phone = typeof metadata.phone === "string" ? metadata.phone : null;
  const birthDate = typeof metadata.birth_date === "string" ? metadata.birth_date : null;
  const marketingOptIn = Boolean(metadata.marketing_opt_in);

  return NextResponse.json({
    id: userId,
    email: profile?.email ?? user.email ?? null,
    full_name: profile?.full_name ?? null,
    role: profile?.role ?? "customer",
    created_at: profile?.created_at ?? user.created_at ?? null,
    email_verified: Boolean(user.email_confirmed_at),
    phone_verified: Boolean(user.phone_confirmed_at),
    cpf,
    phone,
    birth_date: birthDate,
    cpf_required: !cpf,
    preferences: {
      order_updates: {
        email: preferences?.email_opt_in ?? true,
        whatsapp: preferences?.whatsapp_opt_in ?? false
      },
      support_updates: {
        email: preferences?.email_opt_in ?? true,
        whatsapp: preferences?.whatsapp_opt_in ?? false
      },
      marketing: {
        email: marketingOptIn,
        whatsapp: marketingOptIn
      },
      push: preferences?.push_opt_in ?? false
    }
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { supabase, admin, userId, user } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as PatchBody;

  const updates: Record<string, unknown> = {};
  if (typeof body.full_name === "string") {
    const fullName = body.full_name.trim();
    if (!fullName) {
      return NextResponse.json({ error: "Nome completo e obrigatorio." }, { status: 400 });
    }
    if (!hasMinTwoWords(fullName)) {
      return NextResponse.json(
        { error: "Nome completo deve conter pelo menos nome e sobrenome." },
        { status: 400 }
      );
    }
    updates.full_name = fullName;
  }

  const metadataPatch: Record<string, unknown> = { ...(user.user_metadata ?? {}) };

  if (typeof body.cpf === "string") {
    const cpf = normalizeCpf(body.cpf);
    if (!isValidCpf(cpf)) {
      return NextResponse.json({ error: "CPF invalido." }, { status: 400 });
    }
    metadataPatch.cpf = cpf;
  }

  if (typeof body.phone === "string") {
    const phone = normalizePhone(body.phone);
    if (phone.length < 10) {
      return NextResponse.json({ error: "Telefone invalido." }, { status: 400 });
    }
    metadataPatch.phone = phone;
  }

  if (Object.prototype.hasOwnProperty.call(body, "birth_date")) {
    metadataPatch.birth_date = body.birth_date ?? null;
  }

  if (typeof body.marketing_opt_in === "boolean") {
    metadataPatch.marketing_opt_in = body.marketing_opt_in;
  }

  const updatesPromise =
    Object.keys(updates).length > 0
      ? admin.from("profiles").update(updates).eq("id", userId)
      : Promise.resolve({ error: null });

  const metadataPromise =
    Object.keys(metadataPatch).length > 0
      ? supabase.auth.updateUser({ data: metadataPatch })
      : Promise.resolve({ error: null });

  const [profileResult, metadataResult] = await Promise.all([updatesPromise, metadataPromise]);

  const profileError =
    "error" in profileResult && profileResult.error ? profileResult.error.message : null;
  const metadataError =
    "error" in metadataResult && metadataResult.error ? metadataResult.error.message : null;

  if (profileError || metadataError) {
    return NextResponse.json(
      { error: profileError ?? metadataError ?? "Nao foi possivel atualizar seu perfil." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
