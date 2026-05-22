import React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome?: string;
  marcador_foco?: string;
  mensagem_copilot?: string;
  sugestoes_rotina?: string[];
  scan_id?: string;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

const MARCADOR_L: Record<string, string> = {
  acne: "acne", poros: "poros", textura: "textura", oleosidade: "oleosidade",
  pigmentacao: "manchas", vermelhidao: "vermelhidão", ressecamento: "ressecamento",
};

export default function AlertaRegressao({
  nome, marcador_foco = "textura", mensagem_copilot,
  sugestoes_rotina = [], scan_id, unsubscribe_url,
}: Props) {
  return (
    <EmailBase preview={`Atenção: variação em ${MARCADOR_L[marcador_foco] ?? marcador_foco}`} grupo="PELE" unsubscribe_url={unsubscribe_url}>
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#8a6400", marginBottom: 8 }}>
        Skin Copilot · Alerta
      </Text>
      <Text style={{ fontSize: 22, fontWeight: 500, color: "#1e1e1e", marginBottom: 6, fontFamily: "Georgia, serif" }}>
        Variação detectada em {MARCADOR_L[marcador_foco] ?? marcador_foco}
      </Text>

      {mensagem_copilot && (
        <Text style={{ fontSize: 14, lineHeight: "1.7", color: "#555", marginBottom: 20, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
          {mensagem_copilot}
        </Text>
      )}

      {sugestoes_rotina.length > 0 && (
        <>
          <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
            Ajuste sugerido
          </Text>
          {sugestoes_rotina.map((s, i) => (
            <Text key={i} style={{ fontSize: 13, color: "#555", margin: "0 0 6px", paddingLeft: 12, borderLeft: "2px solid #ece8e4" }}>{s}</Text>
          ))}
        </>
      )}

      <Section style={{ marginTop: 24 }}>
        <Link href={`${BASE_URL}/skin-scan/resultado/${scan_id ?? ""}`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}>
          Ver análise completa
        </Link>
      </Section>
    </EmailBase>
  );
}
