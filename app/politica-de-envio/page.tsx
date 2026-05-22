import type { Metadata } from "next";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import {
  belapopOperationalContacts,
  shippingPolicy
} from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Envio e Frete | BelaPop",
  description:
    "Política de envio, frete, rastreamento, sellers parceiros e atendimento logístico da BelaPop."
};

export default function ShippingPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Logística e marketplace"
      title="Envio e Frete"
      intro={shippingPolicy.intro}
      updatedAt={shippingPolicy.updatedAt}
      tableOfContents={shippingPolicy.tableOfContents}
      aside={
        <>
          <InstitutionalIdentityCard />
          <OperationalPendingNotice />
        </>
      }
    >
      <LegalSection id="calculo-frete" title="Cálculo de frete">
        <p>
          O frete pode variar conforme produtos escolhidos, origem do seller, CEP de entrega,
          transportadora, modalidade disponível, peso, dimensões e campanhas vigentes.
        </p>
        <p>
          O valor apresentado no checkout deve refletir a composição do pedido antes da confirmação
          da compra. Alterações no carrinho, endereço ou disponibilidade podem recalcular o frete.
        </p>
      </LegalSection>

      <LegalSection id="prazo-entrega" title="Prazo de entrega">
        <p>
          O prazo estimado considera aprovação do pagamento, preparação do pedido e operação da
          transportadora. Eventos externos, restrições regionais ou conferências de segurança podem
          alterar a previsão apresentada.
        </p>
        <p>
          A BelaPop evita promessas absolutas de entrega e informa o cliente quando houver
          ocorrência relevante no fluxo logístico.
        </p>
      </LegalSection>

      <LegalSection id="sellers" title="Produtos de sellers parceiros">
        <p>
          Pedidos com sellers parceiros podem ter origens diferentes, prazos específicos e, quando
          necessário, remessas separadas. A participação do seller deve ficar clara na oferta e no
          resumo da compra.
        </p>
        <p>
          A BelaPop faz curadoria premium e acompanha o atendimento para manter consistência entre
          produto, seller, envio e pós-venda.
        </p>
      </LegalSection>

      <LegalSection id="rastreamento" title="Rastreamento e ocorrências">
        <p>
          Quando a remessa tiver rastreamento, o código ou link de acompanhamento será comunicado
          ao cliente pelos canais da compra ou pelo suporte.
        </p>
        <p>
          Ocorrências de entrega, ausência do destinatário, endereço incompleto, extravio ou avaria
          devem ser tratadas pelo atendimento para registro e direcionamento adequado.
        </p>
      </LegalSection>

      <LegalSection id="atendimento" title="Atendimento logístico">
        <p>
          Para dúvidas sobre frete, rastreio, entrega ou ocorrências, fale com a BelaPop pelo e-mail{" "}
          <a
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href={`mailto:${belapopOperationalContacts.institutionalEmail}`}
          >
            {belapopOperationalContacts.institutionalEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
