import React from "react";
import {
  Html, Head, Body, Container, Preview, Img, Hr,
} from "@react-email/components";

const LOGO_URL =
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/images/belapop-logo.png`
    : "https://belapopoficial.com.br/images/belapop-logo.png";

interface EmailLayoutProps {
  children: React.ReactNode;
  preview?: string;
}

// Sem Google Fonts — system-ui para compatibilidade com Outlook
const bodyStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: "0 auto",
  padding: "40px 20px",
};

export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Img
            src={LOGO_URL}
            width={120}
            height={32}
            alt="BelaPop"
            style={{ display: "block" }}
          />
          <Hr style={{ borderColor: "#e5e5e5", margin: "24px 0" }} />
          {children}
        </Container>
      </Body>
    </Html>
  );
}
