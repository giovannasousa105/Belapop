import { NextResponse } from "next/server";
import { nanoid }       from "nanoid";

import { getSupabaseAdminClient }    from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  processarImagemProduto,
  validarResolucao,
  detectarTipoImagem,
} from "@/lib/images/imageProcessor";

const TIPOS_ACEITOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES     = 15 * 1024 * 1024; // 15 MB

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // ── Auth: seller autenticado + status ATIVO ──────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const { data: seller, error: sellerError } = await admin
    .from("sellers")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sellerError || !seller) {
    return NextResponse.json({ error: "Seller não encontrado." }, { status: 403 });
  }
  if (seller.status !== "active" && seller.status !== "approved") {
    return NextResponse.json(
      { error: "Conta não ativa. Aguarde aprovação." },
      { status: 403 },
    );
  }

  // ── Parse do body ─────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const arquivo    = formData.get("imagem");
  const produto_id = formData.get("produto_id");

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "Campo 'imagem' obrigatório." }, { status: 400 });
  }
  if (typeof produto_id !== "string" || !produto_id) {
    return NextResponse.json({ error: "Campo 'produto_id' obrigatório." }, { status: 400 });
  }

  // ── Validação de tipo ────────────────────────────────────────────────────
  if (!TIPOS_ACEITOS.has(arquivo.type)) {
    return NextResponse.json(
      { error: "Formato não suportado. Use JPEG, PNG ou WebP." },
      { status: 422 },
    );
  }

  // ── Validação de tamanho ─────────────────────────────────────────────────
  if (arquivo.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Imagem muito grande. Máximo 15 MB." },
      { status: 422 },
    );
  }

  // ── Verificar que o produto pertence ao seller ───────────────────────────
  const { data: produto } = await admin
    .from("products")
    .select("id")
    .eq("id", produto_id)
    .eq("seller_id", seller.id)
    .maybeSingle();

  if (!produto) {
    return NextResponse.json(
      { error: "Produto não encontrado ou não pertence a este seller." },
      { status: 404 },
    );
  }

  // ── Buffer + validação de resolução ──────────────────────────────────────
  const arrayBuffer = await arquivo.arrayBuffer();
  const buffer      = Buffer.from(arrayBuffer);

  try {
    await validarResolucao(buffer);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resolução insuficiente." },
      { status: 422 },
    );
  }

  // ── Detecção de tipo + processamento ─────────────────────────────────────
  const tipo      = await detectarTipoImagem(buffer);
  const imagem_id = nanoid(10);

  const variantesAProcessar: Array<"card" | "pdp" | "thumb" | "avatar" | "editorial"> =
    ["card", "pdp", "thumb", "avatar", ...(tipo === "editorial" ? (["editorial"] as const) : [])];

  let urls: Record<string, string>;
  try {
    urls = await processarImagemProduto({
      buffer,
      produto_id,
      imagem_id,
      variantes: variantesAProcessar,
    });
  } catch (err) {
    console.error("[seller/upload] processamento falhou:", err);
    return NextResponse.json(
      { error: "Erro ao processar imagem. Tente novamente." },
      { status: 500 },
    );
  }

  // ── Persistência no banco ────────────────────────────────────────────────
  // Conta quantas imagens o produto já tem para definir a ordem
  const { count: ordemAtual } = await admin
    .from("produto_imagens")
    .select("id", { count: "exact", head: true })
    .eq("produto_id", produto_id);

  const { error: insertError } = await admin
    .from("produto_imagens")
    .insert({
      produto_id,
      imagem_id,
      tipo,
      urls_por_variante: urls,
      ordem: ordemAtual ?? 0,
    });

  if (insertError) {
    console.error("[seller/upload] insert falhou:", insertError);
    return NextResponse.json(
      { error: "Erro ao salvar imagem. Tente novamente." },
      { status: 500 },
    );
  }

  return NextResponse.json({ imagem_id, urls, tipo }, { status: 201 });
}
