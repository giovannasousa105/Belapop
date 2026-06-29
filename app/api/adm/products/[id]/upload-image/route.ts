import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdmSessionState } from "@/lib/adm/auth/current-user";
import { hasPermission } from "@/lib/adm/auth/guards";

export const runtime = "nodejs";

async function requireAdmAuth() {
  const session = await getAdmSessionState();
  if (!session.user) return null;
  if (!hasPermission(session.user, "manage_products")) return null;
  return session.user;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmAuth();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { error: checkError } = await supabase
    .from("products")
    .select("id")
    .eq("id", id)
    .single();
  if (checkError) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Campo 'file' obrigatório." }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato não suportado. Use JPG, PNG, WebP ou GIF." },
      { status: 422 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 5 MB." }, { status: 422 });
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `hero/${id}/hero-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("products")
    .update({ hero_image_url: publicUrl })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}
