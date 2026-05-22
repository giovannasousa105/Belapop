import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SkinProfile } from "./types";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ProdutoCatalogo {
  id: string;
  nome: string;
  ativos_principais: string[];
  tipo_pele_indicado: string[];
  nivel_sensibilidade_max: number;
  passo_rotina: string;
  periodo: string; // 'manha' | 'noite' | 'ambos'
}

export interface ProdutoCompativel extends ProdutoCatalogo {
  score_compatibilidade: number;
}

// ─── Algoritmo de compatibilidade (função pura) ───────────────────────────────

/**
 * Calcula score de compatibilidade produto × perfil (0–100).
 *
 * Base neutra de 50; modificadores cumulativos:
 *   +30  tipo de pele compatível
 *   +10  por ativo em comum com recomendados (máx +20)
 *   -20  qualquer ativo contraindicado presente
 *   -30  nível de sensibilidade do produto menor que o do perfil
 */
export function calcularCompatibilidade(
  produto: ProdutoCatalogo,
  skinProfile: SkinProfile
): number {
  let score = 50;

  if (produto.tipo_pele_indicado.includes(skinProfile.tipo_pele)) {
    score += 30;
  }

  const intersecao = produto.ativos_principais.filter((a) =>
    skinProfile.ativos_recomendados.includes(a)
  );
  score += Math.min(20, intersecao.length * 10);

  const temContraindicado = produto.ativos_principais.some((a) =>
    skinProfile.ativos_contraindicados.includes(a)
  );
  if (temContraindicado) score -= 20;

  if (produto.nivel_sensibilidade_max < skinProfile.nivel_sensibilidade) {
    score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}

// ─── Busca de produtos com lote ativo ────────────────────────────────────────

/**
 * Busca produtos do catálogo para o período informado que possuam lote ativo,
 * calcula o score de compatibilidade e retorna apenas os produtos com score ≥ 50.
 */
export async function buscarProdutosCompatíveis(
  skinProfile: SkinProfile,
  periodo: "manha" | "noite"
): Promise<ProdutoCompativel[]> {
  const admin = getSupabaseAdminClient();

  // Passo 1: buscar produtos publicados para o período
  const { data: produtos, error: prodError } = await admin
    .from("products")
    .select(
      "id, title, ativos_principais, tipo_pele_indicado, nivel_sensibilidade_max, passo_rotina, periodo"
    )
    .in("periodo", [periodo, "ambos"])
    .eq("status", "published")
    .limit(200);

  if (prodError || !produtos?.length) return [];

  // Passo 2: buscar IDs com lote ativo (status = ABERTO)
  const ids = produtos.map((p) => p.id as string);
  const { data: lotesAtivos } = await admin
    .from("lotes")
    .select("produto_id")
    .eq("status", "ABERTO")
    .in("produto_id", ids);

  const idsComLote = new Set((lotesAtivos ?? []).map((l) => l.produto_id as string));

  // Passo 3: calcular compatibilidade e filtrar
  const resultado: ProdutoCompativel[] = [];

  for (const p of produtos) {
    if (!idsComLote.has(p.id as string)) continue;

    const produto: ProdutoCatalogo = {
      id: p.id as string,
      nome: (p.title as string) ?? "",
      ativos_principais: Array.isArray(p.ativos_principais) ? (p.ativos_principais as string[]) : [],
      tipo_pele_indicado: Array.isArray(p.tipo_pele_indicado) ? (p.tipo_pele_indicado as string[]) : [],
      nivel_sensibilidade_max: typeof p.nivel_sensibilidade_max === "number" ? p.nivel_sensibilidade_max : 5,
      passo_rotina: (p.passo_rotina as string) ?? "",
      periodo: (p.periodo as string) ?? "ambos",
    };

    const score = calcularCompatibilidade(produto, skinProfile);
    if (score >= 50) {
      resultado.push({ ...produto, score_compatibilidade: score });
    }
  }

  return resultado;
}
