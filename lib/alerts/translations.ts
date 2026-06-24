export type AlertTranslation = {
  title: string;
  description: string;
  action: string;
  actionHref: string;
  category: "financeiro" | "logistica" | "curadoria" | "sistema";
};

const ALERT_TRANSLATIONS: Record<string, AlertTranslation> = {
  // Sistema / DR
  dr_drill_missed: {
    title: "Backup não executado",
    description: "O procedimento de backup programado não foi concluído.",
    action: "Verificar infraestrutura",
    actionHref: "/adm/gestao/log-atividades",
    category: "sistema",
  },
  dr_test_overdue: {
    title: "Teste de recuperação atrasado",
    description: "Não há teste de recuperação de dados aprovado no período.",
    action: "Agendar teste de DR",
    actionHref: "/adm/gestao/log-atividades",
    category: "sistema",
  },
  sre_oncall_uncovered: {
    title: "Plantão sem responsável",
    description: "Nenhum operador designado para o plantão desta data.",
    action: "Designar responsável",
    actionHref: "/adm/gestao/usuarios-internos",
    category: "sistema",
  },
  dr_drill_upcoming: {
    title: "Simulação de recuperação agendada",
    description: "Há uma simulação de recuperação de desastre programada para os próximos dias.",
    action: "Ver agenda de DR",
    actionHref: "/adm/gestao/log-atividades",
    category: "sistema",
  },
  gateway_reconciliation: {
    title: "Divergência na reconciliação do gateway",
    description: "O fechamento financeiro do provedor de pagamento apresentou divergência entre valores registrados e repassados.",
    action: "Revisar reconciliação",
    actionHref: "/adm/gestao/log-atividades",
    category: "financeiro",
  },
  // Logística
  "atraso sem movimentacao": {
    title: "Atraso sem movimentação",
    description: "Pedido sem evento de rastreio por mais de 48h.",
    action: "Ver incidentes",
    actionHref: "/adm/operacao/logistica/incidentes",
    category: "logistica",
  },
  "endereco parcial": {
    title: "Endereço incompleto",
    description: "Falha de CEP detectada no manifesto de coleta.",
    action: "Corrigir endereço",
    actionHref: "/adm/operacao/logistica/incidentes",
    category: "logistica",
  },
  "rastreio não vinculado": {
    title: "Rastreio não vinculado",
    description: "Etiqueta emitida sem sincronismo no sistema.",
    action: "Verificar rastreio",
    actionHref: "/adm/operacao/logistica",
    category: "logistica",
  },
  "rastreio nao vinculado": {
    title: "Rastreio não vinculado",
    description: "Etiqueta emitida sem sincronismo no sistema.",
    action: "Verificar rastreio",
    actionHref: "/adm/operacao/logistica",
    category: "logistica",
  },
  // Financeiro
  "risco de chargeback": {
    title: "Risco de chargeback",
    description: "Pedido com atraso crítico e contestação em aberto.",
    action: "Analisar caso",
    actionHref: "/adm/financeiro/risco",
    category: "financeiro",
  },
  "divergencia de frete": {
    title: "Divergência de frete",
    description: "Custo logístico acima da margem permitida pelo contrato.",
    action: "Revisar repasse",
    actionHref: "/adm/financeiro/repasses",
    category: "financeiro",
  },
  "divergência de frete": {
    title: "Divergência de frete",
    description: "Custo logístico acima da margem permitida pelo contrato.",
    action: "Revisar repasse",
    actionHref: "/adm/financeiro/repasses",
    category: "financeiro",
  },
  "conta bancaria vencida": {
    title: "Conta bancária vencida",
    description: "Dados bancários do seller expiraram e precisam de atualização.",
    action: "Solicitar atualização",
    actionHref: "/adm/curadoria/documentos",
    category: "financeiro",
  },
  // Curadoria / Documentos
  contrato_vencendo: {
    title: "Contrato prestes a vencer",
    description: "Documento de seller com prazo de validade próximo.",
    action: "Solicitar renovação",
    actionHref: "/adm/curadoria/documentos",
    category: "curadoria",
  },
  // Reembolso
  "reembolso em análise": {
    title: "Reembolso em análise",
    description: "Solicitação de reembolso pendente de aprovação.",
    action: "Analisar reembolso",
    actionHref: "/adm/financeiro/reembolsos",
    category: "financeiro",
  },
  "reembolso em analise": {
    title: "Reembolso em análise",
    description: "Solicitação de reembolso pendente de aprovação.",
    action: "Analisar reembolso",
    actionHref: "/adm/financeiro/reembolsos",
    category: "financeiro",
  },
};

export function translateAlert(code: string): AlertTranslation {
  const key = code.toLowerCase().trim();
  return (
    ALERT_TRANSLATIONS[key] ??
    ALERT_TRANSLATIONS[code] ?? {
      title: code,
      description: "Verificar painel de alertas para mais detalhes.",
      action: "Ver detalhes",
      actionHref: "/adm/gestao/log-atividades",
      category: "sistema" as const,
    }
  );
}
