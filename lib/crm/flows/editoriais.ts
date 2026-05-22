/**
 * Fluxos editoriais — curadoria, waitlist, urgência de lote e recompra.
 * Tom BelaPop: atelier com estoque controlado, nunca liquidação.
 *
 * Tom PROIBIDO em todos os envios deste módulo:
 *   ✗ "última chance"  ✗ "corra"  ✗ "urgente"  ✗ "não perca"  ✗ "!"  nos títulos
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { enfileirar, redis } from "@/lib/crm/deliveryQueue";
import { criarUnsubscribeToken } from "@/lib/crm/unsubscribeToken";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://belapopoficial.com.br";

// ─── Redis keys ───────────────────────────────────────────────────────────────

function keyCuradoria(user_id: string): string {
  return `crm:curadoria:${user_id}`;
}
function keyLoteEsgotando(user_id: string, produto_id: string): string {
  return `crm:lote-esgotando:${user_id}:${produto_id}`;
}
function keyRecompra(user_id: string, produto_id: string): string {
  return `crm:recompra:${user_id}:${produto_id}`;
}

// ─── 15 · CURADORIA_SEMANAL ───────────────────────────────────────────────────

/**
 * Toda segunda às 8h. Segmentada por tipo_pele_atual do Digital Twin.
 * Se tipo_pele disponível: rankeia por compatibilidade.
 * Se não: curadoria geral (top 6 por vendas da semana).
 */
export async function enviarCuradoriaSemanal(): Promise<void> {
  if (!redis) return;

  const admin = getSupabaseAdminClient();
  const agora = new Date();

  // Semana do ano
  const startOfYear = new Date(agora.getFullYear(), 0, 0);
  const semana_numero = Math.ceil(
    ((agora.getTime() - startOfYear.getTime()) / 86_400_000 + startOfYear.getDay() + 1) / 7
  );

  // Domingo às 23h como fechamento
  const proximoDomingo = new Date(agora);
  const diaSemana = agora.getDay();
  proximoDomingo.setDate(agora.getDate() + (7 - diaSemana));
  proximoDomingo.setHours(23, 0, 0, 0);
  const data_fechamento = proximoDomingo.toLocaleDateString("pt-BR", {
    weekday: "long", hour: "2-digit", minute: "2-digit",
  });

  // Lotes ABERTO ou EM_ESGOTAMENTO desta semana
  const { data: lotes } = await admin
    .from("lotes")
    .select(`
      id, status, qtd_disponivel, qtd_total,
      produtos!inner(id, nome, imagem_url, preco_centavos, ativos_principais, tipo_pele_indicado, nivel_sensibilidade_max, passo_rotina, periodo)
    `)
    .in("status", ["ABERTO", "EM_ESGOTAMENTO"])
    .not("produto_id", "is", null)
    .limit(20);

  if (!lotes || lotes.length === 0) return;

  // Usuárias ativas (com pelo menos 1 compra ou scan)
  const { data: usuarios } = await admin
    .from("profiles")
    .select(`
      id, email, full_name,
      skin_twins(id, tipo_pele_atual, total_scans),
      popclub_memberships(id, tier_atual, status)
    `)
    .not("email", "is", null)
    .not("last_order_at", "is", null)
    .limit(500);

  for (const u of usuarios ?? []) {
    const userId  = u.id as string;
    const email   = u.email as string;
    const nome    = (u.full_name as string | null) ?? null;

    // Cooldown 6 dias
    const ck = keyCuradoria(userId);
    if (await redis.exists(ck)) continue;

    const twin     = Array.isArray(u.skin_twins) ? u.skin_twins[0] : u.skin_twins;
    const membro   = (Array.isArray(u.popclub_memberships) ? u.popclub_memberships[0] : u.popclub_memberships) as
      { id: string; tier_atual: string; status: string } | null;
    const tipoPele = (twin as { tipo_pele_atual?: string | null } | null)?.tipo_pele_atual ?? null;
    const ehMembro = !!membro && (membro as { status: string }).status === "ATIVO";

    type ProdutoLote = {
      id: string;
      nome: string;
      imagem_url: string;
      preco_centavos: number;
      ativos_principais: string[];
      tipo_pele_indicado: string[];
      nivel_sensibilidade_max: number;
      passo_rotina: string;
      periodo: string;
    };

    type LoteItem = {
      id: string;
      status: string;
      qtd_disponivel: number;
      qtd_total: number;
      produtos: ProdutoLote | ProdutoLote[];
    };

    // Rankear produtos
    let produtosRankeados = (lotes as LoteItem[]).map((lote) => {
      const prod = Array.isArray(lote.produtos) ? lote.produtos[0] : lote.produtos;
      const pctDisponivel = lote.qtd_total > 0 ? lote.qtd_disponivel / lote.qtd_total : 1;
      const urgencia_level: "none" | "low" | "high" =
        lote.status === "EM_ESGOTAMENTO" || pctDisponivel <= 0.1
          ? "high"
          : pctDisponivel <= 0.3
            ? "low"
            : "none";

      return {
        produto_id:     prod.id,
        nome:           prod.nome,
        imagem:         prod.imagem_url,
        preco_centavos: prod.preco_centavos,
        score_compat:   null as number | null,
        acesso_antecipado_horas: undefined as number | undefined,
        urgencia_level,
        texto_estoque:
          urgencia_level === "high"
            ? `${lote.qtd_disponivel} unidades`
            : undefined,
        _prod_raw: prod,
      };
    });

    // Personalizar por tipo_pele se disponível
    if (tipoPele) {
      const { calcularCompatibilidade } = await import("@/lib/skinScan/recommendationEngine");
      produtosRankeados = produtosRankeados.map((item) => {
        const p = item._prod_raw;
        const score = calcularCompatibilidade(
          {
            id: p.id,
            nome: p.nome,
            ativos_principais:       (p.ativos_principais ?? []) as string[],
            tipo_pele_indicado:      (p.tipo_pele_indicado ?? []) as string[],
            nivel_sensibilidade_max: p.nivel_sensibilidade_max ?? 5,
            passo_rotina:            p.passo_rotina ?? "serum",
            periodo:                 (p.periodo ?? "ambos") as "manha" | "noite" | "ambos",
          },
          {
            scan_id: "", tipo_pele: tipoPele as never, nivel_sensibilidade: 2,
            necessidades_rankeadas: [], ativos_recomendados: [], ativos_contraindicados: [],
            scores_normalizados: {} as never, perfil_resumo_input: {
              scan_id: "", tipo_pele: tipoPele as never, nivel_sensibilidade: 2,
              fitzpatrick_estimado: 2, necessidades_rankeadas: [], ativos_recomendados: [],
              ativos_contraindicados: [], scores_normalizados: {} as never, focos_selecionados: [],
              confidence_geral: 0.8, flags: [],
            },
          }
        );
        return { ...item, score_compat: score };
      });

      // Filtrar e rankear: score >= 60 em primeiro
      produtosRankeados.sort((a, b) => (b.score_compat ?? 0) - (a.score_compat ?? 0));
    }

    // Acesso antecipado para membros PopClub
    if (ehMembro) {
      const tier  = (membro as { tier_atual: string }).tier_atual;
      const horas = tier === "LUXO" ? 72 : tier === "PREMIUM" ? 48 : 24;
      produtosRankeados = produtosRankeados.map((p) => ({ ...p, acesso_antecipado_horas: horas }));
    }

    const top6 = produtosRankeados.slice(0, 6).map(({ _prod_raw: _, ...rest }) => rest);
    if (top6.length === 0) continue;

    const produto_destaque = top6[0];
    const unsubUrl = await criarUnsubscribeToken(userId, email, "EDITORIAL");

    await enfileirar({
      user_id:     userId,
      email,
      fluxo:       "CURADORIA_SEMANAL",
      template_id: "CuradoriaSemanal",
      subject:     `Curadoria da semana · encerra ${data_fechamento}`,
      metadata: {
        nome, semana_numero, data_fechamento,
        produtos:         top6,
        produto_destaque,
        tipo_pele:        tipoPele,
        eh_membro_popclub: ehMembro,
        unsubscribe_url:  unsubUrl,
      } satisfies Record<string, unknown>,
    });

    await redis.setex(ck, 6 * 24 * 3600, "1"); // 6 dias
  }
}

// ─── 16 · WAITLIST_PRODUTO ────────────────────────────────────────────────────

/**
 * Chamado por dispararNotificacaoListaEspera() no loteService ao lote voltar.
 */
export async function enviarWaitlistProduto(params: {
  produto_id:  string;
  lote_id:     string;
  situacao:    "ABERTO" | "REPOSICAO_PREVISTA";
  qtd_disponivel?:   number | null;
  data_reposicao?:   string | null;
}): Promise<void> {
  const { produto_id, lote_id, situacao, qtd_disponivel, data_reposicao } = params;
  const admin = getSupabaseAdminClient();

  const { data: produto } = await admin
    .from("produtos")
    .select("nome, imagem_url, preco_centavos")
    .eq("id", produto_id)
    .maybeSingle();

  if (!produto) return;

  const { data: espera } = await admin
    .from("lote_lista_espera")
    .select("user_id, email, nome")
    .eq("produto_id", produto_id)
    .is("notificado_em", null);

  for (const item of espera ?? []) {
    const userId = item.user_id as string | null;
    const email  = item.email as string;
    const nome   = item.nome as string | null;
    if (!email) continue;

    // Score de compatibilidade (se tem skin scan e user logado)
    let score_compat: number | null = null;
    let eh_membro_popclub = false;
    let antecipacao_horas: number | undefined;

    if (userId) {
      const { data: membro } = await admin
        .from("popclub_memberships")
        .select("tier_atual, status")
        .eq("user_id", userId)
        .eq("status", "ATIVO")
        .maybeSingle();

      if (membro) {
        eh_membro_popclub = true;
        const tier = membro.tier_atual as string;
        antecipacao_horas = tier === "LUXO" ? 72 : tier === "PREMIUM" ? 48 : 24;
      }
    }

    const unsubUrl = userId
      ? await criarUnsubscribeToken(userId, email, "EDITORIAL")
      : `${SITE_URL}/conta/preferencias`;

    const subject =
      situacao === "ABERTO"
        ? `${produto.nome as string} voltou — e com ${qtd_disponivel ?? "novas"} unidades`
        : `${produto.nome as string} chega em ${data_reposicao ?? "breve"}`;

    await enfileirar({
      user_id:     userId ?? email,
      email,
      fluxo:       "WAITLIST_PRODUTO",
      template_id: "WaitlistProduto",
      subject,
      produto_id,
      metadata: {
        nome,
        produto_nome:     produto.nome,
        produto_imagem:   produto.imagem_url,
        preco_centavos:   produto.preco_centavos,
        situacao,
        qtd_disponivel:   qtd_disponivel ?? null,
        data_reposicao:   data_reposicao ?? null,
        score_compat,
        eh_membro_popclub,
        antecipacao_horas: antecipacao_horas ?? null,
        url_produto:      `${SITE_URL}/produto/${produto_id}`,
        unsubscribe_url:  unsubUrl,
      } satisfies Record<string, unknown>,
    });
  }
}

// ─── 17 · LOTE_ESGOTANDO ─────────────────────────────────────────────────────

/**
 * Trigger: lote transita para urgencia_level = 'high' (qtd <= 10%).
 * Disparado por verificarEAplicarTransicao() no loteService.
 */
export async function enviarLoteEsgotando(params: {
  lote_id:   string;
  produto_id: string;
}): Promise<void> {
  if (!redis) return;

  const { lote_id, produto_id } = params;
  const admin = getSupabaseAdminClient();

  const [produtoResult, loteResult] = await Promise.all([
    admin.from("produtos").select("nome, imagem_url, preco_centavos").eq("id", produto_id).maybeSingle(),
    admin.from("lotes").select("qtd_disponivel").eq("id", lote_id).maybeSingle(),
  ]);

  if (!produtoResult.data || !loteResult.data) return;

  const produto = produtoResult.data;
  const qtd_restante = loteResult.data.qtd_disponivel as number ?? 0;

  // Buscar usuárias com produto na wishlist (principal gatilho)
  const { data: wishlist } = await admin
    .from("wishlist_itens")
    .select("user_id")
    .eq("produto_id", produto_id);

  const userIds = new Set((wishlist ?? []).map((w) => w.user_id as string).filter(Boolean));

  for (const userId of userIds) {
    // Cooldown: 7 dias por produto por usuária
    const ck = keyLoteEsgotando(userId, produto_id);
    if (await redis.exists(ck)) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    const email = (profile?.email as string | null) ?? null;
    const nome  = (profile?.full_name as string | null) ?? null;
    if (!email) continue;

    const unsubUrl = await criarUnsubscribeToken(userId, email, "EDITORIAL");

    await enfileirar({
      user_id:     userId,
      email,
      fluxo:       "LOTE_ESGOTANDO",
      template_id: "LoteEsgotando",
      subject:     `Poucas unidades restantes de ${produto.nome as string}`,
      produto_id,
      metadata: {
        nome,
        produto_nome:    produto.nome,
        produto_imagem:  produto.imagem_url,
        preco_centavos:  produto.preco_centavos,
        qtd_restante,
        url_produto:     `${SITE_URL}/produto/${produto_id}`,
        score_compat:    null,
        unsubscribe_url: unsubUrl,
      } satisfies Record<string, unknown>,
    });

    await redis.setex(ck, 7 * 24 * 3600, "1"); // 7 dias
  }
}

// ─── 18 · RECOMPRA_ASSISTIDA ──────────────────────────────────────────────────

/**
 * Canal e-mail do Copilot NudgeRecompra.
 * Verificado diariamente às 14h.
 */
export async function verificarRecompra(): Promise<void> {
  if (!redis) return;

  const admin = getSupabaseAdminClient();

  // Buscar produtos da rotina com previsão de esgotamento em até 7 dias
  const { data: rotinas } = await admin
    .from("scan_rotinas")
    .select(`
      skin_scan_id, periodo, rotina,
      skin_scans!inner(user_id, status, profiles!inner(email, full_name))
    `)
    .eq("skin_scans.status", "CONCLUIDO")
    .not("skin_scans.user_id", "is", null);

  for (const r of rotinas ?? []) {
    const scan  = Array.isArray(r.skin_scans) ? r.skin_scans[0] : r.skin_scans;
    const userId = (scan as { user_id: string } | null)?.user_id;
    const profile = (scan as { profiles: unknown } | null)?.profiles;
    const profileData = Array.isArray(profile) ? profile[0] : profile;
    const email = (profileData as { email?: string } | null)?.email ?? null;
    const nome  = (profileData as { full_name?: string | null } | null)?.full_name ?? null;
    if (!userId || !email) continue;

    const passos = (r.rotina as { passos?: Array<{
      produto_nome: string;
      produto_id: string;
      imagem_url?: string;
      ativo_principal?: string;
      marcador_alvo?: string;
      dias_restantes?: number;
      dias_usados?: number;
    }> } | null)?.passos ?? [];

    const urgentes = passos.filter((p) => (p.dias_restantes ?? 99) <= 7);
    if (urgentes.length === 0) continue;

    const prod = urgentes[0];

    // Cooldown 30 dias por produto por usuária
    const ck = keyRecompra(userId, prod.produto_id ?? "");
    if (await redis.exists(ck)) continue;

    // Verificar se lote disponível
    const { count: lotesAbertos } = await admin
      .from("lotes")
      .select("id", { count: "exact", head: true })
      .eq("produto_id", prod.produto_id ?? "")
      .in("status", ["ABERTO", "EM_ESGOTAMENTO"]);

    // Delta do marcador (buscar do twin)
    let delta_marcador = 0;
    const { data: twin } = await admin
      .from("skin_twins")
      .select("scores_baseline, twin_snapshots(scores_normalizados, numero_sequencia)")
      .eq("user_id", userId)
      .maybeSingle();

    if (twin && prod.marcador_alvo) {
      const snapshots = (Array.isArray(twin.twin_snapshots) ? twin.twin_snapshots : [twin.twin_snapshots])
        .filter(Boolean)
        .sort((a: { numero_sequencia: number }, b: { numero_sequencia: number }) => b.numero_sequencia - a.numero_sequencia);
      const ultimo = snapshots[0] as { scores_normalizados: Record<string, number> } | undefined;
      if (ultimo) {
        const baseline = (twin.scores_baseline as Record<string, number>)[prod.marcador_alvo] ?? 0;
        const atual = ultimo.scores_normalizados[prod.marcador_alvo] ?? 0;
        delta_marcador = Math.max(0, Math.round(baseline - atual)); // sempre positivo para usuário
      }
    }

    const { data: produtoData } = await admin
      .from("produtos")
      .select("nome, imagem_url, preco_centavos")
      .eq("id", prod.produto_id ?? "")
      .maybeSingle();

    if (!produtoData) continue;

    const unsubUrl = await criarUnsubscribeToken(userId, email, "EDITORIAL");

    await enfileirar({
      user_id:     userId,
      email,
      fluxo:       "RECOMPRA_ASSISTIDA",
      template_id: "RecompraAssistida",
      subject:     `${produtoData.nome as string} está chegando ao fim`,
      produto_id:  prod.produto_id,
      metadata: {
        nome,
        produto_nome:    produtoData.nome,
        produto_imagem:  produtoData.imagem_url,
        preco_centavos:  produtoData.preco_centavos,
        ativo_principal: prod.ativo_principal ?? "",
        marcador_alvo:   prod.marcador_alvo ?? "",
        dias_usados:     prod.dias_usados ?? 0,
        dias_restantes:  prod.dias_restantes ?? 0,
        delta_marcador,
        url_produto:     `${SITE_URL}/produto/${prod.produto_id}`,
        lote_disponivel: (lotesAbertos ?? 0) > 0,
        unsubscribe_url: unsubUrl,
      } satisfies Record<string, unknown>,
    });

    await redis.setex(ck, 30 * 24 * 3600, "1");
  }
}
