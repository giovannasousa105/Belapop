import React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

// INVARIANTE: delta_destaque sempre POSITIVO para o usuário.
// Internamente o score cai (score menor = melhor), mas exibimos como melhora visível.

interface Props {
  nome?: string | null;
  mes_referencia?: string;
  marcador_destaque?: string;
  delta_destaque?: number;        // SEMPRE positivo para o usuário (|delta|)
  total_scans?: number;
  semanas_desde_inicio?: number;
  melhora_global_pct?: number | null;
  tipo_pele_atual?: string | null;
  url_twin?: string;
  skin_id?: string | null;
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

const TIPO_L: Record<string, string> = {
  OLEOSA: "Oleosa", SECA: "Seca", MISTA: "Mista", SENSIVEL: "Sensível", NORMAL: "Normal",
};

export default function ProgressoTwinMensal({
  nome,
  mes_referencia,
  marcador_destaque = "oleosidade",
  delta_destaque = 0,
  total_scans = 0,
  semanas_desde_inicio = 0,
  melhora_global_pct,
  tipo_pele_atual,
  url_twin,
  skin_id,
  unsubscribe_url,
}: Props) {
  const marcadorLabel = MARCADOR_L[marcador_destaque] ?? marcador_destaque;

  return (
    <EmailBase
      preview={`Sua ${marcadorLabel} melhorou ${delta_destaque} pts em ${mes_referencia ?? "outubro"}`}
      grupo="PELE"
      unsubscribe_url={unsubscribe_url}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
        Skin Digital Twin · {mes_referencia ?? ""}
      </Text>

      <Text style={{ fontSize: 22, fontWeight: 500, color: "#1e1e1e", marginBottom: 16, fontFamily: "Georgia, serif" }}>
        {nome ? `${nome}, seu` : "Seu"} progresso do mês
      </Text>

      {/* Destaque principal do mês */}
      <Section style={{ padding: "16px", backgroundColor: "#f0faf4", borderRadius: 10, marginBottom: 20, borderLeft: "3px solid #1a7a35" }}>
        <Text style={{ fontSize: 14, color: "#1a7a35", margin: 0, fontWeight: 600 }}>
          Sua {marcadorLabel} melhorou {delta_destaque} pts este mês
        </Text>
        <Text style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>
          Score menor = condição mais controlada = resultado visível
        </Text>
      </Section>

      {/* Estatísticas da jornada */}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ marginBottom: 20 }}>
        <tbody>
          <tr>
            {[
              { label: "Scans realizados", value: String(total_scans) },
              {
                label: "Semanas de jornada",
                value: semanas_desde_inicio > 0 ? String(semanas_desde_inicio) : "—",
              },
              melhora_global_pct != null
                ? { label: "Marcadores melhorados", value: `${Math.round(melhora_global_pct)}%` }
                : null,
            ]
              .filter(Boolean)
              .slice(0, 3)
              .map((stat, i) => (
                <td key={i} style={{ textAlign: "center" as const, padding: "0 6px" }}>
                  <Text style={{ fontSize: 20, fontWeight: 600, color: "#1e1e1e", margin: 0 }}>
                    {stat!.value}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#999", margin: "2px 0 0" }}>
                    {stat!.label}
                  </Text>
                </td>
              ))}
          </tr>
        </tbody>
      </table>

      {tipo_pele_atual && (
        <Text style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
          Tipo de pele atual: <strong>{TIPO_L[tipo_pele_atual] ?? tipo_pele_atual}</strong>
        </Text>
      )}

      <Section>
        <Link
          href={url_twin ?? `${BASE_URL}/minha-pele`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          Ver análise completa
        </Link>
      </Section>
    </EmailBase>
  );
}
