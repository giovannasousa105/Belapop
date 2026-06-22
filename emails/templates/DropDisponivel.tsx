import React from "react";
import { Section, Text, Link, Img } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome?: string;
  nome_drop?: string;
  descricao?: string;
  imagem_drop?: string;
  url_drop?: string;
  encerramento_em?: string;
  indicado_para?: string[];
  unsubscribe_url?: string;
}

export default function DropDisponivel({
  nome,
  nome_drop = "Drop BelaPop",
  descricao,
  imagem_drop,
  url_drop,
  encerramento_em = "48 horas",
  indicado_para = [],
  unsubscribe_url,
}: Props) {
  const href = url_drop ?? `${BASE_URL}/circulo`;

  return (
    <EmailBase preview={`Drop disponível: ${nome_drop} · 48h para garantir`} unsubscribe_url={unsubscribe_url} grupo="CÍRCULO">
      {/* Eyebrow */}
      <Text style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.20em", textTransform: "uppercase" as const, color: "#dac769", margin: "0 0 16px" }}>
        Círculo BelaPop · Drop Quinzenal
      </Text>

      {/* Imagem do drop */}
      {imagem_drop && (
        <Section style={{ margin: "0 0 20px" }}>
          <Img src={imagem_drop} width={560} alt={nome_drop} style={{ borderRadius: 8, objectFit: "cover", maxWidth: "100%" }} />
        </Section>
      )}

      {/* Título */}
      <Text style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: "#1e1e1e", margin: "0 0 6px", fontFamily: "Georgia, serif" }}>
        {nome_drop}
      </Text>
      {nome && (
        <Text style={{ fontSize: 13, color: "#999", margin: "0 0 16px" }}>
          {nome}, esta curadoria foi preparada para você.
        </Text>
      )}

      {/* Descrição */}
      {descricao && (
        <Text style={{ fontSize: 14, lineHeight: "1.7", color: "#555", margin: "0 0 20px" }}>
          {descricao}
        </Text>
      )}

      {/* Pills de indicação */}
      {indicado_para.length > 0 && (
        <Section style={{ backgroundColor: "#f6e8ea", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#8c5d66", margin: "0 0 6px" }}>
            Indicado para
          </Text>
          <Text style={{ fontSize: 13, color: "#4a3135", margin: 0 }}>
            {indicado_para.join(" · ")}
          </Text>
        </Section>
      )}

      {/* Urgência */}
      <Section style={{ backgroundColor: "#1e1e1e", borderRadius: 8, padding: "14px 20px", marginBottom: 24 }}>
        <Text style={{ fontSize: 13, color: "#d8a0ac", margin: 0, fontWeight: 500 }}>
          ⏱ Encerra em {encerramento_em} · Sem reposição
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ marginBottom: 16 }}>
        <Link
          href={href}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "14px 28px", borderRadius: 8, textDecoration: "none", display: "inline-block", fontSize: 12, letterSpacing: "0.16em" }}
        >
          Garantir agora →
        </Link>
      </Section>

      <Text style={{ fontSize: 11, color: "#bbb", lineHeight: "1.6" }}>
        Janela de 48h. Após o prazo, sem exceções e sem lista de espera.
      </Text>
    </EmailBase>
  );
}
