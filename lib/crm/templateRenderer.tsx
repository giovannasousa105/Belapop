import React from "react";
import { render } from "@react-email/render";

type TemplateModule = { default: React.ComponentType<Record<string, unknown>> };

const LOADERS: Record<string, () => Promise<TemplateModule>> = {
  PedidoConfirmado:      () => import("@/emails/templates/PedidoConfirmado"),
  PedidoEnviado:         () => import("@/emails/templates/PedidoEnviado"),
  ScanResultado:         () => import("@/emails/templates/ScanResultado"),
  PopClubBoasVindas:     () => import("@/emails/templates/PopClubBoasVindas"),
  PopClubPromocaoTier:   () => import("@/emails/templates/PopClubPromocaoTier"),
  CarrinhoAbandonado:    () => import("@/emails/templates/CarrinhoAbandonado"),
  WishlistEsgotando:     () => import("@/emails/templates/WishlistEsgotando"),
  TierRiscoRebaixamento: () => import("@/emails/templates/TierRiscoRebaixamento"),
  Reativacao:            () => import("@/emails/templates/Reativacao"),
  CheckinSemanal:        () => import("@/emails/templates/CheckinSemanal"),
  ProgressoTwinMensal:   () => import("@/emails/templates/ProgressoTwinMensal"),
  AlertaRegressao:       () => import("@/emails/templates/AlertaRegressao"),
  LembreteScan:          () => import("@/emails/templates/LembreteScan"),
  CuradoriaSemanal:      () => import("@/emails/templates/CuradoriaSemanal"),
  WaitlistProduto:       () => import("@/emails/templates/WaitlistProduto"),
  LoteEsgotando:         () => import("@/emails/templates/LoteEsgotando"),
  RecompraAssistida:     () => import("@/emails/templates/RecompraAssistida"),
};

export async function renderizarTemplate(
  template_id: string,
  metadata: Record<string, unknown>
): Promise<string> {
  const loader = LOADERS[template_id];
  if (!loader) throw new Error(`Template desconhecido: ${template_id}`);
  const mod = await loader();
  const Component = mod.default;
  return await render(React.createElement(Component, metadata));
}
