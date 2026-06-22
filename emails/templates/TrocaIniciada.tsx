import React from "react";
import { Section, Text, Link, Row, Column, Hr } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome?: string;
  numero_pedido?: string;
  protocolo?: string;
  motivo_troca?: string;
  prazo_resposta?: string;
  unsubscribe_url?: string;
}

export default function TrocaIniciada({
  nome,
  numero_pedido = "—",
  protocolo = "—",
  motivo_troca,
  prazo_resposta = "1 dia útil",
  unsubscribe_url,
}: Props) {
  return (
    <EmailBase preview={`Solicitação de troca recebida · Protocolo #${protocolo}`} is_transacional>
      <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "#1e1e1e", margin: "0 0 4px" }}>
        Sua solicitação foi recebida.
      </Text>
      {nome && (
        <Text style={{ fontSize: 14, color: "#666", margin: "0 0 24px" }}>
          Olá, {nome}. Vamos cuidar disso.
        </Text>
      )}

      {/* Box de detalhes */}
      <Section style={{ backgroundColor: "#fbf7f4", borderRadius: 8, padding: "20px 24px", marginBottom: 24 }}>
        <Row style={{ marginBottom: 10 }}>
          <Column style={{ width: 120 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "#aaa", margin: 0 }}>Protocolo</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: 13, color: "#1e1e1e", margin: 0, fontWeight: 600 }}>#{protocolo}</Text>
          </Column>
        </Row>
        <Row style={{ marginBottom: 10 }}>
          <Column style={{ width: 120 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "#aaa", margin: 0 }}>Pedido</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: 13, color: "#1e1e1e", margin: 0 }}>#{numero_pedido}</Text>
          </Column>
        </Row>
        {motivo_troca && (
          <Row style={{ marginBottom: 10 }}>
            <Column style={{ width: 120 }}>
              <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "#aaa", margin: 0 }}>Motivo</Text>
            </Column>
            <Column>
              <Text style={{ fontSize: 13, color: "#555", margin: 0 }}>{motivo_troca}</Text>
            </Column>
          </Row>
        )}
        <Row>
          <Column style={{ width: 120 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "#aaa", margin: 0 }}>Resposta em</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: 13, color: "#1e1e1e", margin: 0 }}>{prazo_resposta}</Text>
          </Column>
        </Row>
      </Section>

      <Text style={{ fontSize: 13, color: "#555", lineHeight: "1.7", marginBottom: 24 }}>
        Nossa equipe analisará e entrará em contato pelo e-mail cadastrado ou WhatsApp
        em até <strong>{prazo_resposta}</strong>.
      </Text>

      <Section style={{ marginBottom: 20 }}>
        <Link
          href={`${BASE_URL}/conta/pedidos`}
          style={{ ...s.brand, border: "1.5px solid #1e1e1e", color: "#1e1e1e", padding: "11px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          Ver status da solicitação →
        </Link>
      </Section>

      <Hr style={{ borderColor: "#ece8e4", margin: "0 0 16px" }} />
      <Text style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
        Dúvidas?{" "}
        <Link href="mailto:contato@belapopoficial.com.br" style={{ color: "#aaa" }}>
          contato@belapopoficial.com.br
        </Link>
      </Text>
    </EmailBase>
  );
}
