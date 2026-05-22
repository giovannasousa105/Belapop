/**
 * Fluxos de e-mail conectados ao Digital Twin e ao Copilot.
 * Canal de e-mail para usuárias sem push ativo ou inativas no app.
 */

import { createHmac } from "crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { enfileirar } from "@/lib/crm/deliveryQueue";
import { criarUnsubscribeToken } from "@/lib/crm/unsubscribeToken";

const SITE_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://belapopoficial.com.br";
const HMAC_SECRET = process.env.CRM_CHECKIN_SECRET  ?? "dev-checkin-secret";

// ─── HMAC para links de check-in ─────────────────────────────────────────────
// Cada link carrega um token HMAC para verificar que não foi forjado.
// Não usa JWT — é um HMAC simples de 16 hex chars (8 bytes de entropia).

export function gerarTokenCheckin(envio_id: string, nota: number): string {
  return createHmac("sha256", HMAC_SECRET)
    .update(`${envio_id}:${nota}`)
    .digest("hex")
    .slice(0, 16);
}

export function verificarTokenCheckin(
  envio_id: string,
  nota: number,
  token: string
): boolean {
  return gerarTokenCheckin(envio_id, nota) === token;
}

function gerarLinksResposta(envio_id: string): CheckinLinksResposta {
  const link = (nota: number) => {
    const token = gerarTokenCheckin(envio_id, nota);
    return `${SITE_URL}/api/crm/checkin?envio_id=${envio_id}&resposta=${nota}&token=${token}`;
  };
  return {
    otima:     link(5),
    boa:       link(4),
    normal:    link(3),
    sensivel:  link(2),
    irritacao: link(1),
  };
}

export interface CheckinLinksResposta {
  otima:     string;
  boa:       string;
  normal:    string;
  sensivel:  string;
  irritacao: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isUltimoDomingoDoMes(data: Date): boolean {
  const ano  = data.getFullYear();
  const mes  = data.getMonth();
  const dia  = data.getDay();
  if (dia !== 0) return false; // não é domingo

  // O próximo domingo está em outro mês = este é o último
  const proximoDomingo = new Date(data);
  proximoDomingo.setDate(data.getDate() + 7);
  return proximoDomingo.getMonth() !== mes || proximoDomingo.getFullYear() !== ano;
}

// ─── 11 · CHECKIN_SEMANAL ─────────────────────────────────────────────────────

export interface CheckinSemanalEmailParams {
  email:             string;
  user_id:           string;
  nome:              string | null;
  mensagem_copilot:  string;
  marcador_foco:     string;
  streak_dias:       number;
  links_resposta:    CheckinLinksResposta;
}

/**
 * Enfileira CHECKIN_SEMANAL para uma usuária específica.
 * O envio_id é gerado pelo deliveryQueue — os links são gerados antes do INSERT
 * usando um ID determinístico (user_id + data da semana).
 */
export async function enviarCheckinSemanal(
  params: CheckinSemanalEmailParams
): Promise<void> {
  // Gerar envio_id determinístico para que os links possam ser incluídos no template
  // Formato: checkin:{user_id}:{ISO week}
  const semana = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const envio_id_temp = `checkin:${params.user_id}:${semana}`;
  const links = gerarLinksResposta(envio_id_temp);

  const unsubUrl = await criarUnsubscribeToken(params.user_id, params.email, "PELE");

  await enfileirar({
    user_id:     params.user_id,
    email:       params.email,
    fluxo:       "CHECKIN_SEMANAL",
    template_id: "CheckinSemanal",
    subject:     "Como está sua pele esta semana?",
    metadata: {
      nome:             params.nome,
      mensagem_copilot: params.mensagem_copilot,
      marcador_foco:    params.marcador_foco,
      streak_dias:      params.streak_dias,
      envio_id:         envio_id_temp,
      links_resposta:   links,
      unsubscribe_url:  unsubUrl,
    } satisfies Record<string, unknown>,
  });
}

// ─── 12 · PROGRESSO_TWIN_MENSAL ───────────────────────────────────────────────

/**
 * Trigger: último domingo do mês, para membros com >= 2 scans.
 * Chamado pelo crmScheduler com verificação de isUltimoDomingoDoMes().
 */
export async function enviarProgressoMensal(): Promise<void> {
  const agora = new Date();
  if (!isUltimoDomingoDoMes(agora)) return; // Não é o último domingo

  const admin = getSupabaseAdminClient();
  const umMesAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Twins com >= 2 scans E pelo menos 1 snapshot no último mês
  const { data: twins } = await admin
    .from("skin_twins")
    .select(`
      id, user_id, total_scans, scores_baseline, tipo_pele_atual, ultimo_scan_em, primeiro_scan_em,
      profiles!inner(email, full_name),
      twin_snapshots!inner(id, scores_normalizados, criado_em, numero_sequencia)
    `)
    .gte("total_scans", 2)
    .gte("ultimo_scan_em", umMesAtras.toISOString())
    .not("user_id", "is", null);

  for (const twin of twins ?? []) {
    const userId  = twin.user_id as string;
    const profile = Array.isArray(twin.profiles) ? twin.profiles[0] : twin.profiles;
    const email   = (profile as { email: string } | null)?.email;
    const nome    = (profile as { full_name: string | null } | null)?.full_name ?? null;
    if (!email) continue;

    // Buscar snapshots do último mês
    const snapshots = (Array.isArray(twin.twin_snapshots) ? twin.twin_snapshots : [twin.twin_snapshots])
      .filter(Boolean)
      .filter((s: { criado_em: string }) => s.criado_em >= umMesAtras.toISOString())
      .sort((a: { numero_sequencia: number }, b: { numero_sequencia: number }) =>
        b.numero_sequencia - a.numero_sequencia
      );

    if (snapshots.length === 0) continue;

    const ultimoSnapshot = snapshots[0] as { id: string; scores_normalizados: Record<string, number>; criado_em: string };
    const primeiroSnapshot = snapshots[snapshots.length - 1] as { scores_normalizados: Record<string, number> };

    // Encontrar marcador com maior melhora absoluta no mês
    const baseline = twin.scores_baseline as Record<string, number>;
    const atual    = ultimoSnapshot.scores_normalizados;
    const scoresAnterior = primeiroSnapshot.scores_normalizados;

    type Marcador = { marcador: string; delta: number };
    const deltas: Marcador[] = Object.keys(atual)
      .map((m) => ({ marcador: m, delta: (scoresAnterior[m] ?? 0) - (atual[m] ?? 0) }))
      .filter((d) => d.delta > 0) // só melhoras
      .sort((a, b) => b.delta - a.delta);

    if (deltas.length === 0) continue; // sem melhora no mês — skip

    const melhor = deltas[0];

    // Calcular semanas desde início
    const primeiro_scan_em = twin.primeiro_scan_em as string | null;
    const semanas = primeiro_scan_em
      ? Math.floor((agora.getTime() - new Date(primeiro_scan_em).getTime()) / (7 * 24 * 60 * 60 * 1000))
      : 0;

    // Melhora global vs baseline
    const totalDelta = Object.keys(atual).reduce((acc, m) => acc + ((baseline[m] ?? 0) - (atual[m] ?? 0)), 0);
    const melhora_global_pct = Math.max(0, (totalDelta / Object.keys(atual).length / 100) * 100);

    // Buscar skin_id para URL pública
    const { data: scan } = await admin
      .from("skin_scans")
      .select("skin_id")
      .eq("id", (
        await admin
          .from("twin_snapshots")
          .select("scan_id")
          .eq("id", ultimoSnapshot.id)
          .maybeSingle()
      ).data?.scan_id ?? "")
      .maybeSingle();

    const mes_referencia = agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const unsubUrl = await criarUnsubscribeToken(userId, email, "PELE");

    await enfileirar({
      user_id:     userId,
      email,
      fluxo:       "PROGRESSO_TWIN_MENSAL",
      template_id: "ProgressoTwinMensal",
      subject:     `Sua pele em ${mes_referencia}`,
      metadata: {
        nome,
        mes_referencia,
        marcador_destaque:    melhor.marcador,
        delta_destaque:       Math.round(melhor.delta), // sempre positivo para o usuário
        total_scans:          twin.total_scans as number,
        semanas_desde_inicio: semanas,
        melhora_global_pct:   Math.round(melhora_global_pct),
        tipo_pele_atual:      twin.tipo_pele_atual,
        url_twin:             `${SITE_URL}/minha-pele`,
        skin_id:              scan?.skin_id ?? null,
        unsubscribe_url:      unsubUrl,
      } satisfies Record<string, unknown>,
    });
  }
}

// ─── 13 · ALERTA_REGRESSAO ────────────────────────────────────────────────────

export async function enviarAlertaRegressao(params: {
  user_id:       string;
  email:         string;
  nome:          string | null;
  marcador_foco: string;
  conteudo:      string; // mensagem do insight
  scan_id:       string | null;
}): Promise<void> {
  const unsubUrl = await criarUnsubscribeToken(params.user_id, params.email, "PELE");

  await enfileirar({
    user_id:     params.user_id,
    email:       params.email,
    fluxo:       "ALERTA_REGRESSAO",
    template_id: "AlertaRegressao",
    subject:     `Variação detectada em ${params.marcador_foco}`,
    metadata: {
      nome:             params.nome,
      marcador_foco:    params.marcador_foco,
      mensagem_copilot: params.conteudo,
      scan_id:          params.scan_id,
      unsubscribe_url:  unsubUrl,
    } satisfies Record<string, unknown>,
  });
}

// ─── 14 · LEMBRETE_SCAN ───────────────────────────────────────────────────────

/**
 * Trigger: >= 42 dias sem novo scan.
 * Chamado pelo crmScheduler diariamente às 11h.
 */
export async function enviarLembreteScan(params: {
  user_id:          string;
  email:            string;
  nome:             string | null;
  ultimo_scan_dias: number;
  proxima_data:     string; // data sugerida para o próximo scan
}): Promise<void> {
  const unsubUrl = await criarUnsubscribeToken(params.user_id, params.email, "PELE");

  await enfileirar({
    user_id:     params.user_id,
    email:       params.email,
    fluxo:       "LEMBRETE_SCAN",
    template_id: "LembreteScan",
    subject:     "Hora do seu próximo Skin Scan",
    metadata: {
      nome:             params.nome,
      ultimo_scan_dias: params.ultimo_scan_dias,
      proxima_data:     params.proxima_data,
      scan_url:         `${SITE_URL}/skin-scan`,
      unsubscribe_url:  unsubUrl,
    } satisfies Record<string, unknown>,
  });
}
