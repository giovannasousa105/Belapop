import React from "react";
import { Section, Text, Link, Img, Row, Column, Hr } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface Item { nome: string; foto: string | null; preco_brl: number }

interface Props {
  numero_pedido?: string;
  itens?: Item[];
  total_brl?: number;
  prazo_entrega?: string;
  codigo_rastreio?: string | null;
  pontos_ganhos?: number;
  saldo_pontos?: number;
  entrou_popclub?: boolean;
  nome?: string;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

function formatBrl(value: number) {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PedidoConfirmado({
  numero_pedido = "—",
  itens = [],
  total_brl = 0,
  prazo_entrega,
  codigo_rastreio,
  pontos_ganhos,
  saldo_pontos,
  entrou_popclub,
  nome,
  unsubscribe_url,
}: Props) {
  return (
    <EmailBase preview={`Pedido #${numero_pedido} confirmado — chegará em breve`} is_transacional>
      <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "#1e1e1e", marginBottom: 6 }}>
        Pedido confirmado
      </Text>
      {nome && (
        <Text style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
          Olá{nome ? `, ${nome}` : ""}. Seu pedido #{numero_pedido} está confirmado.
        </Text>
      )}

      {itens.map((item, i) => (
        <Row key={i} style={{ marginBottom: 12 }}>
          <Column style={{ width: 52 }}>
            {item.foto && <Img src={item.foto} width={44} height={44} alt={item.nome} style={{ borderRadius: 6, objectFit: "cover" }} />}
          </Column>
          <Column>
            <Text style={{ fontSize: 13, color: "#1e1e1e", margin: 0, fontWeight: 500 }}>{item.nome}</Text>
            <Text style={{ fontSize: 12, color: "#999", margin: 0 }}>{formatBrl(item.preco_brl)}</Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: "#ece8e4", margin: "16px 0" }} />

      <Row>
        <Column><Text style={{ fontSize: 13, color: "#666", margin: 0 }}>Total</Text></Column>
        <Column style={{ textAlign: "right" as const }}>
          <Text style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", margin: 0 }}>{formatBrl(total_brl)}</Text>
        </Column>
      </Row>

      {prazo_entrega && (
        <Text style={{ fontSize: 13, color: "#666", marginTop: 12 }}>Prazo estimado: {prazo_entrega}</Text>
      )}
      {codigo_rastreio && (
        <Text style={{ fontSize: 13, color: "#666" }}>Rastreio: <strong>{codigo_rastreio}</strong></Text>
      )}

      {pontos_ganhos != null && pontos_ganhos > 0 && (
        <Section style={{ marginTop: 20, padding: "14px 16px", backgroundColor: "#f7f5f2", borderRadius: 8 }}>
          <Text style={{ fontSize: 13, color: "#1e1e1e", margin: 0 }}>
            +{pontos_ganhos} pontos PopClub adicionados ao seu saldo
            {saldo_pontos != null ? ` · Total: ${saldo_pontos} pts` : ""}
          </Text>
        </Section>
      )}

      {entrou_popclub && (
        <Section style={{ marginTop: 20, padding: "14px 16px", backgroundColor: "#1e1e1e", borderRadius: 8 }}>
          <Text style={{ fontSize: 13, color: "#fff", margin: 0, fontWeight: 500 }}>
            Bem-vinda ao PopClub · Acesso antecipado + créditos exclusivos
          </Text>
          <Link href={`${BASE_URL}/popclub`} style={{ fontSize: 12, color: "#ccc", marginTop: 4 }}>
            Conhecer benefícios
          </Link>
        </Section>
      )}

      <Section style={{ marginTop: 24 }}>
        <Link
          href={`${BASE_URL}/conta/pedidos`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          Acompanhar pedido
        </Link>
      </Section>
    </EmailBase>
  );
}
