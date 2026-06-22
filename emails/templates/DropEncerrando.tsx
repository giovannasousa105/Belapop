import React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome?: string;
  nome_drop?: string;
  url_drop?: string;
  unsubscribe_url?: string;
}

export default function DropEncerrando({
  nome,
  nome_drop = "Drop BelaPop",
  url_drop,
  unsubscribe_url,
}: Props) {
  const href = url_drop ?? `${BASE_URL}/circulo`;

  return (
    <EmailBase preview={`Últimas 6h: ${nome_drop} encerra hoje`} unsubscribe_url={unsubscribe_url} grupo="CÍRCULO">
      {/* Fundo escuro — urgência */}
      <Section style={{ backgroundColor: "#1e1e1e", borderRadius: 8, padding: "28px 24px", marginBottom: 24 }}>
        <Text style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.20em", textTransform: "uppercase" as const, color: "#d8a0ac", margin: "0 0 12px" }}>
          ⏱ Aviso final
        </Text>
        <Text style={{ fontSize: 24, fontWeight: 600, color: "#ffffff", margin: "0 0 8px", fontFamily: "Georgia, serif" }}>
          {nome ? `${nome.split(" ")[0]}, restam 6 horas.` : "Restam 6 horas."}
        </Text>
        <Text style={{ fontSize: 14, color: "#d8a0ac", margin: 0, lineHeight: "1.6" }}>
          O drop <strong>{nome_drop}</strong> encerra hoje.{"\n"}
          Sem reposição após o prazo.
        </Text>
      </Section>

      {/* CTA vermelho — alta urgência */}
      <Section style={{ marginBottom: 24 }}>
        <Link
          href={href}
          style={{ ...s.brand, backgroundColor: "#d51e71", color: "#fff", padding: "14px 28px", borderRadius: 8, textDecoration: "none", display: "block", textAlign: "center" as const, fontSize: 12, letterSpacing: "0.16em" }}
        >
          Garantir agora — últimas horas →
        </Link>
      </Section>

      <Text style={{ fontSize: 11, color: "#bbb", lineHeight: "1.6", textAlign: "center" as const }}>
        Não quer mais receber lembretes de drops?{" "}
        {unsubscribe_url && (
          <Link href={unsubscribe_url} style={{ color: "#bbb", textDecoration: "underline" }}>
            Cancelar
          </Link>
        )}
      </Text>
    </EmailBase>
  );
}
