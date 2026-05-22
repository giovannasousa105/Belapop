import { NextResponse } from "next/server";

import { buscarProdutoDetalhe } from "@/lib/catalogo/catalogoService";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ produto_id: string }> },
) {
  const { produto_id } = await params;

  if (!produto_id || produto_id.length < 10) {
    return NextResponse.json({ error: "produto_id inválido." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const produto = await buscarProdutoDetalhe(produto_id, user?.id);

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    return NextResponse.json(produto);
  } catch (err) {
    console.error("[catalogo/produto]", err);
    return NextResponse.json({ error: "Erro ao buscar produto." }, { status: 500 });
  }
}
