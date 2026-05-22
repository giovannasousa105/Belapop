import React from "react";
import { Section, Text, Link, Hr } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome?:               string;
  pontos_boas_vindas?: number;
  antecipacao_horas?:  number;
  data_entrada?:       string;   // formatada pt-BR, ex: "17 de maio de 2026"
  unsubscribe_url?:    string;
  [key: string]: unknown;
}

export default function PopClubBoasVindas({
  nome,
  pontos_boas_vindas = 100,
  antecipacao_horas  = 24,
  data_entrada,
  unsubscribe_url,
}: Props) {
  const saudacao = nome ? `Bem-vinda ao PopClub, ${nome}` : "Bem-vinda ao PopClub";

  return (
    <EmailBase
      preview={saudacao}
      is_transacional
      unsubscribe_url={unsubscribe_url}
      grupo="TRANSACIONAL"
    >
      {/* 1. HEADER */}
      <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "#1e1e1e", marginBottom: 4 }}>
        {saudacao}
      </Text>
      <Text style={{ fontSize: 13, color: "#666666", marginBottom: 24 }}>
        Tier Essencial{data_entrada ? ` · desde ${data_entrada}` : ""}
      </Text>

      {/* 2. BENEFÍCIO PRINCIPAL */}
      <Section style={{ backgroundColor: "#f9f9f9", padding: "16px", borderRadius: 8, marginBottom: 24 }}>
        <Text style={{ fontSize: 14, color: "#1e1e1e", margin: 0, fontWeight: 500 }}>
          +{pontos_boas_vindas} pontos de boas-vindas já na sua conta
        </Text>
      </Section>

      {/* 3. O QUE VOCÊ DESBLOQUEIA */}
      <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#999999", marginBottom: 12 }}>
        O que você desbloqueia
      </Text>
      {[
        `Acesso ${antecipacao_horas}h antes dos lançamentos`,
        "Pontos em cada compra (R$1 = 1 ponto)",
        "Progresso para Premium a partir de 500 pontos",
      ].map((item, i) => (
        <Text key={i} style={{ fontSize: 13, color: "#555555", margin: "0 0 8px", paddingLeft: 14, borderLeft: "2px solid #e5e5e5" }}>
          {item}
        </Text>
      ))}

      {/* 4. CTA */}
      <Section style={{ marginTop: 28 }}>
        <Link
          href={`${BASE_URL}/popclub`}
          style={{ ...s.brand, backgroundColor: "#000000", color: "#ffffff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          Explorar meus benefícios
        </Link>
      </Section>

      {/* 5. NOTA EDITORIAL */}
      <Hr style={{ borderColor: "#e5e5e5", margin: "28px 0 16px" }} />
      <Text style={{ fontSize: 13, color: "#666666", fontStyle: "italic", lineHeight: "1.7", margin: 0 }}>
        "O PopClub não é um programa de pontos comum — é o acesso antecipado a produtos que a BelaPop selecionou antes de todo mundo."
      </Text>
    </EmailBase>
  );
}
