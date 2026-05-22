/**
 * Fluxos de lifecycle — baseados em comportamento e tempo.
 * Cada função é um trigger com lógica de DB + Redis.
 * Toda supressão passa pelo deliveryQueue.enfileirar → suppressionGuard.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { enfileirar, redis } from "@/lib/crm/deliveryQueue";
import { criarUnsubscribeToken } from "@/lib/crm/unsubscribeToken";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://belapopoficial.com.br";

// ─── Redis cooldown helpers ────────────────────────────────────────────────────

function keyCarrinho1h(session_id: string): string {
  return `crm:carrinho:1h:${session_id}`;
}
function keyCarrinho24h(user_id: string): string {
  return `crm:carrinho:24h:${user_id}`;
}
function keyWishlistEsgotando(user_id: string, produto_id: string): string {
  return `crm:wishlist:${user_id}:${produto_id}`;
}
function keyReativacao(user_id: string, fluxo: string): string {
  return `crm:reativacao:${user_id}:${fluxo}`;
}

// ─── Interfaces de parâmetros ─────────────────────────────────────────────────

export interface CarrinhoAbandonadoParams {
  user_id: string;
  email: string;
  nome: string | null;
  itens_reservados: Array<{
    produto_nome: string;
    produto_imagem: string;
    preco_centavos: number;
    qtd_disponivel: number; // atual, no momento do envio
  }>;
  checkout_url: string;
  lote_esgotou: boolean;
  produto_alternativo?: {
    nome: string;
    produto_id: string;
    score_compat: number;
  } | null;
}

export interface WishlistEsgotandoParams {
  email: string;
  user_id: string;
  nome: string | null;
  produto_nome: string;
  produto_imagem: string;
  preco_centavos: number;
  qtd_restante: number;
  score_compat: number | null;
  checkout_url: string;
}

export interface AvisoRebaixamentoPayload {
  user_id: string;
  email: string;
  nome: string | null;
  tier_atual: string;
  tier_risco: string;
  pontos_acumulados_12m: number;
  pontos_necessarios: number;
  pontos_faltando: number;
  data_avaliacao: Date;
  dias_para_avaliacao: number;
}

export interface ReativacaoParams {
  email: string;
  user_id: string;
  nome: string | null;
  dias_inativo: number;
  produtos_novos: Array<{ nome: string; imagem: string; preco_centavos: number; slug: string }>;
  credito_valor?: number;
  credito_id?: string;
  entrar_popclub: boolean;
}

// ─── 1 + 2 · CARRINHO_ABANDONADO ─────────────────────────────────────────────

/**
 * Trigger: reserva ATIVA + sem checkout completado após 1h / 24h.
 * Verificado pelo crmLifecycleScheduler a cada 15min.
 */
export async function verificarCarrinhosAbandonados(): Promise<void> {
  if (!redis) return;
  const admin = getSupabaseAdminClient();
  const agora = new Date();

  // ── Reservas 1h: criadas entre 55min e 75min atrás ────────────────────────
  const limite1h_inicio = new Date(agora.getTime() - 75 * 60 * 1000);
  const limite1h_fim    = new Date(agora.getTime() - 55 * 60 * 1000);

  const { data: reservas1h } = await admin
    .from("lote_reservas")
    .select(`
      id, user_id, session_id, produto_id, lote_id, preco_unitario_centavos, criado_em,
      lotes!inner(id, status, qtd_disponivel),
      produtos!inner(nome, imagem_url)
    `)
    .eq("status", "ATIVA")
    .is("pedido_id", null)
    .gte("criado_em", limite1h_inicio.toISOString())
    .lt("criado_em", limite1h_fim.toISOString());

  for (const r of reservas1h ?? []) {
    const userId = r.user_id as string | null;
    const sessionId = r.session_id as string;
    if (!userId && !sessionId) continue;

    // Cooldown: só 1 envio por sessão por 1h
    const ck = keyCarrinho1h(sessionId);
    if (await redis.exists(ck)) continue;

    // Buscar email do usuário
    let email: string | null = null;
    let nome: string | null = null;
    if (userId) {
      const { data: profile } = await admin
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .maybeSingle();
      email = (profile?.email as string | null) ?? null;
      nome  = (profile?.full_name as string | null) ?? null;
    }
    if (!email) continue;

    // Verificar se já fez pedido depois da reserva
    const { count: pedidos } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", r.criado_em as string);
    if ((pedidos ?? 0) > 0) continue;

    const lote = Array.isArray(r.lotes) ? r.lotes[0] : r.lotes;
    const produto = Array.isArray(r.produtos) ? r.produtos[0] : r.produtos;
    const loteStatus = lote?.status as string ?? "";
    const loteEsgotou = loteStatus === "ENCERRADO" || loteStatus === "ESGOTADO";

    const unsubUrl = await criarUnsubscribeToken(userId!, email, "LIFECYCLE");
    const checkoutUrl = `${SITE_URL}/checkout?reserva=${r.id as string}`;

    await enfileirar({
      user_id: userId!,
      email,
      fluxo: "CARRINHO_ABANDONADO_1H",
      template_id: "CarrinhoAbandonado",
      subject: "Sua rotina está quase pronta",
      metadata: {
        nome,
        versao: "urgente",
        itens_reservados: [{
          produto_nome:    produto?.nome as string ?? "",
          produto_imagem:  produto?.imagem_url as string ?? "",
          preco_centavos:  r.preco_unitario_centavos as number ?? 0,
          qtd_disponivel:  lote?.qtd_disponivel as number ?? 0,
        }],
        checkout_url: checkoutUrl,
        lote_esgotou: loteEsgotou,
        unsubscribe_url: unsubUrl,
      } satisfies Record<string, unknown>,
    });

    await redis.setex(ck, 4 * 3600, "1"); // 4h TTL — impede duplo envio
  }

  // ── Reservas 24h: criadas entre 23h e 25h atrás ───────────────────────────
  const limite24h_inicio = new Date(agora.getTime() - 25 * 60 * 60 * 1000);
  const limite24h_fim    = new Date(agora.getTime() - 23 * 60 * 60 * 1000);

  const { data: reservas24h } = await admin
    .from("lote_reservas")
    .select(`
      id, user_id, session_id, produto_id, lote_id, preco_unitario_centavos, criado_em,
      lotes!inner(status, qtd_disponivel),
      produtos!inner(nome, imagem_url)
    `)
    .eq("status", "ATIVA")
    .is("pedido_id", null)
    .gte("criado_em", limite24h_inicio.toISOString())
    .lt("criado_em", limite24h_fim.toISOString());

  for (const r of reservas24h ?? []) {
    const userId = r.user_id as string | null;
    const sessionId = r.session_id as string;
    if (!userId) continue;

    // 24H só enviado se 1H foi enviado — verificar crm_envios
    const { count: envios1h } = await admin
      .from("crm_envios")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("fluxo", "CARRINHO_ABANDONADO_1H")
      .gte("criado_em", limite24h_inicio.toISOString());
    if ((envios1h ?? 0) === 0) continue;

    // Cooldown de 24h
    const ck = keyCarrinho24h(userId);
    if (await redis.exists(ck)) continue;

    let email: string | null = null;
    let nome: string | null = null;
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();
    email = (profile?.email as string | null) ?? null;
    nome  = (profile?.full_name as string | null) ?? null;
    if (!email) continue;

    // Sem compra depois da reserva
    const { count: pedidos } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", r.criado_em as string);
    if ((pedidos ?? 0) > 0) continue;

    const produto = Array.isArray(r.produtos) ? r.produtos[0] : r.produtos;
    const unsubUrl = await criarUnsubscribeToken(userId, email, "LIFECYCLE");

    await enfileirar({
      user_id: userId,
      email,
      fluxo: "CARRINHO_ABANDONADO_24H",
      template_id: "CarrinhoAbandonado",
      subject: "Sua rotina estava quase pronta",
      metadata: {
        nome,
        versao: "editorial",
        itens_reservados: [{
          produto_nome:   produto?.nome as string ?? "",
          produto_imagem: produto?.imagem_url as string ?? "",
          preco_centavos: r.preco_unitario_centavos as number ?? 0,
          qtd_disponivel: 0, // reserva expirada — não mostrar qtd
        }],
        checkout_url: null, // 24h: checkout expirou — mostrar PDP em vez disso
        lote_esgotou: false,
        unsubscribe_url: unsubUrl,
      } satisfies Record<string, unknown>,
    });

    await redis.setex(ck, 26 * 3600, "1");
  }
}

// ─── 3 · WISHLIST_ESGOTANDO ───────────────────────────────────────────────────

/**
 * Trigger: lote de produto em wishlist entra em EM_ESGOTAMENTO.
 * Chamado por verificarEAplicarTransicao() no loteService.
 */
export async function enviarWishlistEsgotando(params: {
  produto_id: string;
  lote_id: string;
  qtd_restante: number;
}): Promise<void> {
  if (!redis) return;
  const { produto_id, lote_id, qtd_restante } = params;
  const admin = getSupabaseAdminClient();

  // Buscar produto para montar params do email
  const { data: produto } = await admin
    .from("produtos")
    .select("nome, imagem_url, preco_centavos")
    .eq("id", produto_id)
    .maybeSingle();

  if (!produto) return;

  // Buscar usuárias com produto na wishlist
  const { data: wishlist } = await admin
    .from("wishlist_itens")
    .select("user_id, profiles!inner(email, full_name)")
    .eq("produto_id", produto_id);

  for (const w of wishlist ?? []) {
    const userId = w.user_id as string;
    const profile = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
    const email   = (profile as { email: string } | null)?.email;
    const nome    = (profile as { full_name: string | null } | null)?.full_name ?? null;
    if (!email) continue;

    // Cooldown: 1 notificação por produto por usuária a cada 30 dias
    const ck = keyWishlistEsgotando(userId, produto_id);
    if (await redis.exists(ck)) continue;

    // Score de compatibilidade (se tem skin scan)
    let score_compat: number | null = null;
    const { data: perfil } = await admin
      .from("scan_skin_profiles")
      .select("scores_normalizados, tipo_pele")
      .eq("skin_scan_id", (
        await admin
          .from("skin_scans")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "CONCLUIDO")
          .order("criado_em", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data?.id ?? "")
      .maybeSingle();

    if (perfil) {
      const { calcularCompatibilidade } = await import("@/lib/skinScan/recommendationEngine");
      const produtoParaCalculo = {
        id: produto_id,
        nome: produto.nome as string,
        ativos_principais: [],
        tipo_pele_indicado: [],
        nivel_sensibilidade_max: 5,
        passo_rotina: "serum",
        periodo: "ambos" as const,
      };
      // Compatibilidade baseada no perfil mais recente
      score_compat = calcularCompatibilidade(produtoParaCalculo, {
        scan_id: "",
        tipo_pele: perfil.tipo_pele as never,
        nivel_sensibilidade: 2,
        necessidades_rankeadas: [],
        ativos_recomendados: [],
        ativos_contraindicados: [],
        scores_normalizados: perfil.scores_normalizados as Record<string, number>,
        perfil_resumo_input: {
          scan_id: "", tipo_pele: perfil.tipo_pele as never, nivel_sensibilidade: 2,
          fitzpatrick_estimado: 2, necessidades_rankeadas: [], ativos_recomendados: [],
          ativos_contraindicados: [], scores_normalizados: {} as never, focos_selecionados: [],
          confidence_geral: 0.8, flags: [],
        },
      });
    }

    const unsubUrl = await criarUnsubscribeToken(userId, email, "LIFECYCLE");
    const checkoutUrl = `${SITE_URL}/produto/${produto_id}`;

    await enfileirar({
      user_id: userId,
      email,
      fluxo: "WISHLIST_ESGOTANDO",
      template_id: "WishlistEsgotando",
      subject: `${produto.nome as string} está com poucas unidades`,
      produto_id,
      metadata: {
        nome,
        produto_nome:    produto.nome,
        produto_imagem:  produto.imagem_url,
        preco_centavos:  produto.preco_centavos,
        qtd_restante,
        score_compat,
        checkout_url:    checkoutUrl,
        unsubscribe_url: unsubUrl,
      } satisfies Record<string, unknown>,
    });

    await redis.setex(ck, 30 * 24 * 3600, "1"); // 30 dias
  }
}

// ─── 4 · TIER_RISCO_REBAIXAMENTO ──────────────────────────────────────────────

/**
 * Trigger: popclubTierReview job detecta data_rebaixamento_aviso = hoje.
 * Reutiliza AvisoRebaixamentoPayload — não recalcula.
 */
export async function enviarTierRiscoRebaixamento(
  payload: AvisoRebaixamentoPayload
): Promise<void> {
  if (!redis) return;
  const {
    user_id, email, nome, tier_atual, tier_risco,
    pontos_acumulados_12m, pontos_necessarios, pontos_faltando,
    data_avaliacao, dias_para_avaliacao,
  } = payload;

  const unsubUrl = await criarUnsubscribeToken(user_id, email, "LIFECYCLE");

  // Agendado para 9h no timezone da usuária (padrão: America/Sao_Paulo)
  const agendadoPara = new Date();
  agendadoPara.setUTCHours(12, 0, 0, 0); // 9h BRT = 12h UTC
  if (agendadoPara < new Date()) agendadoPara.setUTCDate(agendadoPara.getUTCDate() + 1);

  await enfileirar({
    user_id,
    email,
    fluxo: "TIER_RISCO_REBAIXAMENTO",
    template_id: "TierRiscoRebaixamento",
    subject: `Seu tier ${tier_atual} no PopClub está em risco`,
    agendado_para: agendadoPara,
    metadata: {
      nome,
      tier_atual,
      tier_risco,
      pontos_acumulados_12m,
      pontos_necessarios,
      pontos_faltando,
      data_avaliacao:       data_avaliacao.toISOString().split("T")[0],
      dias_para_avaliacao,
      unsubscribe_url: unsubUrl,
    } satisfies Record<string, unknown>,
  });
}

// ─── 5 + 6 · REATIVACAO ───────────────────────────────────────────────────────

/**
 * Trigger: usuária sem compra E sem scan nos últimos 30/60 dias.
 * Verificado diariamente às 10h.
 * Para _60D: crédito PopClub de R$20 criado ANTES do envio.
 */
export async function verificarReativacao(): Promise<void> {
  if (!redis) return;
  const admin = getSupabaseAdminClient();
  const agora = new Date();

  const limite30d = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
  const limite45d = new Date(agora.getTime() - 45 * 24 * 60 * 60 * 1000);
  const limite60d = new Date(agora.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Usuárias sem atividade (usando last_order_at como proxy)
  const { data: usuarios } = await admin
    .from("profiles")
    .select("id, email, full_name, last_order_at")
    .lt("last_order_at", limite30d.toISOString())
    .not("email", "is", null);

  // Produtos novos nos últimos 30 dias para a curadoria de reativação
  const { data: produtosNovos } = await admin
    .from("products")
    .select("name, image_url, price_cents, slug")
    .gte("created_at", limite30d.toISOString())
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(3);

  const produtosLista = (produtosNovos ?? []).map((p) => ({
    nome:           p.name as string,
    imagem:         p.image_url as string ?? "",
    preco_centavos: p.price_cents as number ?? 0,
    slug:           p.slug as string ?? "",
  }));

  for (const u of usuarios ?? []) {
    const userId = u.id as string;
    const email  = u.email as string;
    const nome   = (u.full_name as string | null) ?? null;
    const lastActivity = new Date(u.last_order_at as string);
    const diasInativo = Math.floor((agora.getTime() - lastActivity.getTime()) / 86_400_000);

    // ── REATIVACAO_30D: 30–45 dias inativo ───────────────────────────────────
    if (diasInativo >= 30 && diasInativo < 45) {
      const ck = keyReativacao(userId, "30D");
      if (await redis.exists(ck)) continue;

      // Verificar se já enviou _30D recentemente (DB como fallback)
      const { count: envios30d } = await admin
        .from("crm_envios")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("fluxo", "REATIVACAO_30D")
        .gte("criado_em", limite45d.toISOString());
      if ((envios30d ?? 0) > 0) continue;

      const unsubUrl = await criarUnsubscribeToken(userId, email, "LIFECYCLE");
      await enfileirar({
        user_id: userId, email,
        fluxo: "REATIVACAO_30D",
        template_id: "Reativacao",
        subject: "O que há de novo na BelaPop",
        metadata: {
          nome, versao: "30d", dias_inativo: diasInativo,
          produtos_novos: produtosLista,
          entrar_popclub: false,
          unsubscribe_url: unsubUrl,
        } satisfies Record<string, unknown>,
      });

      await redis.setex(ck, 30 * 24 * 3600, "1");
    }

    // ── REATIVACAO_60D: 60+ dias + _30D enviado ───────────────────────────────
    if (diasInativo >= 60) {
      const ck = keyReativacao(userId, "60D");
      if (await redis.exists(ck)) continue;

      // Só enviar se _30D foi enviado
      const { count: envios30d } = await admin
        .from("crm_envios")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("fluxo", "REATIVACAO_30D")
        .gte("criado_em", new Date(agora.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString());
      if ((envios30d ?? 0) === 0) continue;

      // Verificar se é membro PopClub
      const { data: membro } = await admin
        .from("popclub_memberships")
        .select("id, tier_atual")
        .eq("user_id", userId)
        .eq("status", "ATIVO")
        .maybeSingle();

      const entrar_popclub = !membro;

      // Criar crédito de R$20 ANTES de enviar — nunca promessa vazia
      let credito_valor: number | undefined;
      let credito_id: string | undefined;
      const CREDITO_REATIVACAO_CENTS = 2000;

      const { data: creditoRow } = await admin
        .from("popclub_credits")
        .insert({
          user_id: userId,
          valor_centavos: CREDITO_REATIVACAO_CENTS,
          descricao: "Crédito de reativação",
          expira_em: new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          fluxo_origem: "REATIVACAO_60D",
        })
        .select("id")
        .single();

      if (creditoRow) {
        credito_valor = 20;
        credito_id    = creditoRow.id as string;
      }

      const unsubUrl = await criarUnsubscribeToken(userId, email, "LIFECYCLE");
      await enfileirar({
        user_id: userId, email,
        fluxo: "REATIVACAO_60D",
        template_id: "Reativacao",
        subject: `Sentimos sua falta${nome ? `, ${nome.split(" ")[0]}` : ""}`,
        metadata: {
          nome, versao: "60d", dias_inativo: diasInativo,
          produtos_novos: produtosLista,
          credito_valor, credito_id, entrar_popclub,
          unsubscribe_url: unsubUrl,
        } satisfies Record<string, unknown>,
      });

      await redis.setex(ck, 60 * 24 * 3600, "1");
    }
  }
}
