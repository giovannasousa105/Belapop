import React from "react";
import { Hr, Text, Link } from "@react-email/components";
import { criarUnsubscribeToken } from "@/lib/crm/unsubscribeToken";
import type { FluxoEnum, GrupoEnum } from "@/lib/crm/crmTypes";
import { FLUXO_GRUPO } from "@/lib/crm/crmTypes";

interface FooterProps {
  fluxo: FluxoEnum;
  user_id: string;
  email: string;
  motivo_recebimento: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://belapopoficial.com.br";

const GRUPO_LABEL: Record<GrupoEnum, string> = {
  TRANSACIONAL: "e-mails transacionais",
  LIFECYCLE:    "e-mails de ciclo de vida",
  PELE:         "dicas de pele",
  EDITORIAL:    "e-mails editoriais",
};

const textStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#999999",
  lineHeight: "1.6",
  margin: "4px 0",
};

const linkStyle: React.CSSProperties = {
  color: "#999999",
  textDecoration: "underline",
};

// Nota: Footer é um Server Component (chamado em tempo de build do email).
// criarUnsubscribeToken é async — chamar antes de renderizar o template
// e passar unsubscribe_url como prop.
interface FooterWithUrlProps extends Omit<FooterProps, "user_id" | "email"> {
  unsubscribe_url: string;
  grupo: GrupoEnum;
}

export function Footer({ fluxo, unsubscribe_url, grupo, motivo_recebimento }: FooterWithUrlProps) {
  return (
    <>
      <Hr style={{ borderColor: "#e5e5e5", margin: "32px 0 16px" }} />
      <Text style={textStyle}>{motivo_recebimento}</Text>
      <Text style={textStyle}>
        <Link href={unsubscribe_url} style={linkStyle}>
          Cancelar {GRUPO_LABEL[grupo] ?? "e-mails"}
        </Link>
        {" · "}
        <Link href={`${BASE_URL}/configuracoes/emails`} style={linkStyle}>
          Gerenciar preferências
        </Link>
      </Text>
      <Text style={textStyle}>
        BelaPop · São Paulo, SP · Brasil
      </Text>
    </>
  );
}

/**
 * Gera a URL de unsubscribe assinada e retorna as props para Footer.
 * Chamar antes de renderizar o template.
 */
export async function criarFooterProps(params: FooterProps): Promise<FooterWithUrlProps> {
  const grupo = FLUXO_GRUPO[params.fluxo];
  const unsubscribe_url = await criarUnsubscribeToken(
    params.user_id,
    params.email,
    grupo
  );
  return {
    fluxo:              params.fluxo,
    grupo,
    unsubscribe_url,
    motivo_recebimento: params.motivo_recebimento,
  };
}
