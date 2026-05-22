import type { SkinProfile } from "./types";
import {
  buscarProdutosCompatíveis,
  type ProdutoCompativel,
} from "./recommendationEngine";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface PassoRotina {
  ordem: number;
  passo: string;
  produto_id: string;
  produto_nome: string;
  score_compatibilidade: number;
  justificativa_curta: string;
}

export interface RotinaResult {
  periodo: "manha" | "noite";
  passos: PassoRotina[];
  scores_compat: Record<string, number>; // produto_id → score
}

// ─── Sequência clínica por período ────────────────────────────────────────────

const ORDEM_PASSOS: Record<"manha" | "noite", string[]> = {
  manha: ["limpeza", "toner", "serum", "olhos", "hidratante", "fps"],
  noite: ["limpeza", "toner", "tratamento", "serum", "olhos", "hidratante"],
};

const MAX_PRODUTOS_ROTINA = 5;

// ─── Justificativa local (sem Claude) ────────────────────────────────────────

function gerarJustificativaCurta(
  produto: ProdutoCompativel,
  skinProfile: SkinProfile
): string {
  const ativoEmComum = produto.ativos_principais.find((a) =>
    skinProfile.ativos_recomendados.includes(a)
  );

  if (ativoEmComum) {
    const necessidade =
      skinProfile.necessidades_rankeadas[0]?.replace(/_/g, " ") ?? "sua pele";
    return `Contém ${ativoEmComum}, indicado para ${necessidade}.`;
  }

  if (produto.tipo_pele_indicado.includes(skinProfile.tipo_pele)) {
    return `Formulado para pele ${skinProfile.tipo_pele.toLowerCase()}.`;
  }

  return "Selecionado pela compatibilidade com seu perfil.";
}

// ─── Montagem da rotina ───────────────────────────────────────────────────────

/**
 * Monta a rotina para o período informado.
 *
 * Para cada passo da sequência clínica:
 *   - Seleciona o produto com maior score entre os candidatos daquele passo.
 *   - Omite o passo se não houver produto disponível.
 *
 * Máximo de MAX_PRODUTOS_ROTINA produtos por rotina.
 */
export async function montarRotina(
  skinProfile: SkinProfile,
  periodo: "manha" | "noite"
): Promise<RotinaResult> {
  const candidatos = await buscarProdutosCompatíveis(skinProfile, periodo);

  // Agrupar por passo_rotina, top-1 por score
  const porPasso = new Map<string, ProdutoCompativel>();
  for (const produto of candidatos) {
    const passo = produto.passo_rotina;
    if (!passo) continue;
    const atual = porPasso.get(passo);
    if (!atual || produto.score_compatibilidade > atual.score_compatibilidade) {
      porPasso.set(passo, produto);
    }
  }

  const sequencia = ORDEM_PASSOS[periodo];
  const passosSelecionados: PassoRotina[] = [];
  const scoresCompat: Record<string, number> = {};

  for (const nomePasso of sequencia) {
    if (passosSelecionados.length >= MAX_PRODUTOS_ROTINA) break;

    const produto = porPasso.get(nomePasso);
    if (!produto) continue;

    scoresCompat[produto.id] = produto.score_compatibilidade;
    passosSelecionados.push({
      ordem: passosSelecionados.length + 1,
      passo: nomePasso,
      produto_id: produto.id,
      produto_nome: produto.nome,
      score_compatibilidade: produto.score_compatibilidade,
      justificativa_curta: gerarJustificativaCurta(produto, skinProfile),
    });
  }

  return {
    periodo,
    passos: passosSelecionados,
    scores_compat: scoresCompat,
  };
}

/**
 * Monta as rotinas de manhã e noite em paralelo.
 */
export async function montarRotinas(
  skinProfile: SkinProfile
): Promise<{ manha: RotinaResult; noite: RotinaResult }> {
  const [manha, noite] = await Promise.all([
    montarRotina(skinProfile, "manha"),
    montarRotina(skinProfile, "noite"),
  ]);
  return { manha, noite };
}
