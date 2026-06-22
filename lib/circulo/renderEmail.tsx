import React from "react";
import { render } from "@react-email/render";

import CirculoBoasVindas from "@/emails/templates/CirculoBoasVindas";

export async function renderCirculoBoasVindas(props: {
  nome: string;
  skin_concern_label: string;
  unsubscribe_url?: string;
  subgroup_url?: string | null;
  subgroup_label?: string;
}): Promise<string> {
  return render(
    <CirculoBoasVindas
      nome={props.nome}
      skin_concern_label={props.skin_concern_label}
      unsubscribe_url={props.unsubscribe_url}
      subgroup_url={props.subgroup_url}
      subgroup_label={props.subgroup_label}
    />
  );
}
