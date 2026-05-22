import React from "react";
import { Section, Text, Link, Img, Row, Column } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

interface ItemReservado {
  produto_nome: string;
  produto_imagem: string;
  preco_centavos: number;
  qtd_disponivel: number;
}

interface Props {
  nome?: string | null;
  versao?: "urgente" | "editorial";
  itens_reservados?: ItemReservado[];
  checkout_url?: string | null;
  lote_esgotou?: boolean;
  produto_alternativo?: { nome: string; produto_id: string; score_compat: number } | null;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CarrinhoAbandonado({
  nome,
  versao = "urgente",
  itens_reservados = [],
  checkout_url,
  lote_esgotou = false,
  produto_alternativo,
  unsubscribe_url,
}: Props) {
  const isUrgente = versao === "urgente";

  return (
    <EmailBase
      preview={isUrgente ? "Sua rotina está quase pronta" : "Sua rotina estava quase pronta"}
      grupo="LIFECYCLE"
      unsubscribe_url={unsubscribe_url}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#999", marginBottom: 10 }}>
        BelaPop · Carrinho
      </Text>

      <Text style={{ fontSize: 22, fontWeight: 500, color: "#1e1e1e", marginBottom: 6, fontFamily: "Georgia, serif" }}>
        {isUrgente
          ? `${nome ? `${nome}, sua` : "Sua"} rotina está quase pronta`
          : `${nome ? `${nome}, sua` : "Sua"} rotina estava quase pronta`}
      </Text>

      {isUrgente && !lote_esgotou && (
        <Text style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
          Os produtos reservados aguardam por você.
        </Text>
      )}

      {isUrgente && lote_esgotou && (
        <Text style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
          As unidades reservadas foram liberadas. Veja abaixo o que ainda está disponível.
        </Text>
      )}

      {!isUrgente && (
        <Text style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
          A reserva expirou, mas você pode voltar a explorar quando quiser.
        </Text>
      )}

      {itens_reservados.map((item, i) => (
        <Row key={i} style={{ marginBottom: 12, padding: "10px", backgroundColor: "#fbf7f4", borderRadius: 8 }}>
          <Column style={{ width: 60 }}>
            {item.produto_imagem && (
              <Img
                src={item.produto_imagem} width={50} height={50}
                alt={item.produto_nome}
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
            )}
          </Column>
          <Column>
            <Text style={{ fontSize: 13, fontWeight: 500, color: "#1e1e1e", margin: 0 }}>
              {item.produto_nome}
            </Text>
            <Text style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>
              {brl(item.preco_centavos)}
            </Text>
            {isUrgente && item.qtd_disponivel > 0 && item.qtd_disponivel <= 10 && (
              <Text style={{ fontSize: 11, color: "#8a6400", margin: "2px 0 0" }}>
                {item.qtd_disponivel} {item.qtd_disponivel === 1 ? "unidade restante" : "unidades restantes"}
              </Text>
            )}
          </Column>
        </Row>
      ))}

      {produto_alternativo && (
        <Section style={{ marginTop: 16, padding: "12px 14px", backgroundColor: "#f0ede9", borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: "#666", margin: 0 }}>
            Enquanto isso, encontramos algo parecido: <strong>{produto_alternativo.nome}</strong>
            {produto_alternativo.score_compat >= 60 && (
              <span style={{ color: "#1a7a35" }}> · {produto_alternativo.score_compat}% compatível</span>
            )}
          </Text>
          <Link
            href={`${BASE_URL}/produto/${produto_alternativo.produto_id}`}
            style={{ fontSize: 12, color: "#1e1e1e", marginTop: 4, display: "block" }}
          >
            Ver produto
          </Link>
        </Section>
      )}

      {isUrgente && checkout_url && (
        <Section style={{ marginTop: 24 }}>
          <Link
            href={checkout_url}
            style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
          >
            Finalizar pedido
          </Link>
        </Section>
      )}

      {!isUrgente && (
        <Section style={{ marginTop: 24 }}>
          <Link
            href={`${BASE_URL}/catalogo`}
            style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
          >
            Ver produtos
          </Link>
        </Section>
      )}
    </EmailBase>
  );
}
