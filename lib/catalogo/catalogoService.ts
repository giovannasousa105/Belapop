import "server-only";

import { getSupabaseAdminClient }    from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ProdutoCardDTO,
  ProdutoDetalheDTO,
  FiltrosBusca,
  ResultadoBusca,
  WishlistItem,
  AvaliacaoDTO,
  CriarAvaliacaoInput,
  BuscarProdutosRow,
  UniversoCatalogo,
} from "./catalogoTypes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function rowToCardDTO(row: BuscarProdutosRow): ProdutoCardDTO {
  return {
    id:                       row.id,
    name:                     row.name ?? "",
    brand:                    row.brand,
    price_cents:              row.price_cents ?? 0,
    images:                   parseImages(row.images),
    universo:                 (row.universo as UniversoCatalogo | null),
    necessidades:             row.necessidades ?? [],
    tipo_pele_indicado:       row.tipo_pele_indicado ?? [],
    nivel_sensibilidade_max:  row.nivel_sensibilidade_max ?? 5,
    passo_rotina:             row.passo_rotina,
    periodo:                  row.periodo,
    total_vendas_30d:         row.total_vendas_30d ?? 0,
    rating_medio:             parseFloat(row.rating_medio ?? "0"),
    total_avaliacoes:         row.total_avaliacoes ?? 0,
    curated:                  row.curated ?? false,
    is_featured:              row.is_featured ?? false,
    stock_quantity:           row.stock_quantity ?? 0,
    compat_score:             row.compat_score,
    na_wishlist:              row.na_wishlist ?? false,
  };
}

function productRecordToCardDTO(row: Record<string, unknown>): ProdutoCardDTO {
  return {
    id:                      row.id as string,
    name:                    (row.name as string | null) ?? "",
    brand:                   (row.brand as string | null) ?? null,
    price_cents:             (row.price_cents as number | null) ?? 0,
    images:                  parseImages(row.images),
    universo:                (row.universo as UniversoCatalogo | null) ?? null,
    necessidades:            (row.necessidades as string[] | null) ?? [],
    tipo_pele_indicado:      (row.tipo_pele_indicado as string[] | null) ?? [],
    nivel_sensibilidade_max: (row.nivel_sensibilidade_max as number | null) ?? 5,
    passo_rotina:            (row.passo_rotina as string | null) ?? null,
    periodo:                 (row.periodo as string | null) ?? null,
    total_vendas_30d:        (row.total_vendas_30d as number | null) ?? 0,
    rating_medio:            parseFloat(String(row.rating_medio ?? "0")),
    total_avaliacoes:        (row.total_avaliacoes as number | null) ?? 0,
    curated:                 (row.curated as boolean | null) ?? false,
    is_featured:             (row.is_featured as boolean | null) ?? false,
    stock_quantity:          (row.stock_quantity as number | null) ?? 0,
    compat_score:            null,
    na_wishlist:             false,
  };
}

function escapeIlikeTerm(value: string): string {
  return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

async function buscarProdutosFallback(
  filtros: FiltrosBusca,
  pagina: number,
  por_pagina: number,
  offset: number,
): Promise<ResultadoBusca> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("products")
    .select(
      "id,name,brand,price_cents,images,universo,necessidades,tipo_pele_indicado," +
        "nivel_sensibilidade_max,passo_rotina,periodo,total_vendas_30d,rating_medio," +
        "total_avaliacoes,curated,is_featured,stock_quantity,updated_at,status",
      { count: "exact" }
    )
    .eq("status", "published");

  if (filtros.query?.trim()) {
    const term = escapeIlikeTerm(filtros.query.trim());
    query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (filtros.universo) query = query.eq("universo", filtros.universo);
  if (typeof filtros.curated === "boolean") query = query.eq("curated", filtros.curated);
  if (typeof filtros.preco_min === "number") query = query.gte("price_cents", filtros.preco_min);
  if (typeof filtros.preco_max === "number") query = query.lte("price_cents", filtros.preco_max);
  if (filtros.passo_rotina) query = query.eq("passo_rotina", filtros.passo_rotina);
  if (filtros.periodo) query = query.eq("periodo", filtros.periodo);

  switch (filtros.ordenacao) {
    case "preco_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "preco_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "mais_vendidos":
      query = query.order("total_vendas_30d", { ascending: false, nullsFirst: false });
      break;
    case "melhor_avaliados":
      query = query.order("rating_medio", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("curated", { ascending: false })
        .order("updated_at", { ascending: false, nullsFirst: false });
  }

  const { data, error, count } = await query.range(offset, offset + por_pagina - 1);

  if (error) {
    console.error("[catalogo] fallback products query failed", error);
    return {
      itens: [],
      total: 0,
      pagina,
      por_pagina,
      total_paginas: 0,
    };
  }

  const total = count ?? data?.length ?? 0;

  return {
    itens: (data ?? []).map((row) => productRecordToCardDTO(row as unknown as Record<string, unknown>)),
    total,
    pagina,
    por_pagina,
    total_paginas: Math.ceil(total / por_pagina),
  };
}

// ─── buscarProdutos ───────────────────────────────────────────────────────────

export async function buscarProdutos(
  filtros: FiltrosBusca,
  user_id?: string,
  compat_scores?: Record<string, number>,
): Promise<ResultadoBusca> {
  const supabase   = getSupabaseAdminClient();
  const pagina     = Math.max(1, filtros.pagina ?? 1);
  const por_pagina = Math.min(48, Math.max(6, filtros.por_pagina ?? 24));
  const offset     = (pagina - 1) * por_pagina;

  const { data, error } = await supabase.rpc("fn_buscar_produtos", {
    p_query:             filtros.query     || null,
    p_universo:          filtros.universo  || null,
    p_necessidades:      filtros.necessidades?.length ? filtros.necessidades : null,
    p_tipo_pele:         filtros.tipo_pele?.length    ? filtros.tipo_pele    : null,
    p_sensibilidade_max: filtros.sensibilidade_max    ?? null,
    p_passo_rotina:      filtros.passo_rotina          || null,
    p_periodo:           filtros.periodo               || null,
    p_preco_min:         filtros.preco_min             ?? null,
    p_preco_max:         filtros.preco_max             ?? null,
    p_curated:           filtros.curated               ?? null,
    p_user_id:           user_id                       ?? null,
    p_compat_scores:     compat_scores ? JSON.stringify(compat_scores) : null,
    p_limit:             por_pagina,
    p_offset:            offset,
    p_sort:              filtros.ordenacao ?? "relevancia",
  });

  if (error) {
    console.warn("[catalogo] fn_buscar_produtos unavailable; using direct products fallback", {
      code: error.code,
      message: error.message,
    });
    return buscarProdutosFallback(filtros, pagina, por_pagina, offset);
  }

  const rows  = (data ?? []) as BuscarProdutosRow[];
  const total = rows.length ? parseInt(rows[0].total_count ?? "0", 10) : 0;

  return {
    itens:         rows.map(rowToCardDTO),
    total,
    pagina,
    por_pagina,
    total_paginas: Math.ceil(total / por_pagina),
  };
}

// ─── buscarPorUniverso ────────────────────────────────────────────────────────

export async function buscarPorUniverso(
  universo: UniversoCatalogo,
  filtros?: Omit<FiltrosBusca, "universo">,
  user_id?: string,
  compat_scores?: Record<string, number>,
): Promise<ResultadoBusca> {
  return buscarProdutos({ ...filtros, universo }, user_id, compat_scores);
}

// ─── buscarProdutoDetalhe ─────────────────────────────────────────────────────

export async function buscarProdutoDetalhe(
  produto_id: string,
  user_id?: string,
): Promise<ProdutoDetalheDTO | null> {
  const supabase = getSupabaseAdminClient();

  const { data: produto, error } = await supabase
    .from("products")
    .select(
      "id,name,brand,description,price_cents,images,highlights,universo," +
      "necessidades,tipo_pele_indicado,nivel_sensibilidade_max," +
      "passo_rotina,periodo,ativos_principais,duracao_media_dias," +
      "total_vendas_30d,rating_medio,total_avaliacoes,curated," +
      "is_featured,stock_quantity,seller_id,status"
    )
    .eq("id", produto_id)
    .eq("status", "published")
    .single();

  if (error || !produto) return null;

  // wishlist
  let na_wishlist = false;
  if (user_id) {
    const { data: wi } = await supabase
      .from("wishlist_itens")
      .select("id")
      .eq("user_id", user_id)
      .eq("product_id", produto_id)
      .maybeSingle();
    na_wishlist = wi !== null;
  }

  // avaliações aprovadas (últimas 10)
  const { data: avalRows } = await supabase
    .from("produto_avaliacoes")
    .select("id,user_id,nota,titulo,texto,tipo_pele,compat_score,criado_em")
    .eq("product_id", produto_id)
    .eq("aprovada", true)
    .order("criado_em", { ascending: false })
    .limit(10);

  const avaliacoes_recentes: AvaliacaoDTO[] = (avalRows ?? []).map((r) => ({
    id:           r.id as string,
    user_id:      r.user_id as string,
    nota:         r.nota as number,
    titulo:       r.titulo as string | null,
    texto:        r.texto as string | null,
    tipo_pele:    r.tipo_pele as string | null,
    compat_score: r.compat_score as number | null,
    criado_em:    r.criado_em as string,
  }));

  const p = produto as unknown as Record<string, unknown>;

  return {
    id:                       p.id as string,
    name:                     (p.name as string) ?? "",
    brand:                    (p.brand as string | null),
    description:              (p.description as string | null),
    price_cents:              (p.price_cents as number) ?? 0,
    images:                   parseImages(p.images),
    highlights:               Array.isArray(p.highlights)
                                ? (p.highlights as string[])
                                : [],
    universo:                 (p.universo as UniversoCatalogo | null),
    necessidades:             (p.necessidades as string[]) ?? [],
    tipo_pele_indicado:       (p.tipo_pele_indicado as string[]) ?? [],
    nivel_sensibilidade_max:  (p.nivel_sensibilidade_max as number) ?? 5,
    passo_rotina:             (p.passo_rotina as string | null),
    periodo:                  (p.periodo as string | null),
    ativos_principais:        (p.ativos_principais as string[]) ?? [],
    duracao_media_dias:       (p.duracao_media_dias as number) ?? 60,
    total_vendas_30d:         (p.total_vendas_30d as number) ?? 0,
    rating_medio:             parseFloat(String(p.rating_medio ?? "0")),
    total_avaliacoes:         (p.total_avaliacoes as number) ?? 0,
    curated:                  (p.curated as boolean) ?? false,
    is_featured:              (p.is_featured as boolean) ?? false,
    stock_quantity:           (p.stock_quantity as number) ?? 0,
    seller_id:                (p.seller_id as string | null),
    status:                   (p.status as string) ?? "published",
    compat_score:             null,
    na_wishlist,
    avaliacoes_recentes,
  };
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export async function listarWishlist(user_id: string): Promise<WishlistItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("wishlist_itens")
    .select(
      "id,product_id,compat_score,tipo_pele,criado_em," +
      "products!wishlist_itens_product_id_fkey(" +
        "id,name,brand,price_cents,images,universo,necessidades," +
        "tipo_pele_indicado,nivel_sensibilidade_max,passo_rotina,periodo," +
        "total_vendas_30d,rating_medio,total_avaliacoes,curated,is_featured,stock_quantity" +
      ")"
    )
    .eq("user_id", user_id)
    .order("criado_em", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const prod = r.products as Record<string, unknown> | null;
    return {
      id:           r.id as string,
      product_id:   r.product_id as string,
      compat_score: r.compat_score as number | null,
      tipo_pele:    r.tipo_pele as string | null,
      criado_em:    r.criado_em as string,
      produto: prod
        ? {
            id:                      prod.id as string,
            name:                    (prod.name as string) ?? "",
            brand:                   prod.brand as string | null,
            price_cents:             (prod.price_cents as number) ?? 0,
            images:                  parseImages(prod.images),
            universo:                prod.universo as UniversoCatalogo | null,
            necessidades:            (prod.necessidades as string[]) ?? [],
            tipo_pele_indicado:      (prod.tipo_pele_indicado as string[]) ?? [],
            nivel_sensibilidade_max: (prod.nivel_sensibilidade_max as number) ?? 5,
            passo_rotina:            prod.passo_rotina as string | null,
            periodo:                 prod.periodo as string | null,
            total_vendas_30d:        (prod.total_vendas_30d as number) ?? 0,
            rating_medio:            parseFloat(String(prod.rating_medio ?? "0")),
            total_avaliacoes:        (prod.total_avaliacoes as number) ?? 0,
            curated:                 (prod.curated as boolean) ?? false,
            is_featured:             (prod.is_featured as boolean) ?? false,
            stock_quantity:          (prod.stock_quantity as number) ?? 0,
            compat_score:            r.compat_score as number | null,
            na_wishlist:             true,
          }
        : null,
    };
  });
}

export async function adicionarWishlist(
  user_id: string,
  product_id: string,
  compat_score?: number,
  tipo_pele?: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("wishlist_itens")
    .upsert(
      { user_id, product_id, compat_score: compat_score ?? null, tipo_pele: tipo_pele ?? null },
      { onConflict: "user_id,product_id" }
    );
  if (error) throw error;
}

export async function removerWishlist(
  user_id: string,
  product_id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("wishlist_itens")
    .delete()
    .eq("user_id", user_id)
    .eq("product_id", product_id);
  if (error) throw error;
}

// ─── Avaliações ───────────────────────────────────────────────────────────────

export async function listarAvaliacoes(
  product_id: string,
  pagina = 1,
  por_pagina = 20,
): Promise<{ itens: AvaliacaoDTO[]; total: number }> {
  const supabase = getSupabaseAdminClient();
  const from     = (pagina - 1) * por_pagina;
  const to       = from + por_pagina - 1;

  const { data, error, count } = await supabase
    .from("produto_avaliacoes")
    .select("id,user_id,nota,titulo,texto,tipo_pele,compat_score,criado_em", { count: "exact" })
    .eq("product_id", product_id)
    .eq("aprovada", true)
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const itens: AvaliacaoDTO[] = (data ?? []).map((r) => ({
    id:           r.id as string,
    user_id:      r.user_id as string,
    nota:         r.nota as number,
    titulo:       r.titulo as string | null,
    texto:        r.texto as string | null,
    tipo_pele:    r.tipo_pele as string | null,
    compat_score: r.compat_score as number | null,
    criado_em:    r.criado_em as string,
  }));

  return { itens, total: count ?? 0 };
}

export async function registrarAvaliacao(
  user_id: string,
  input: CriarAvaliacaoInput,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("produto_avaliacoes")
    .upsert(
      {
        user_id,
        product_id:   input.product_id,
        nota:         input.nota,
        titulo:       input.titulo       ?? null,
        texto:        input.texto        ?? null,
        tipo_pele:    input.tipo_pele    ?? null,
        compat_score: input.compat_score ?? null,
        aprovada:     false,
      },
      { onConflict: "user_id,product_id" }
    );
  if (error) throw error;
}
