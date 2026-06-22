import React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Props {
  nome?: string;
  numero_pedido?: string;
  codigo_rastreio?: string;
  transportadora?: string;
  url_rastreio?: string;
  prazo_estimado?: string;
  unsubscribe_url?: string;
}

export default function PedidoEnviado({
  nome,
  numero_pedido = "—",
  codigo_rastreio = "—",
  transportadora,
  url_rastreio,
  prazo_estimado,
  unsubscribe_url,
}: Props) {
  return (
    <EmailBase preview={`Pedido #${numero_pedido} saiu para entrega`} is_transacional>
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#999", marginBottom: 8 }}>
        Pedido #{numero_pedido}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "#1e1e1e", marginBottom: 4 }}>
        Seu pedido está a caminho.
      </Text>
      {nome && (
        <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
          Olá{nome ? `, ${nome}` : ""}. Separamos e enviamos o seu pedido.
        </Text>
      )}

      {/* Código de rastreio em destaque */}
      <Section style={{ backgroundColor: "#1e1e1e", borderRadius: 8, padding: "20px 24px", marginBottom: 20 }}>
        <Text style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#d8a0ac", margin: "0 0 6px" }}>
          Código de rastreio
        </Text>
        <Text style={{ fontSize: 18, fontWeight: 600, color: "#ffffff", fontFamily: "monospace, Courier New", margin: "0 0 4px", letterSpacing: "0.08em" }}>
          {codigo_rastreio}
        </Text>
        {transportadora && (
          <Text style={{ fontSize: 11, color: "#999", margin: 0 }}>
            {transportadora}
          </Text>
        )}
      </Section>

      {prazo_estimado && (
        <Section style={{ backgroundColor: "#fbf7f4", borderRadius: 8, padding: "14px 20px", marginBottom: 24 }}>
          <Text style={{ fontSize: 13, color: "#555", margin: 0 }}>
            Previsão de entrega: <strong style={{ color: "#1e1e1e" }}>{prazo_estimado}</strong>
          </Text>
        </Section>
      )}

      <Section style={{ marginBottom: 20 }}>
        {url_rastreio ? (
          <Link
            href={url_rastreio}
            style={{ ...s.brand, backgroundColor: "#d51e71", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
          >
            Rastrear agora →
          </Link>
        ) : (
          <Link
            href={`${BASE_URL}/conta/pedidos`}
            style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
          >
            Ver meus pedidos →
          </Link>
        )}
      </Section>

      <Text style={{ fontSize: 12, color: "#aaa", lineHeight: "1.6" }}>
        Dúvidas sobre a entrega? Fale com o atendimento em{" "}
        <Link href={`mailto:contato@belapopoficial.com.br`} style={{ color: "#aaa" }}>
          contato@belapopoficial.com.br
        </Link>
      </Text>
    </EmailBase>
  );
}
