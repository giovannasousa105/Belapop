export type LogisticsPlaybook = {
  code: string;
  title: string;
  owner: "seller_ops" | "support_ops" | "finance_ops";
  slaActionHours: number;
  escalationChannel: "in_app" | "email" | "whatsapp" | "in_app+email";
  actions: string[];
};

const DEFAULT_PLAYBOOK: LogisticsPlaybook = {
  code: "generic_exception",
  title: "Playbook de excecao logistica",
  owner: "support_ops",
  slaActionHours: 4,
  escalationChannel: "in_app+email",
  actions: [
    "Validar o ultimo evento de rastreio e atualizar o status do subpedido.",
    "Notificar seller e cliente com o proximo passo e prazo estimado.",
    "Abrir analise interna se nao houver atualizacao em 4 horas."
  ]
};

const PLAYBOOKS: Record<string, LogisticsPlaybook> = {
  delivery_delay: {
    code: "delivery_delay",
    title: "Playbook atraso de entrega",
    owner: "seller_ops",
    slaActionHours: 2,
    escalationChannel: "in_app+email",
    actions: [
      "Confirmar evento de rastreio nas ultimas 6 horas.",
      "Contato ativo com transportadora e seller para novo ETA.",
      "Escalar para suporte BelaPop quando atraso > 3 dias."
    ]
  },
  tracking_stalled: {
    code: "tracking_stalled",
    title: "Playbook rastreio sem progresso",
    owner: "support_ops",
    slaActionHours: 4,
    escalationChannel: "in_app+email",
    actions: [
      "Auditar integracao de tracking e provider do subpedido.",
      "Solicitar comprovante de postagem para o seller.",
      "Escalar ticket tecnico se sem evento novo em 24h."
    ]
  },
  delivery_exception: {
    code: "delivery_exception",
    title: "Playbook excecao critica de entrega",
    owner: "support_ops",
    slaActionHours: 1,
    escalationChannel: "whatsapp",
    actions: [
      "Contato prioritario com cliente para confirmar endereco e disponibilidade.",
      "Acionar seller para reenvio/troca conforme politica.",
      "Escalar para analise BelaPop imediata com protocolo tecnico."
    ]
  },
  return_stalled: {
    code: "return_stalled",
    title: "Playbook devolucao estagnada",
    owner: "finance_ops",
    slaActionHours: 6,
    escalationChannel: "in_app+email",
    actions: [
      "Validar etapa da logistica reversa (coleta/transito/recebimento).",
      "Atualizar ticket com proximo marco e prazo.",
      "Escalar para financeiro caso prazo de estorno esteja em risco."
    ]
  }
};

export const getLogisticsPlaybook = (exceptionCode: string | null | undefined) => {
  const key = String(exceptionCode ?? "").trim().toLowerCase();
  return PLAYBOOKS[key] ?? DEFAULT_PLAYBOOK;
};
