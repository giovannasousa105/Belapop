import React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome?: string | null;
  tier_atual?: string;
  tier_risco?: string;
  pontos_acumulados_12m?: number;
  pontos_necessarios?: number;
  pontos_faltando?: number;
  data_avaliacao?: string;
  dias_para_avaliacao?: number;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

const TIER_L: Record<string, string> = {
  ESSENCIAL: "Essencial", PREMIUM: "Premium", LUXO: "Luxo",
};

export default function TierRiscoRebaixamento({
  nome,
  tier_atual = "PREMIUM",
  tier_risco = "ESSENCIAL",
  pontos_acumulados_12m = 0,
  pontos_necessarios = 0,
  pontos_faltando = 0,
  data_avaliacao,
  dias_para_avaliacao,
  unsubscribe_url,
}: Props) {
  const dataFmt = data_avaliacao
    ? new Date(data_avaliacao).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
    : "";

  const progressoPct = pontos_necessarios > 0
    ? Math.min(100, Math.round((pontos_acumulados_12m / pontos_necessarios) * 100))
    : 0;

  return (
    <EmailBase
      preview={`Seu tier ${TIER_L[tier_atual] ?? tier_atual} pode mudar em ${dias_para_avaliacao ?? "breve"}`}
      grupo="LIFECYCLE"
      unsubscribe_url={unsubscribe_url}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#8a6400", marginBottom: 8 }}>
        PopClub · Aviso de tier
      </Text>

      <Text style={{ fontSize: 22, fontWeight: 600, color: "#1e1e1e", marginBottom: 6 }}>
        {nome ? `${nome}, você` : "Você"} precisa de {pontos_faltando} pts
      </Text>

      {dataFmt && (
        <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
          Avaliação anual: {dataFmt}{dias_para_avaliacao != null ? ` · ${dias_para_avaliacao} dias` : ""}
        </Text>
      )}

      {/* Barra de progresso — inline CSS para compatibilidade com clientes de e-mail */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={{ fontSize: 11, color: "#999", paddingBottom: 4 }}>
              Progresso para manter o tier {TIER_L[tier_atual] ?? tier_atual}
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                <tbody>
                  <tr>
                    <td style={{ width: `${progressoPct}%`, backgroundColor: "#1e1e1e", height: 6, borderRadius: 3 }} />
                    <td style={{ backgroundColor: "#ece8e4", height: 6, borderRadius: 3 }} />
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style={{ fontSize: 11, color: "#999", paddingTop: 4, textAlign: "right" as const }}>
              {progressoPct}%
            </td>
          </tr>
        </tbody>
      </table>

      {/* Invariante visual PopClub: pts_acumulados_12m com label explícito */}
      <Section style={{ padding: "14px 16px", backgroundColor: "#fff8e6", borderRadius: 8, marginBottom: 20 }}>
        <Text style={{ fontSize: 12, color: "#8a6400", margin: 0 }}>
          Pontos acumulados nos últimos 12 meses:{" "}
          <strong>{pontos_acumulados_12m.toLocaleString("pt-BR")}</strong>
        </Text>
        <Text style={{ fontSize: 12, color: "#8a6400", margin: "4px 0 0" }}>
          Mínimo para manter o tier {TIER_L[tier_atual] ?? tier_atual}:{" "}
          <strong>{pontos_necessarios.toLocaleString("pt-BR")}</strong>
        </Text>
      </Section>

      <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
        Como ganhar pontos antes de {dataFmt || "a avaliação"}
      </Text>

      {[
        "Fazer seu próximo Skin Scan  ·  +50 pts",
        "Comprar qualquer produto  ·  +1 pt por R$1",
        "Completar check-ins diários  ·  +5 pts/dia",
      ].map((f, i) => (
        <Text key={i} style={{ fontSize: 13, color: "#555", margin: "0 0 6px", paddingLeft: 12, borderLeft: "2px solid #ece8e4" }}>
          {f}
        </Text>
      ))}

      <Section style={{ marginTop: 24 }}>
        <Link
          href={`${BASE_URL}/popclub#ganhar-pontos`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          Ganhar pontos agora
        </Link>
      </Section>
    </EmailBase>
  );
}
