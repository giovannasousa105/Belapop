/**
 * Regras de contraindicação para combinações de ativos na mesma rotina.
 *
 * Lógica de aplicação:
 *   1. Se nivel_sensibilidade >= 4: remover todos os ácidos (regra global).
 *   2. Para cada regra de par: se ambos os ativos estão presentes
 *      E o nivel_sensibilidade >= nivel_min da regra, remover o menos
 *      prioritário do par (sempre o retinol — mais agressivo).
 */

// ─── Conjunto de ácidos removidos em sensibilidade alta ──────────────────────

const ACIDOS: ReadonlySet<string> = new Set([
  "aha-glicolico",
  "bha-salicilico",
  "salicilico-0.5",
  "pha",
  "acido-azelaico",
  "acido-kojico",
]);

// ─── Regras de par ────────────────────────────────────────────────────────────

interface RegraContraindicacao {
  par: [string, string]; // os dois ativos conflitantes
  remover: string; // qual retirar da lista (o mais agressivo)
  nivel_min: number; // nivel_sensibilidade mínimo para aplicar a regra
  motivo: string;
}

const REGRAS: readonly RegraContraindicacao[] = [
  {
    par: ["retinol-0.025", "vitamina-c"],
    remover: "retinol-0.025",
    nivel_min: 1, // sempre separar — independente de sensibilidade
    motivo: "retinol e vitamina-c devem ser usados em períodos separados",
  },
  {
    par: ["aha-glicolico", "retinol-0.025"],
    remover: "retinol-0.025",
    nivel_min: 3,
    motivo: "combinação de AHA + retinol contraindicada para sensibilidade ≥ 3",
  },
  {
    par: ["bha-salicilico", "retinol-0.025"],
    remover: "retinol-0.025",
    nivel_min: 4,
    motivo: "BHA + retinol contraindicado para sensibilidade ≥ 4",
  },
];

// ─── Resultado ────────────────────────────────────────────────────────────────

export interface ResultadoContraindicacoes {
  ativos_finais: string[];
  contraindicados: string[]; // ativos removidos com motivo implícito
}

// ─── Função principal ─────────────────────────────────────────────────────────

export function aplicarContraindicacoes(
  ativos: string[],
  nivel_sensibilidade: number
): ResultadoContraindicacoes {
  const removidos = new Set<string>();

  // Regra global: sensibilidade >= 4 → remover todos os ácidos
  if (nivel_sensibilidade >= 4) {
    for (const ativo of ativos) {
      if (ACIDOS.has(ativo)) {
        removidos.add(ativo);
      }
    }
  }

  // Regras de par (aplicadas sobre o conjunto já filtrado)
  const aposGlobal = ativos.filter((a) => !removidos.has(a));
  const conjuntoAtual = new Set(aposGlobal);

  for (const regra of REGRAS) {
    if (nivel_sensibilidade < regra.nivel_min) continue;
    const [a, b] = regra.par;
    if (conjuntoAtual.has(a) && conjuntoAtual.has(b)) {
      conjuntoAtual.delete(regra.remover);
      removidos.add(regra.remover);
    }
  }

  return {
    ativos_finais: ativos.filter((a) => !removidos.has(a)),
    contraindicados: Array.from(removidos),
  };
}
