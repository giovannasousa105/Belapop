import React from "react";
import { Section, Text, Link, Img } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

// Tom: atelier, nunca liquidação.
// Proibido: "ÚLTIMAS CHANCES", vermelho, exclamação nos títulos.

interface Props {
  nome?: string | null;
  produto_nome?: string;
  produto_imagem?: string | null;
  preco_centavos?: number;
  qtd_restante?: number;
  url_produto?: string;
  score_compat?: number | null;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function LoteEsgotando({
  nome,
  produto_nome = "produto",
  produto_imagem,
  preco_centavos = 0,
  qtd_restante,
  url_produto,
  score_compat,
  unsubscribe_url,
}: Props) {
  return (
    <EmailBase
      preview={`Poucas unidades restantes de ${produto_nome}`}
      grupo="EDITORIAL"
      unsubscribe_url={unsubscribe_url}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
        Estoque · Atualização
      </Text>

      {produto_imagem && (
        <Img
          src={produto_imagem} width={160} height={160}
          alt={produto_nome}
          style={{ borderRadius: 10, objectFit: "cover", marginBottom: 16 }}
        />
      )}

      <Text style={{ fontSize: 20, fontWeight: 500, color: "#1e1e1e", marginBottom: 4, fontFamily: "Georgia, serif" }}>
        {produto_nome}
      </Text>

      <Text style={{ fontSize: 14, color: "#999", marginBottom: 16 }}>
        {brl(preco_centavos)}
      </Text>

      {qtd_restante != null && (
        <Text style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
          {qtd_restante} {qtd_restante === 1 ? "unidade disponível" : "unidades disponíveis"} neste lote
        </Text>
      )}

      {score_compat != null && score_compat >= 50 && (
        <Section style={{ padding: "10px 14px", backgroundColor: "#f0faf4", borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: "#1a7a35", margin: 0 }}>
            {score_compat}% compatível com sua pele
          </Text>
        </Section>
      )}

      <Section style={{ marginTop: 8 }}>
        <Link
          href={url_produto ?? `${BASE_URL}/catalogo`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          Ver produto
        </Link>
      </Section>
    </EmailBase>
  );
}
