import React from "react";
import { Section, Text, Link, Img, Row, Column, Hr } from "@react-email/components";
import { EmailBase, BASE_URL, baseStyles as s } from "./base/EmailBase";

// Tom obrigatório: atelier, nunca liquidação.
// Proibido: "última chance", "corra", "urgente", "!" nos títulos.

interface ProdutoCuradoria {
  produto_id: string;
  nome: string;
  imagem: string;
  preco_centavos: number;
  score_compat: number | null;
  acesso_antecipado_horas?: number;
  urgencia_level: "none" | "low" | "high";
  texto_estoque?: string;
}

interface Props {
  nome?: string | null;
  semana_numero?: number;
  data_fechamento?: string;
  produtos?: ProdutoCuradoria[];
  produto_destaque?: ProdutoCuradoria;
  tipo_pele?: string | null;
  eh_membro_popclub?: boolean;
  unsubscribe_url?: string;
  [key: string]: unknown;
}

const TIPO_L: Record<string, string> = {
  OLEOSA: "oleosa", SECA: "seca", MISTA: "mista", SENSIVEL: "sensível", NORMAL: "normal",
};

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CuradoriaSemanal({
  nome,
  semana_numero,
  data_fechamento,
  produtos = [],
  produto_destaque,
  tipo_pele,
  eh_membro_popclub = false,
  unsubscribe_url,
}: Props) {
  const destaque = produto_destaque ?? produtos[0];
  const grade = destaque ? produtos.slice(1, 6) : produtos.slice(0, 5);

  return (
    <EmailBase
      preview={`Curadoria da semana${data_fechamento ? ` · encerra ${data_fechamento}` : ""}`}
      grupo="EDITORIAL"
      unsubscribe_url={unsubscribe_url}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#999", marginBottom: 4 }}>
        Curadoria BelaPop{semana_numero ? ` · semana ${semana_numero}` : ""}
      </Text>

      {data_fechamento && (
        <Text style={{ fontSize: 11, color: "#bbb", marginBottom: 16 }}>
          Encerra {data_fechamento}
        </Text>
      )}

      {tipo_pele && (
        <Text style={{ fontSize: 12, color: "#8a6400", marginBottom: 16 }}>
          Selecionado para pele {TIPO_L[tipo_pele] ?? tipo_pele}
        </Text>
      )}

      {/* Produto destaque editorial */}
      {destaque && (
        <Section style={{ marginBottom: 24 }}>
          {destaque.imagem && (
            <Img
              src={destaque.imagem} width={200} height={200}
              alt={destaque.nome}
              style={{ borderRadius: 10, objectFit: "cover", marginBottom: 12 }}
            />
          )}
          <Text style={{ fontSize: 18, fontWeight: 500, color: "#1e1e1e", margin: 0, fontFamily: "Georgia, serif" }}>
            {destaque.nome}
          </Text>
          <Text style={{ fontSize: 14, color: "#555", margin: "4px 0 8px" }}>
            {brl(destaque.preco_centavos)}
          </Text>

          {destaque.score_compat != null && destaque.score_compat >= 60 && (
            <Text style={{ fontSize: 11, color: "#1a7a35", margin: "0 0 4px" }}>
              {destaque.score_compat}% compatível com sua pele
            </Text>
          )}

          {eh_membro_popclub && destaque.acesso_antecipado_horas && (
            <Text style={{ fontSize: 11, color: "#8a6400", margin: "0 0 4px" }}>
              Acesso antecipado: {destaque.acesso_antecipado_horas}h antes do público
            </Text>
          )}

          {destaque.urgencia_level === "high" && destaque.texto_estoque && (
            <Text style={{ fontSize: 11, color: "#555", margin: "0 0 4px" }}>
              · {destaque.texto_estoque} disponíveis
            </Text>
          )}

          <Link
            href={`${BASE_URL}/produto/${destaque.produto_id}`}
            style={{ fontSize: 13, color: "#1e1e1e", fontWeight: 500, textDecoration: "underline" }}
          >
            Ver produto
          </Link>
        </Section>
      )}

      {grade.length > 0 && (
        <>
          <Hr style={{ borderColor: "#ece8e4", margin: "0 0 20px" }} />

          {grade.map((p, i) => (
            <Row key={i} style={{ marginBottom: 16 }}>
              <Column style={{ width: 88 }}>
                {p.imagem && (
                  <Img src={p.imagem} width={76} height={76} alt={p.nome}
                    style={{ borderRadius: 6, objectFit: "cover" }} />
                )}
              </Column>
              <Column>
                <Link
                  href={`${BASE_URL}/produto/${p.produto_id}`}
                  style={{ fontSize: 13, fontWeight: 500, color: "#1e1e1e", textDecoration: "none" }}
                >
                  {p.nome}
                </Link>
                <Text style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>
                  {brl(p.preco_centavos)}
                </Text>
                {p.score_compat != null && p.score_compat >= 60 && (
                  <Text style={{ fontSize: 11, color: "#1a7a35", margin: "2px 0 0" }}>
                    {p.score_compat}% compatível
                  </Text>
                )}
                {eh_membro_popclub && p.acesso_antecipado_horas && (
                  <Text style={{ fontSize: 11, color: "#8a6400", margin: "2px 0 0" }}>
                    Acesso {p.acesso_antecipado_horas}h antes
                  </Text>
                )}
                {p.urgencia_level === "high" && p.texto_estoque && (
                  <Text style={{ fontSize: 11, color: "#555", margin: "2px 0 0" }}>
                    · {p.texto_estoque} disponíveis
                  </Text>
                )}
              </Column>
            </Row>
          ))}
        </>
      )}

      <Section style={{ marginTop: 16 }}>
        <Link
          href={`${BASE_URL}/`}
          style={{ ...s.brand, backgroundColor: "#1e1e1e", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
        >
          Ver curadoria completa
        </Link>
      </Section>
    </EmailBase>
  );
}
