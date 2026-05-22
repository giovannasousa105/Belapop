import React from "react";
import { Section, Text, Link, Img } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

// Tom: parceria, não venda.
// Foco em: continuidade da rotina, progresso real do marcador.

interface Props {
  nome?: string | null;
  produto_nome?: string;
  produto_imagem?: string | null;
  preco_centavos?: number;
  ativo_principal?: string;
  marcador_alvo?: string;
  dias_usados?: number;
  dias_restantes?: number;
  delta_marcador?: number;    // sempre positivo (melhora visível ao usuário)
  url_produto?: string;
  lote_disponivel?: boolean;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

const MARCADOR_L: Record<string, string> = {
  acne:         "acne",
  poros:        "poros",
  textura:      "textura",
  oleosidade:   "oleosidade",
  pigmentacao:  "manchas",
  vermelhidao:  "vermelhidão",
  ressecamento: "ressecamento",
};

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function RecompraAssistida({
  nome,
  produto_nome = "produto",
  produto_imagem,
  preco_centavos = 0,
  ativo_principal = "",
  marcador_alvo = "",
  dias_usados = 0,
  dias_restantes = 0,
  delta_marcador = 0,
  url_produto,
  lote_disponivel = true,
  unsubscribe_url,
}: Props) {
  const marcadorLabel = MARCADOR_L[marcador_alvo] ?? marcador_alvo;

  return (
    <EmailBase
      preview={`Seu ${produto_nome} está chegando ao fim`}
      grupo="EDITORIAL"
      unsubscribe_url={unsubscribe_url}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
        Sua rotina · Lembrete
      </Text>

      {produto_imagem && (
        <Img
          src={produto_imagem} width={120} height={120}
          alt={produto_nome}
          style={{ borderRadius: 8, objectFit: "cover", marginBottom: 16 }}
        />
      )}

      <Text style={{ fontSize: 20, fontWeight: 500, color: "#1e1e1e", marginBottom: 6, fontFamily: "Georgia, serif" }}>
        Seu {produto_nome} está chegando ao fim
      </Text>

      <Text style={{ fontSize: 14, color: "#555", marginBottom: 4 }}>
        {nome ? `${nome}, você` : "Você"} o usa há {dias_usados} dias.
        {dias_restantes > 0 && ` Estimativa: ${dias_restantes} dias restantes.`}
      </Text>

      {ativo_principal && marcador_alvo && (
        <Text style={{ fontSize: 14, color: "#555", lineHeight: "1.7", marginBottom: 16 }}>
          Interromper o {ativo_principal} agora pode reverter o progresso de {marcadorLabel} que você conquistou.
        </Text>
      )}

      {delta_marcador > 0 && marcador_alvo && (
        <Section style={{ padding: "12px 16px", backgroundColor: "#f0faf4", borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: "#1a7a35", margin: 0, fontWeight: 500 }}>
            Sua {marcadorLabel} melhorou {delta_marcador} pts desde que você começou a usar.
          </Text>
        </Section>
      )}

      <Text style={{ fontSize: 14, color: "#555", marginBottom: 4 }}>
        {brl(preco_centavos)}
      </Text>

      <Section style={{ marginTop: 16 }}>
        <Link
          href={url_produto ?? `${BASE_URL}/catalogo`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          {lote_disponivel ? "Repor agora" : "Ver produto"}
        </Link>
      </Section>
    </EmailBase>
  );
}
