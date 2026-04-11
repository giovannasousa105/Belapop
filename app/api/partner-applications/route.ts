import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type PartnerApplicationPayload = {
  brandName?: string;
  cnpj?: string;
  contactName?: string;
  phone?: string;
  instagram?: string;
  catalogLink?: string;
  companyPostalCode?: string;
  companyStreet?: string;
  companyNumber?: string;
  companyComplement?: string;
  companyDistrict?: string;
  companyCity?: string;
  companyState?: string;
};

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("partner_applications")
    .select(
      "id,status,brand_name,contact_name,company_postal_code,company_street,company_number,company_complement,company_district,company_city,company_state,created_at,updated_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel carregar seu status." }, { status: 500 });
  }

  return NextResponse.json({ application: data?.[0] ?? null });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const raw = (await request.json()) as PartnerApplicationPayload;
  const payload = {
    brand_name: normalize(raw.brandName),
    cnpj: normalize(raw.cnpj) || null,
    contact_name: normalize(raw.contactName),
    phone: normalize(raw.phone) || null,
    instagram: normalize(raw.instagram) || null,
    catalog_link: normalize(raw.catalogLink) || null,
    company_postal_code: normalize(raw.companyPostalCode) || null,
    company_street: normalize(raw.companyStreet) || null,
    company_number: normalize(raw.companyNumber) || null,
    company_complement: normalize(raw.companyComplement) || null,
    company_district: normalize(raw.companyDistrict) || null,
    company_city: normalize(raw.companyCity) || null,
    company_state: normalize(raw.companyState).toUpperCase() || null
  };

  if (!payload.brand_name || !payload.contact_name) {
    return NextResponse.json(
      { error: "Preencha marca e contato para continuar." },
      { status: 400 }
    );
  }

  const { data: pendingRows, error: pendingError } = await supabase
    .from("partner_applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);

  if (pendingError) {
    return NextResponse.json({ error: "Nao foi possivel enviar sua solicitacao." }, { status: 500 });
  }

  const pendingId = pendingRows?.[0]?.id;

  if (pendingId) {
    const { error: updateError } = await supabase
      .from("partner_applications")
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq("id", pendingId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Nao foi possivel atualizar sua solicitacao." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "pending", id: pendingId });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("partner_applications")
    .insert({
      user_id: user.id,
      ...payload,
      status: "pending"
    })
    .select("id,status")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ error: "Nao foi possivel enviar sua solicitacao." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: inserted?.status ?? "pending", id: inserted?.id ?? null });
}
