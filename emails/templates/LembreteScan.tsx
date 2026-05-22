import React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome?: string;
  dias_desde_ultimo_scan?: number;
  proximo_scan_recomendado_em?: string;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

export default function LembreteScan({ nome, dias_desde_ultimo_scan, proximo_scan_recomendado_em, unsubscribe_url }: Props) {
  const dataFmt = proximo_scan_recomendado_em
    ? new Date(proximo_scan_recomendado_em).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
    : null;

  return (
    <EmailBase preview="Hora de um novo scan da sua pele" grupo="PELE" unsubscribe_url={unsubscribe_url}>
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
        Skin Scan · Lembrete
      </Text>
      <Text style={{ fontSize: 22, fontWeight: 500, color: "#1e1e1e", marginBottom: 6, fontFamily: "Georgia, serif" }}>
        Hora de um novo scan
      </Text>
      <Text style={{ fontSize: 14, lineHeight: "1.7", color: "#555", marginBottom: 20 }}>
        {dias_desde_ultimo_scan != null
          ? `Seu último scan foi há ${dias_desde_ultimo_scan} dias.`
          : "Acompanhe a evolução da sua pele com regularidade."}
        {dataFmt ? ` Scan recomendado até ${dataFmt}.` : " O intervalo ideal é de 6 semanas."}
      </Text>

      <Section style={{ padding: "14px 16px", backgroundColor: "#fbf7f4", borderRadius: 8, marginBottom: 20 }}>
        <Text style={{ fontSize: 13, color: "#555", margin: 0 }}>
          O Skin Scan compara sua pele ao longo do tempo e ajusta a rotina conforme você evolui.
        </Text>
      </Section>

      <Section>
        <Link href={`${BASE_URL}/skin-scan/foco`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}>
          Iniciar scan agora
        </Link>
      </Section>
    </EmailBase>
  );
}
