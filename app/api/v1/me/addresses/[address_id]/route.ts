import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

type PatchBody = {
  label?: string | null;
  full_name?: string | null;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  zip?: string;
  complement?: string | null;
  is_default?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ address_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { address_id: addressId } = await params;
  const body = (await request.json().catch(() => ({}))) as PatchBody;
  const { admin, userId } = auth.ctx;

  const updates: Record<string, unknown> = {};
  if (Object.prototype.hasOwnProperty.call(body, "label")) updates.label = body.label ?? null;
  if (Object.prototype.hasOwnProperty.call(body, "full_name")) updates.full_name = body.full_name ?? null;
  if (typeof body.street === "string") updates.street = body.street;
  if (typeof body.number === "string") updates.number = body.number;
  if (typeof body.city === "string") updates.city = body.city;
  if (typeof body.state === "string") updates.state = body.state;
  if (typeof body.zip === "string") updates.zip = body.zip;
  if (Object.prototype.hasOwnProperty.call(body, "complement")) {
    updates.complement = body.complement ?? null;
  }

  if (body.is_default) {
    await admin.from("addresses").update({ is_default: false }).eq("user_id", userId);
    updates.is_default = true;
  } else if (body.is_default === false) {
    updates.is_default = false;
  }

  const { data, error } = await admin
    .from("addresses")
    .update(updates)
    .eq("id", addressId)
    .eq("user_id", userId)
    .select("id,label,full_name,street,number,city,state,zip,complement,is_default,created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Endereco nao encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ address_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { address_id: addressId } = await params;
  const { admin, userId } = auth.ctx;

  const { error } = await admin.from("addresses").delete().eq("id", addressId).eq("user_id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
