import React from "react";
import { Section, Text, Link, Img } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  produto_nome?: string;
  produto_foto?: string | null;
  produto_slug?: string;
  qtd_restante?: number;
  score_compatibilidade?: number | null;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

export default function WishlistEsgotando({
  produto_nome = "Produto", produto_foto, produto_slug = "",
  qtd_restante, score_compatibilidade, unsubscribe_url,
}: Props) {
  return (
    <EmailBase preview={`${produto_nome} está quase esgotando`} grupo="EDITORIAL" unsubscribe_url={unsubscribe_url}>
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
        Aviso de wishlist
      </Text>

      {produto_foto && (
        <Img src={produto_foto} width={200} height={200} alt={produto_nome}
          style={{ borderRadius: 8, objectFit: "cover", marginBottom: 16 }} />
      )}

      <Text style={{ fontSize: 20, fontWeight: 600, color: "#1e1e1e", marginBottom: 6 }}>{produto_nome}</Text>

      {qtd_restante != null && qtd_restante <= 5 && (
        <Text style={{ fontSize: 13, color: "#8a6400", marginBottom: 12 }}>
          Apenas {qtd_restante} {qtd_restante === 1 ? "unidade" : "unidades"} disponível
        </Text>
      )}

      {score_compatibilidade != null && (
        <Section style={{ padding: "10px 14px", backgroundColor: "#f7f5f2", borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: "#555", margin: 0 }}>
            {score_compatibilidade}% compatível com seu perfil de pele
          </Text>
        </Section>
      )}

      <Section style={{ marginTop: 8 }}>
        <Link href={`${BASE_URL}/produto/${produto_slug}`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}>
          Garantir agora
        </Link>
      </Section>
    </EmailBase>
  );
}
