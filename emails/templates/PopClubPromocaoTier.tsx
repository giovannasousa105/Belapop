import React from "react";
import { Section, Text, Link, Hr } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

type Tier = "ESSENCIAL" | "PREMIUM" | "LUXO";

interface Props {
  nome?:               string;
  tier_anterior?:      Tier;
  tier_novo?:          "PREMIUM" | "LUXO";
  nova_antecipacao_h?: number;
  pontos_acumulados?:  number;
  unsubscribe_url?:    string;
  [key: string]: unknown;
}

const TIER_LABEL: Record<string, string> = {
  ESSENCIAL: "Essencial",
  PREMIUM:   "Premium",
  LUXO:      "Luxo",
};

const ANTECIPACAO_POR_TIER: Record<Tier, number> = {
  ESSENCIAL: 24,
  PREMIUM:   48,
  LUXO:      72,
};

const BENEFICIOS_POR_TRANSICAO: Record<string, string[]> = {
  "ESSENCIAL→PREMIUM": [
    "Acesso 48h (era 24h)",
    "Multiplicador 1.2× nos pontos de compra",
    "Concierge prioritário",
  ],
  "PREMIUM→LUXO": [
    "Acesso 72h (era 48h)",
    "Multiplicador 1.5× nos pontos",
    "Frete prioritário incluído",
    "Acesso a lançamentos exclusivos",
  ],
};

export default function PopClubPromocaoTier({
  nome,
  tier_anterior = "ESSENCIAL",
  tier_novo     = "PREMIUM",
  nova_antecipacao_h,
  pontos_acumulados,
  unsubscribe_url,
}: Props) {
  const tierNovoLabel = TIER_LABEL[tier_novo] ?? tier_novo;
  const antecipacaoAnterior = ANTECIPACAO_POR_TIER[tier_anterior] ?? 24;
  const antecipacaoNova = nova_antecipacao_h ?? ANTECIPACAO_POR_TIER[tier_novo] ?? 48;
  const chaveTransicao = `${tier_anterior}→${tier_novo}`;
  const beneficios = BENEFICIOS_POR_TRANSICAO[chaveTransicao] ?? [];

  return (
    <EmailBase
      preview={`Você subiu para ${tierNovoLabel} no PopClub`}
      is_transacional
      unsubscribe_url={unsubscribe_url}
      grupo="TRANSACIONAL"
    >
      {/* 1. HEADER */}
      <Text style={{ fontSize: 28, fontWeight: 500, color: "#1e1e1e", marginBottom: 4 }}>
        {tierNovoLabel}
      </Text>
      <Text style={{ fontSize: 14, color: "#666666", marginBottom: 28 }}>
        Você subiu de tier no PopClub
      </Text>

      {/* 2. NOVO BENEFÍCIO EM DESTAQUE */}
      <Section style={{ backgroundColor: "#1e1e1e", padding: "16px", borderRadius: 8, marginBottom: 24 }}>
        <Text style={{ fontSize: 14, color: "#ffffff", margin: "0 0 4px", fontWeight: 500 }}>
          Acesso antecipado de {antecipacaoNova}h
        </Text>
        <Text style={{ fontSize: 12, color: "#cccccc", margin: 0 }}>
          Antes: {antecipacaoAnterior}h · Agora: {antecipacaoNova}h
        </Text>
      </Section>

      {/* 3. O QUE MUDA */}
      {beneficios.length > 0 && (
        <>
          <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#999999", marginBottom: 12 }}>
            O que muda
          </Text>
          {beneficios.map((b, i) => (
            <Text key={i} style={{ fontSize: 13, color: "#555555", margin: "0 0 8px", paddingLeft: 14, borderLeft: "2px solid #e5e5e5" }}>
              {b}
            </Text>
          ))}
        </>
      )}

      {/* 4. PONTOS ACUMULADOS */}
      {pontos_acumulados != null && (
        <Section style={{ marginTop: 20, padding: "12px 14px", backgroundColor: "#f9f9f9", borderRadius: 8 }}>
          <Text style={{ fontSize: 13, color: "#1e1e1e", margin: "0 0 4px" }}>
            {pontos_acumulados} pts acumulados nos últimos 12 meses
          </Text>
          <Text style={{ fontSize: 12, color: "#999999", margin: 0 }}>
            Este número define seu tier — diferente do saldo disponível para resgate.
          </Text>
        </Section>
      )}

      {/* 5. CTA */}
      <Section style={{ marginTop: 28 }}>
        <Link
          href={`${BASE_URL}/popclub`}
          style={{ ...s.brand, backgroundColor: "#000000", color: "#ffffff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          Ver meus novos benefícios
        </Link>
      </Section>

      {/* Sem unsubscribe para promoção de tier (transacional positivo) */}
      <Hr style={{ borderColor: "#e5e5e5", margin: "28px 0 12px" }} />
      <Text style={{ fontSize: 11, color: "#999999", margin: 0 }}>
        Você recebe este e-mail porque subiu de tier no PopClub BelaPop.{" "}
        <Link href={`${BASE_URL}/configuracoes/emails`} style={{ color: "#999999" }}>
          Gerenciar preferências de e-mail
        </Link>
      </Text>
    </EmailBase>
  );
}
