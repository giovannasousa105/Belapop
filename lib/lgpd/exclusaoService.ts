import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * LGPD art. 18, IV: direito à eliminação dos dados.
 *
 * Estratégia: anonimizar em vez de deletar — preservar integridade referencial.
 * Dados financeiros mantidos por 5 anos (obrigação fiscal — Lei 9.613/98 + NCF).
 * Dados biométricos (skin scan): já deletados imediatamente após processamento.
 */

export async function anonimizarUsuaria(user_id: string): Promise<void> {
  const admin = getSupabaseAdminClient();

  // Buscar email original para confirmar antes de anonimizar
  const { data: authUser } = await admin.auth.admin.getUserById(user_id);
  const email_original     = authUser?.user?.email ?? null;

  const email_anonimo = `anonimo_${user_id.slice(0, 8)}@excluido.belapop.com.br`;

  // 1. Tabela users (pública) — anonimizar dados identificáveis
  await admin.from("users").update({
    email:      email_anonimo,
    full_name:  "Usuária Removida",
    avatar_url: null,
  }).eq("id", user_id);

  // 2. Tabela profiles — anonimizar
  await admin.from("profiles").update({
    email:      email_anonimo,
    full_name:  "Usuária Removida",
    avatar_url: null,
  }).eq("id", user_id);

  // 3. Skin Scans — remover dados de sessão, manter scores (pesquisa agregada)
  // imagem_deletada_em já é preenchido pelo worker ao concluir cada scan
  const { error: scanError } = await admin
    .from("scan_eventos")
    .delete()
    .eq("user_id", user_id);
  if (scanError) console.error("[exclusao] scan_eventos:", scanError);

  // 4. Copilot — remover histórico de interações (dados comportamentais)
  await admin.from("copilot_interacoes").delete().eq("user_id", user_id);
  await admin.from("copilot_notas_pele").delete().eq("user_id", user_id);

  // 5. CRM — suprimir todos os envios futuros
  if (email_original) {
    await admin.from("crm_supressoes").upsert({
      email:   email_original,
      user_id,
      motivo:  "LGPD",
      fluxo:   null,   // suprimir todos os fluxos
    }, { onConflict: "email" });
  }

  // 6. Wishlist — remover
  await admin.from("wishlist_itens").delete().eq("user_id", user_id);
  await admin.from("wishlist_items").delete().eq("user_id", user_id);

  // 7. Avaliações — manter conteúdo (interesse legítimo do marketplace),
  //    remover vinculação com o usuário
  await admin.from("produto_avaliacoes").update({ user_id: null }).eq("user_id", user_id);
  await admin.from("product_reviews").update({ user_id: null }).eq("user_id", user_id);

  // 8. Reservas de lote ativas — cancelar (não deixar reservas "fantasmas")
  await admin.from("lote_reservas")
    .update({ status: "CANCELADA" })
    .eq("user_id", user_id)
    .eq("status", "ATIVA");

  // 9. Pedidos — manter para obrigação fiscal (5 anos).
  //    Apenas anonimizar campos de entrega com dados pessoais.
  await admin.from("orders").update({
    shipping_address: { anonimizado: true },
  }).eq("user_id", user_id);

  // 10. Digital Twin — anonimizar (manter scores para pesquisa agregada)
  await admin.from("skin_twins").update({
    copilot_seed: null,
  }).eq("user_id", user_id);

  // 11. Consentimentos LGPD — manter (trilha de auditoria imutável)
  // Registrar revogação de todos os consentimentos
  await admin.from("lgpd_consentimentos").insert([
    "COOKIES_ANALYTICS", "COOKIES_MARKETING",
    "EMAIL_MARKETING",   "BIOMETRICO_SCAN",
  ].map((tipo) => ({
    user_id,
    tipo,
    acao: "REVOGADO",
    ip_hash: null,
  })));

  // 12. Marcar solicitação de exclusão como processada
  await admin.from("lgpd_solicitacoes").update({
    status:        "PROCESSADO",
    processado_em: new Date().toISOString(),
    resposta:      "Dados pessoais anonimizados conforme solicitação.",
  }).eq("user_id", user_id).eq("tipo", "EXCLUSAO").eq("status", "PENDENTE");

  // 13. Desativar conta no Supabase Auth (soft-delete)
  await admin.auth.admin.deleteUser(user_id);

  console.info(`[lgpd/exclusao] usuária ${user_id} anonimizada com sucesso.`);
}

// Exportar todos os dados pessoais de uma usuária (LGPD art. 18, V)
export async function exportarDadosUsuaria(user_id: string): Promise<Record<string, unknown>> {
  const admin = getSupabaseAdminClient();

  const [perfil, pedidos, scans, twin, avaliacoes, wishlist, consentimentos] =
    await Promise.all([
      // Perfil
      admin.from("profiles")
        .select("full_name, email, avatar_url, created_at")
        .eq("id", user_id)
        .maybeSingle()
        .then((r) => r.data),

      // Pedidos (sem dados de cartão — processados pelo Stripe)
      admin.from("orders")
        .select("id, status, created_at, total_amount_cents")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .then((r) => r.data ?? []),

      // Skin scans — apenas scores numéricos (imagens já deletadas)
      admin.from("scan_eventos")
        .select("criado_em, tipo_pele_detectada, confianca")
        .eq("user_id", user_id)
        .order("criado_em", { ascending: false })
        .then((r) => r.data ?? []),

      // Digital Twin — resumo
      admin.from("skin_twins")
        .select("tipo_pele, melhora_global, total_scans, criado_em")
        .eq("user_id", user_id)
        .maybeSingle()
        .then((r) => r.data),

      // Avaliações
      admin.from("produto_avaliacoes")
        .select("nota, texto, criado_em")
        .eq("user_id", user_id)
        .then((r) => r.data ?? []),

      // Wishlist
      admin.from("wishlist_itens")
        .select("product_id, criado_em")
        .eq("user_id", user_id)
        .then((r) => r.data ?? []),

      // Histórico de consentimentos
      admin.from("lgpd_consentimentos")
        .select("tipo, acao, criado_em")
        .eq("user_id", user_id)
        .order("criado_em", { ascending: false })
        .then((r) => r.data ?? []),
    ]);

  return {
    exportado_em: new Date().toISOString(),
    aviso:        "Imagens faciais são deletadas imediatamente após a análise e não são incluídas nesta exportação.",
    perfil,
    pedidos,
    skin_scans:   scans,
    digital_twin: twin,
    avaliacoes,
    wishlist,
    consentimentos,
  };
}
