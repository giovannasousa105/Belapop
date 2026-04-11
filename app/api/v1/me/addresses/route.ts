import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

type AddressBody = {
  label?: string;
  full_name?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  zip?: string;
  complement?: string;
  is_default?: boolean;
};

export async function GET() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const { data, error } = await admin
    .from("addresses")
    .select("id,label,full_name,street,number,city,state,zip,complement,is_default,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as AddressBody;

  if (!body.street || !body.number || !body.city || !body.state || !body.zip) {
    return NextResponse.json(
      { error: "Rua, numero, cidade, estado e CEP sao obrigatorios." },
      { status: 400 }
    );
  }

  if (body.is_default) {
    await admin.from("addresses").update({ is_default: false }).eq("user_id", userId);
  }

  const { data, error } = await admin
    .from("addresses")
    .insert({
      user_id: userId,
      label: body.label ?? null,
      full_name: body.full_name ?? null,
      street: body.street,
      number: body.number,
      city: body.city,
      state: body.state,
      zip: body.zip,
      complement: body.complement ?? null,
      is_default: Boolean(body.is_default)
    })
    .select("id,label,full_name,street,number,city,state,zip,complement,is_default,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
