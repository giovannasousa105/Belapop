import React from "react";
import {
  Html, Head, Body, Container, Section, Text, Link, Hr, Preview,
} from "@react-email/components";

interface EmailBaseProps {
  preview: string;
  children: React.ReactNode;
  unsubscribe_url?: string;
  grupo?: string;
  is_transacional?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://belapopoficial.com.br";

const s = {
  body: { backgroundColor: "#fbf7f4", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", margin: 0 },
  container: { maxWidth: 560, margin: "0 auto", backgroundColor: "#ffffff", padding: "0 0 40px" },
  header: { padding: "28px 32px 20px", borderBottom: "0.5px solid #ece8e4" },
  brand: { fontSize: 12, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#1e1e1e" },
  content: { padding: "28px 32px" },
  footer: { padding: "0 32px 24px" },
  footerText: { fontSize: 11, color: "#999", lineHeight: "1.6", margin: "0 0 4px" },
  footerLink: { color: "#999", textDecoration: "underline" },
};

export function EmailBase({ preview, children, unsubscribe_url, grupo, is_transacional }: EmailBaseProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          {/* Header */}
          <Section style={s.header}>
            <Text style={s.brand}>BelaPop</Text>
          </Section>

          {/* Content */}
          <Section style={s.content}>{children}</Section>

          {/* Footer */}
          <Section style={s.footer}>
            <Hr style={{ borderColor: "#ece8e4", margin: "0 0 20px" }} />
            <Text style={s.footerText}>
              BelaPop · São Paulo, Brasil
            </Text>
            <Text style={s.footerText}>
              <Link href={`${BASE_URL}/conta`} style={s.footerLink}>Minha conta</Link>
              {" · "}
              <Link href={`${BASE_URL}/aviso-de-privacidade`} style={s.footerLink}>Privacidade</Link>
              {!is_transacional && unsubscribe_url && (
                <>
                  {" · "}
                  <Link href={unsubscribe_url} style={s.footerLink}>
                    Cancelar {grupo === "EDITORIAL" ? "e-mails editoriais" : grupo === "PELE" ? "dicas de pele" : "e-mails"}
                  </Link>
                </>
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export { BASE_URL };
export { s as baseStyles };
