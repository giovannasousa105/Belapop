import React from "react";
import { Section, Text, Row, Column, Hr } from "@react-email/components";
import { EmailBase } from "./base/EmailBase";

interface Props {
  nome?: string;
  valor_reembolso?: string;
  metodo_pagamento?: string;
  prazo_credito?: string;
  protocolo?: string;
  unsubscribe_url?: string;
}

export default function Reembolso({
  nome,
  valor_reembolso = "—",
  metodo_pagamento = "—",
  prazo_credito = "até 2 faturas",
  protocolo = "—",
  unsubscribe_url,
}: Props) {
  return (
    <EmailBase preview={`Reembolso de ${valor_reembolso} aprovado`} is_transacional>
      {/* Ícone de confirmação + título */}
      <Text style={{ fontSize: 28, color: "#d8a0ac", margin: "0 0 8px", textAlign: "center" as const }}>
        ✓
      </Text>
      <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "#1e1e1e", margin: "0 0 4px", textAlign: "center" as const }}>
        Reembolso aprovado.
      </Text>
      {nome && (
        <Text style={{ fontSize: 14, color: "#666", margin: "0 0 24px", textAlign: "center" as const }}>
          Olá, {nome}.
        </Text>
      )}

      {/* Valor em destaque */}
      <Section style={{ backgroundColor: "#1e1e1e", borderRadius: 8, padding: "24px", marginBottom: 24, textAlign: "center" as const }}>
        <Text style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#d8a0ac", margin: "0 0 8px" }}>
          Valor aprovado
        </Text>
        <Text style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", margin: 0, fontFamily: "Georgia, serif" }}>
          {valor_reembolso}
        </Text>
      </Section>

      {/* Detalhes */}
      <Section style={{ backgroundColor: "#fbf7f4", borderRadius: 8, padding: "20px 24px", marginBottom: 24 }}>
        <Row style={{ marginBottom: 10 }}>
          <Column style={{ width: 140 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "#aaa", margin: 0 }}>Método</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: 13, color: "#1e1e1e", margin: 0 }}>{metodo_pagamento}</Text>
          </Column>
        </Row>
        <Row style={{ marginBottom: 10 }}>
          <Column style={{ width: 140 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "#aaa", margin: 0 }}>Prazo de crédito</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: 13, color: "#1e1e1e", margin: 0 }}>{prazo_credito}</Text>
          </Column>
        </Row>
        <Row>
          <Column style={{ width: 140 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "#aaa", margin: 0 }}>Protocolo</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: 13, color: "#1e1e1e", margin: 0, fontWeight: 600 }}>#{protocolo}</Text>
          </Column>
        </Row>
      </Section>

      <Hr style={{ borderColor: "#ece8e4", margin: "0 0 16px" }} />
      <Text style={{ fontSize: 12, color: "#aaa", lineHeight: "1.6", margin: 0 }}>
        O prazo de crédito pode variar conforme a operadora do cartão ou a instituição financeira.
        Dúvidas? <a href="mailto:contato@belapopoficial.com.br" style={{ color: "#aaa" }}>contato@belapopoficial.com.br</a>
      </Text>
    </EmailBase>
  );
}
