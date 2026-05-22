import { NextResponse } from "next/server";

import {
  adicionarWishlist,
  removerWishlist,
} from "@/lib/catalogo/catalogoService";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ produto_id: string }> },
) {
  const { produto_id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({})) as {
      compat_score?: number;
      tipo_pele?: string;
    };
    await adicionarWishlist(user.id, produto_id, body.compat_score, body.tipo_pele);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wishlist POST]", err);
    return NextResponse.json({ error: "Erro ao adicionar à wishlist." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ produto_id: string }> },
) {
  const { produto_id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    await removerWishlist(user.id, produto_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wishlist DELETE]", err);
    return NextResponse.json({ error: "Erro ao remover da wishlist." }, { status: 500 });
  }
}
