import type { Metadata } from "next";
import Link from "next/link";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { belapopOperationalContacts, shippingPolicy } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Envio e Frete | BelaPop",
  description:
    "Política de envio, frete, rastreamento, sellers parceiros e atendimento logístico da BelaPop."
};

export default function EnvioFretePage() {
  return (
    <LegalPageLayout
      eyebrow="LOGÍSTICA E ENTREGA"
      title="Envio e Frete"
      intro={shippingPolicy.intro}
      updatedAt={shippingPolicy.updatedAt}
      tableOfContents={shippingPolicy.tableOfContents}
      aside={<InstitutionalIdentityCard />}
    >
      <LegalSection id="calculo-frete" title="Cálculo de frete">
        <p>
          O frete pode variar conforme produtos escolhidos, origem do seller, CEP de entrega,
          transportadora, modalidade disponível, peso, dimensões e campanhas vigentes.
        </p>
        <p>
          O valor apresentado no checkout deve refletir a composição do pedido antes da confirmação
          da compra. Alterações no carrinho, endereço ou disponibilidade podem recalcular o frete.
          Frete grátis para compras acima de R$ 350, exceto em casos de seller parceiro com
          política específica informada antes da compra.
        </p>
      </LegalSection>

      <LegalSection id="prazo-entrega" title="Prazo de entrega">
        <p>
          O prazo estimado considera aprovação do pagamento, preparação do pedido (até 48h úteis)
          e operação da transportadora. Estimativas por modalidade após postagem:
        </p>
        <ul className="space-y-1">
          <li><strong>Capitais:</strong> 3–7 dias úteis.</li>
          <li><strong>Interior:</strong> 5–15 dias úteis.</li>
        </ul>
        <p>
          Eventos externos, restrições regionais, feriados ou conferências de segurança podem
          alterar a previsão. A BelaPop informa a cliente quando houver ocorrência relevante no
          fluxo logístico.
        </p>
      </LegalSection>

      <LegalSection id="sellers" title="Produtos de sellers parceiros">
        <p>
          Pedidos com sellers parceiros podem ter origens diferentes, prazos específicos e, quando
          necessário, remessas separadas. A participação do seller ficará clara na oferta e no
          resumo da compra antes da finalização.
        </p>
        <p>
          A BelaPop faz curadoria premium e acompanha o atendimento para manter consistência entre
          produto, seller, envio e pós-venda.
        </p>
      </LegalSection>

      <LegalSection id="rastreamento" title="Rastreamento e ocorrências">
        <p>
          Quando a remessa tiver rastreamento, o código ou link de acompanhamento será comunicado
          ao cliente pelos canais da compra ou pelo suporte assim que a postagem for confirmada.
        </p>
        <p>
          Ocorrências de entrega, ausência do destinatário, endereço incompleto, extravio ou avaria
          devem ser tratadas pelo atendimento para registro e direcionamento adequado.{" "}
          <Link
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href="/politica-de-trocas-e-devolucoes"
          >
            Veja a Política de Trocas e Devoluções
          </Link>{" "}
          para procedimentos em caso de avaria ou não entrega.
        </p>
      </LegalSection>

      <LegalSection id="atendimento" title="Atendimento logístico">
        <p>
          Para dúvidas sobre frete, rastreio, entrega ou ocorrências, fale com a BelaPop pelo
          e-mail{" "}
          <a
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href={`mailto:${belapopOperationalContacts.institutionalEmail}`}
          >
            {belapopOperationalContacts.institutionalEmail}
          </a>{" "}
          ou pelo canal de atendimento disponível no site.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
