import { getSubgroupRoute } from "./subgroup-routing";

const CHANNEL_URL = process.env.CIRCULO_WHATSAPP_CHANNEL_URL ?? "";
const ATENDIMENTO_URL = "https://wa.me/553498047036";

export function buildWelcomeWhatsApp(nome: string, skinConcern: string): string {
  const firstName = nome.split(" ")[0] ?? nome;
  const subgroup = getSubgroupRoute(skinConcern);
  const channelLine = CHANNEL_URL
    ? `1. CANAL — drops e conteúdo editorial:\n${CHANNEL_URL}\n\n`
    : "";

  if (!subgroup.url) {
    return (
      `Olá, ${firstName}. Bem-vinda ao Círculo BelaPop.\n\n` +
      `Você acabou de entrar para um espaço fechado de curadoria em skincare.\n\n` +
      (channelLine
        ? `Comece pelo Canal — onde os drops chegam primeiro:\n${CHANNEL_URL}\n\n`
        : "") +
      `Em até 48h, vou te chamar aqui para uma conversa rápida e te indicar o sub-grupo certo dentro da Comunidade.\n\n` +
      `Para falar comigo direto: ${ATENDIMENTO_URL}.\n\n` +
      `— Giovanna, BelaPop`
    );
  }

  return (
    `Olá, ${firstName}. Bem-vinda ao Círculo BelaPop.\n\n` +
    `Você acabou de entrar para um espaço fechado de curadoria em skincare.\n\n` +
    `Tem dois lugares pra você agora:\n\n` +
    channelLine +
    `2. COMUNIDADE — conversa com outras membras sobre ${subgroup.label}:\n${subgroup.url}\n\n` +
    `Próximo drop: em até 14 dias.\n\n` +
    `Para falar comigo direto: ${ATENDIMENTO_URL}.\n\n` +
    `— Giovanna, BelaPop`
  );
}
