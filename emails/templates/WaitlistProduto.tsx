import React from "react";
import { Section, Text, Link, Img } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome?: string | null;
  produto_nome?: string;
  produto_imagem?: string | null;
  preco_centavos?: number;
  situacao?: "ABERTO" | "REPOSICAO_PREVISTA";
  qtd_disponivel?: number | null;
  data_reposicao?: string | null;
  score_compat?: number | null;
  eh_membro_popclub?: boolean;
  antecipacao_horas?: number | null;
  url_produto?: string;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function WaitlistProduto({
  nome,
  produto_nome = "Produto",
  produto_imagem,
  preco_centavos = 0,
  situacao = "ABERTO",
  qtd_disponivel,
  data_reposicao,
  score_compat,
  eh_membro_popclub = false,
  antecipacao_horas,
  url_produto,
  unsubscribe_url,
}: Props) {
  const isAberto = situacao === "ABERTO";

  return (
    <EmailBase
      preview={
        isAberto
          ? `${produto_nome} voltou — e com ${qtd_disponivel ?? "novas"} unidades`
          : `${produto_nome} chega em ${data_reposicao ?? "breve"}`
      }
      grupo="EDITORIAL"
      unsubscribe_url={unsubscribe_url}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
        {isAberto ? "Você estava na lista" : "Aviso prévio"}
      </Text>

      {produto_imagem && (
        <Img
          src={produto_imagem} width={160} height={160}
          alt={produto_nome}
          style={{ borderRadius: 10, objectFit: "cover", marginBottom: 16 }}
        />
      )}

      <Text style={{ fontSize: 22, fontWeight: 500, color: "#1e1e1e", marginBottom: 6, fontFamily: "Georgia, serif" }}>
        {produto_nome}
      </Text>

      <Text style={{ fontSize: 14, color: "#999", marginBottom: 16 }}>
        {brl(preco_centavos)}
      </Text>

      {score_compat != null && score_compat >= 50 && (
        <Section style={{ padding: "10px 14px", backgroundColor: "#f0faf4", borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: "#1a7a35", margin: 0 }}>
            {score_compat}% compatível com sua pele
          </Text>
        </Section>
      )}

      {isAberto && qtd_disponivel != null && (
        <Text style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
          {qtd_disponivel} {qtd_disponivel === 1 ? "unidade disponível" : "unidades disponíveis"} agora
        </Text>
      )}

      {!isAberto && data_reposicao && (
        <Text style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
          Chegada prevista: {new Date(data_reposicao).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
        </Text>
      )}

      {eh_membro_popclub && antecipacao_horas && (
        <Section style={{ padding: "10px 14px", backgroundColor: "#fff8e6", borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: "#8a6400", margin: 0 }}>
            Como membra PopClub, você acessa {antecipacao_horas}h antes do público.
          </Text>
        </Section>
      )}

      <Section style={{ marginTop: 8 }}>
        <Link
          href={url_produto ?? `${BASE_URL}/catalogo`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          {isAberto ? "Garantir agora" : "Continuar na lista"}
        </Link>
      </Section>
    </EmailBase>
  );
}
