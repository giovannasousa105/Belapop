import React from "react";
import { Section, Text, Link, Img, Row, Column } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface ProdutoNovo { nome: string; imagem: string; preco_centavos: number; slug: string }

interface Props {
  nome?: string | null;
  versao?: "30d" | "60d";
  produtos_novos?: ProdutoNovo[];
  credito_valor?: number | null;
  credito_id?: string | null;
  entrar_popclub?: boolean;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Reativacao({
  nome,
  versao = "30d",
  produtos_novos = [],
  credito_valor,
  entrar_popclub = false,
  unsubscribe_url,
}: Props) {
  const is60 = versao === "60d";

  return (
    <EmailBase
      preview={
        is60
          ? `${nome ? `${nome}, ` : ""}${credito_valor ? `R$${credito_valor} te esperam` : "Sentimos sua falta"}`
          : "Algumas novidades desde sua última visita"
      }
      grupo="LIFECYCLE"
      unsubscribe_url={unsubscribe_url}
    >
      <Text style={{ fontSize: 22, fontWeight: 500, color: "#1e1e1e", marginBottom: 6, fontFamily: "Georgia, serif" }}>
        {is60
          ? `Sentimos sua falta${nome ? `, ${nome.split(" ")[0]}` : ""}.`
          : "Algumas novidades desde sua última visita"}
      </Text>

      {!is60 && (
        <Text style={{ fontSize: 14, color: "#555", lineHeight: "1.7", marginBottom: 20 }}>
          O que há de novo na BelaPop desde que você foi embora.
        </Text>
      )}

      {is60 && credito_valor != null && (
        <Section style={{ padding: "16px", backgroundColor: "#1e1e1e", borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, color: "#fff", margin: 0, fontWeight: 600 }}>
            {brl(credito_valor * 100)} em crédito esperando por você
          </Text>
          <Text style={{ fontSize: 12, color: "#aaa", margin: "4px 0 0" }}>
            Válido por 30 dias · Aplicável em qualquer pedido
          </Text>
        </Section>
      )}

      {is60 && entrar_popclub && (
        <Section style={{ padding: "12px 16px", backgroundColor: "#f7f5f2", borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 13, color: "#555", margin: 0 }}>
            Você pode entrar no PopClub com sua próxima compra e começar a acumular pontos.
          </Text>
        </Section>
      )}

      {produtos_novos.length > 0 && (
        <>
          <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#999", marginBottom: 12 }}>
            {is60 ? "Enquanto isso, chegaram novidades" : "Novidades da semana"}
          </Text>

          {produtos_novos.slice(0, 3).map((p, i) => (
            <Row key={i} style={{ marginBottom: 10 }}>
              <Column style={{ width: 60 }}>
                {p.imagem && (
                  <Img src={p.imagem} width={50} height={50} alt={p.nome}
                    style={{ borderRadius: 6, objectFit: "cover" }} />
                )}
              </Column>
              <Column>
                <Link href={`${BASE_URL}/produto/${p.slug}`}
                  style={{ fontSize: 13, color: "#1e1e1e", fontWeight: 500, textDecoration: "none" }}>
                  {p.nome}
                </Link>
                <Text style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>
                  {brl(p.preco_centavos)}
                </Text>
              </Column>
            </Row>
          ))}
        </>
      )}

      <Section style={{ marginTop: 24 }}>
        <Link
          href={is60 ? `${BASE_URL}/catalogo` : `${BASE_URL}/`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          {is60 ? "Voltar à BelaPop" : "Ver novidades"}
        </Link>
      </Section>
    </EmailBase>
  );
}
