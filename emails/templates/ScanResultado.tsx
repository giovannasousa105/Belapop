import React from "react";
import { Section, Text, Link, Img, Row, Column } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Produto { nome: string; foto: string | null; score_compat: number }
interface Metrica { label: string; valor: number }

interface Props {
  skin_id?: string;
  tipo_pele?: string;
  metricas?: Metrica[];
  produtos_rotina?: Produto[];
  narrativa?: string;
  scan_id?: string;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

export default function ScanResultado({
  skin_id = "BP-??????",
  tipo_pele = "Mista",
  metricas = [],
  produtos_rotina = [],
  narrativa,
  scan_id,
  unsubscribe_url,
}: Props) {
  const url = scan_id ? `${BASE_URL}/skin-scan/resultado/${scan_id}` : `${BASE_URL}/skin-scan`;

  return (
    <EmailBase preview={`Seu Skin ID ${skin_id} está pronto`} grupo="PELE" unsubscribe_url={unsubscribe_url}>
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#999", marginBottom: 8 }}>
        Skin Scan · {skin_id}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "#1e1e1e", marginBottom: 6 }}>
        Pele {tipo_pele}
      </Text>

      {narrativa && (
        <Text style={{ fontSize: 14, lineHeight: "1.7", color: "#555", marginBottom: 20, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
          {narrativa}
        </Text>
      )}

      {metricas.slice(0, 3).map((m, i) => (
        <Section key={i} style={{ marginBottom: 8 }}>
          <Row>
            <Column style={{ width: 100 }}>
              <Text style={{ fontSize: 11, color: "#999", margin: 0, letterSpacing: "0.06em" }}>{m.label.toUpperCase()}</Text>
            </Column>
            <Column>
              <div style={{ height: 3, backgroundColor: "#ece8e4", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, m.valor)}%`, backgroundColor: "#1e1e1e", borderRadius: 99 }} />
              </div>
            </Column>
          </Row>
        </Section>
      ))}

      {produtos_rotina.length > 0 && (
        <Section style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#999", marginBottom: 12 }}>
            Rotina sugerida
          </Text>
          {produtos_rotina.slice(0, 2).map((p, i) => (
            <Row key={i} style={{ marginBottom: 12, backgroundColor: "#fbf7f4", padding: "12px", borderRadius: 8 }}>
              <Column style={{ width: 52 }}>
                {p.foto && <Img src={p.foto} width={44} height={44} alt={p.nome} style={{ borderRadius: 6, objectFit: "cover" }} />}
              </Column>
              <Column>
                <Text style={{ fontSize: 13, fontWeight: 500, color: "#1e1e1e", margin: 0 }}>{p.nome}</Text>
                <Text style={{ fontSize: 11, color: "#999", margin: 0 }}>{p.score_compat}% compatível</Text>
              </Column>
            </Row>
          ))}
        </Section>
      )}

      <Section style={{ marginTop: 24 }}>
        <Link href={url} style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}>
          Ver minha rotina completa
        </Link>
      </Section>
    </EmailBase>
  );
}
