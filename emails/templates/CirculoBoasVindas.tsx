import React from "react";
import { Section, Text, Link, Hr } from "@react-email/components";

import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome: string;
  skin_concern_label: string; // ex: "Acne e cravos"
  unsubscribe_url?: string;
}

export default function CirculoBoasVindas({ nome, skin_concern_label, unsubscribe_url }: Props) {
  return (
    <EmailBase
      preview={`${nome}, você está no Círculo BelaPop.`}
      unsubscribe_url={unsubscribe_url}
      grupo="CÍRCULO"
    >
      {/* 1. Saudação */}
      <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "#1e1e1e", marginBottom: 4 }}>
        {nome}, você está no Círculo.
      </Text>
      <Text style={{ fontSize: 13, color: "#888888", marginBottom: 28 }}>
        Círculo BelaPop — acesso fechado
      </Text>

      {/* 2. O que vem a seguir */}
      <Section style={{ backgroundColor: "#fbf7f4", padding: "20px 24px", borderRadius: 8, marginBottom: 28 }}>
        <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#aaaaaa", margin: "0 0 14px" }}>
          O que vem a seguir
        </Text>
        {[
          `Em até 14 dias, o próximo drop chega no seu WhatsApp — com curadoria focada em ${skin_concern_label}.`,
          "Cada drop traz de 5 a 15 SKUs selecionados do mercado coreano, com lote rastreado e quantidade limitada.",
          "Você receberá 24h de antecipação antes da abertura geral.",
        ].map((item, i) => (
          <Text key={i} style={{ fontSize: 13, color: "#555555", margin: "0 0 10px", paddingLeft: 14, borderLeft: "2px solid #d8a0ac", lineHeight: "1.6" }}>
            {item}
          </Text>
        ))}
      </Section>

      {/* 3. Etiqueta do grupo */}
      <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#aaaaaa", margin: "0 0 10px" }}>
        Etiqueta do grupo
      </Text>
      <Text style={{ fontSize: 12, color: "#888888", lineHeight: "1.7", margin: "0 0 28px" }}>
        O grupo é um espaço de curadoria. Sem encaminhamentos, sem revenda dos produtos adquiridos,
        sem spam. Respeito mútuo é a única regra inegociável.
      </Text>

      {/* 4. CTA */}
      <Section style={{ marginBottom: 28 }}>
        <Link
          href={`${BASE_URL}/circulo`}
          style={{
            ...s.brand,
            backgroundColor: "#1e1e1e",
            color: "#ffffff",
            padding: "13px 28px",
            borderRadius: 8,
            textDecoration: "none",
            display: "inline-block",
            fontSize: 11,
          }}
        >
          Conhecer o Círculo BelaPop
        </Link>
      </Section>

      {/* 5. Rodapé editorial */}
      <Hr style={{ borderColor: "#ece8e4", margin: "0 0 20px" }} />
      <Text style={{ fontSize: 12, color: "#aaaaaa", lineHeight: "1.7", margin: 0, fontStyle: "italic" }}>
        "Skincare não deve depender de tentativa. Cuidar da pele é entender, ajustar e manter."
      </Text>
      {unsubscribe_url && (
        <Text style={{ fontSize: 11, color: "#cccccc", marginTop: 16 }}>
          Não quer mais receber comunicações do Círculo?{" "}
          <Link href={unsubscribe_url} style={{ color: "#cccccc", textDecoration: "underline" }}>
            Cancelar inscrição
          </Link>
        </Text>
      )}
    </EmailBase>
  );
}
