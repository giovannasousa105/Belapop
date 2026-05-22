export const belapopContact = {
  supportEmail: "contato@belapopoficial.com.br",
  privacyEmail: "privacidade@belapopoficial.com.br",
  supportLabel: "Atendimento BelaPop",
  privacyLabel: "Canal de Privacidade BelaPop",
  instagramHandle: "@belapopoficial"
} as const;

export function buildBelapopMailto(
  email: string,
  subject: string,
  body?: string
) {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${email}?${params.toString()}`;
}
