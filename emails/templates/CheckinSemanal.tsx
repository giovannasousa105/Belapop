import React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailBase, BASE_URL } from "./base/EmailBase";

interface Props {
  mensagem_copilot?: string;
  envio_id?: string;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

const NOTAS = [
  { nota: 5, label: "Ótima" },
  { nota: 4, label: "Boa" },
  { nota: 3, label: "Normal" },
  { nota: 2, label: "Sensível" },
  { nota: 1, label: "Com irritação" },
];

export default function CheckinSemanal({ mensagem_copilot, envio_id, unsubscribe_url }: Props) {
  return (
    <EmailBase preview="Como sua pele está esta semana?" grupo="PELE" unsubscribe_url={unsubscribe_url}>
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
        Skin Copilot · Check-in semanal
      </Text>

      {mensagem_copilot && (
        <Text style={{ fontSize: 15, lineHeight: "1.7", color: "#1e1e1e", marginBottom: 20, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
          {mensagem_copilot}
        </Text>
      )}

      <Text style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
        Como sua pele está esta semana?
      </Text>

      <Section>
        {NOTAS.map(({ nota, label }) => (
          <Link
            key={nota}
            href={`${BASE_URL}/api/crm/checkin?resposta=${nota}&envio_id=${envio_id ?? ""}`}
            style={{
              display: "inline-block",
              margin: "0 6px 8px 0",
              padding: "8px 16px",
              borderRadius: 8,
              border: "0.5px solid #ece8e4",
              backgroundColor: "#fbf7f4",
              fontSize: 12,
              color: "#1e1e1e",
              textDecoration: "none",
            }}
          >
            {label}
          </Link>
        ))}
      </Section>

      <Text style={{ fontSize: 11, color: "#bbb", marginTop: 16 }}>
        Responda clicando em uma opção acima — sem precisar abrir o app.
      </Text>
    </EmailBase>
  );
}
