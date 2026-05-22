/**
 * Fallbacks síncronos para todos os tipos de interação.
 * Usados quando Claude falha — nunca retornam string vazia.
 */

import type { InteracaoTipo } from "../copilotTypes";
import { marcadorFocoLabel } from "./lembretes";
import type { MensagemContext } from "../messageGenerator";

export function gerarFallback(
  tipo:    InteracaoTipo,
  context: MensagemContext
): string {
  const nome    = context.nome?.split(" ")[0] ?? "você";
  const marcador = marcadorFocoLabel(context.seed.marcadorFoco);

  switch (tipo) {
    case "CHECKIN_SEMANAL":
      return (
        `Como sua pele está esta semana, ${nome}? ` +
        `Continue com sua rotina — consistência é o caminho.`
      );

    case "NUDGE_RECOMPRA": {
      const prod = context.produto_acabando?.produto_nome ?? "seu produto";
      return (
        `${prod} está acabando. ` +
        `Manter a rotina sem interrupção protege o progresso da sua pele.`
      );
    }

    case "ALERTA_REGRESSAO":
      return (
        `Detectamos uma variação em ${marcador}. ` +
        `Variações são normais — mantenha a rotina.`
      );

    case "MARCO_ALCANCADO":
      return (
        `Sua pele evoluiu! ${marcador} melhorou desde o início. ` +
        `Sua rotina está funcionando.`
      );

    default:
      return context.seed.mensagemMotivacionalCurta;
  }
}
