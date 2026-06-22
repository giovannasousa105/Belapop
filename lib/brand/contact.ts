export const belapopContact = {
  supportEmail: "contato@belapopoficial.com.br",
  privacyEmail: "privacidade@belapopoficial.com.br",
  supportLabel: "Atendimento BelaPop",
  privacyLabel: "Canal de Privacidade BelaPop",
  instagramHandle: "@belapopoficial",
  whatsappNumber: "5534980470367",
  whatsappDisplay: "+55 (34) 9 8047-0367"
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
