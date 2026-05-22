import type { Lote, LoteDisplayConfig, UrgenciaLevel } from "./types";

const MESES_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function formatarDataReposicao(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const mes = MESES_PT[(month ?? 1) - 1] ?? "";
  return `${day}/${mes}/${year}`;
}

function calcularUrgencia(lote: Lote): UrgenciaLevel {
  if (lote.status !== "EM_ESGOTAMENTO") return "none";
  const pct = lote.qtd_disponivel / lote.qtd_total;
  return pct <= 0.1 ? "high" : "low";
}

export function buildLoteDisplayConfig(lote: Lote): LoteDisplayConfig {
  const urgencia = calcularUrgencia(lote);

  switch (lote.status) {
    case "ABERTO":
      return {
        mostrar_contador: false,
        texto_estoque: null,
        texto_esgotado: null,
        mostrar_waitlist: false,
        urgencia_level: "none",
        status: lote.status,
        data_reposicao: lote.data_reposicao,
        qtd_disponivel: lote.qtd_disponivel,
        lote_id: lote.id,
      };

    case "EM_ESGOTAMENTO":
      return {
        mostrar_contador: true,
        texto_estoque:
          urgencia === "high"
            ? `Últimas ${lote.qtd_disponivel} unidades deste lote`
            : `${lote.qtd_disponivel} unidades disponíveis neste lote`,
        texto_esgotado: null,
        mostrar_waitlist: false,
        urgencia_level: urgencia,
        status: lote.status,
        data_reposicao: lote.data_reposicao,
        qtd_disponivel: lote.qtd_disponivel,
        lote_id: lote.id,
      };

    case "ENCERRADO":
      return {
        mostrar_contador: false,
        texto_estoque: null,
        texto_esgotado: "Lote encerrado",
        mostrar_waitlist: true,
        urgencia_level: "none",
        status: lote.status,
        data_reposicao: lote.data_reposicao,
        qtd_disponivel: null,
        lote_id: lote.id,
      };

    case "REPOSICAO_PREVISTA": {
      const dataFormatada = lote.data_reposicao
        ? formatarDataReposicao(lote.data_reposicao)
        : null;
      return {
        mostrar_contador: false,
        texto_estoque: null,
        texto_esgotado: dataFormatada
          ? `Lote encerrado · reposição prevista para ${dataFormatada}`
          : "Lote encerrado · reposição em breve",
        mostrar_waitlist: true,
        urgencia_level: "none",
        status: lote.status,
        data_reposicao: lote.data_reposicao,
        qtd_disponivel: null,
        lote_id: lote.id,
      };
    }

    case "SUSPENSO":
      return {
        mostrar_contador: false,
        texto_estoque: null,
        texto_esgotado: null,
        mostrar_waitlist: false,
        urgencia_level: "none",
        status: lote.status,
        data_reposicao: null,
        qtd_disponivel: null,
        lote_id: lote.id,
      };
  }
}
