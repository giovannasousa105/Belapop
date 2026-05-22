import type { Metadata } from "next";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import {
  belapopOperationalContacts,
  returnsPolicy
} from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Trocas e Devoluções | BelaPop",
  description:
    "Política de trocas, devoluções, arrependimento, avarias e reembolso para pedidos BelaPop e marketplace."
};

export default function ReturnsPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Pós-venda e atendimento"
      title="Trocas e Devoluções"
      intro={returnsPolicy.intro}
      updatedAt={returnsPolicy.updatedAt}
      tableOfContents={returnsPolicy.tableOfContents}
      aside={
        <>
          <InstitutionalIdentityCard />
          <OperationalPendingNotice />
        </>
      }
    >
      <LegalSection id="arrependimento" title="Arrependimento e devolução">
        <p>
          O consumidor pode solicitar devolução por arrependimento dentro do prazo legal de 7 dias
          corridos, contados do recebimento do produto, conforme o Código de Defesa do Consumidor.
        </p>
        <p>
          Para preservar a análise do pedido, o item deve retornar com integridade, acessórios,
          embalagem e documentos que acompanhem o produto, quando aplicável.
        </p>
      </LegalSection>

      <LegalSection id="avaria-divergencia" title="Avaria, divergência ou item incorreto">
        <p>
          Em caso de embalagem violada, item divergente, produto danificado ou quantidade incorreta,
          o cliente deve acionar o atendimento com número do pedido, descrição objetiva e registros
          do recebimento quando disponíveis.
        </p>
        <p>
          A BelaPop analisa o histórico da compra, os dados logísticos e as evidências enviadas para
          orientar troca, devolução, complemento de envio ou reembolso, conforme o caso.
        </p>
      </LegalSection>

      <LegalSection id="marketplace" title="Pedidos com sellers parceiros">
        <p>
          Quando o pedido envolver seller parceiro, a BelaPop coordena o atendimento ao cliente e
          pode solicitar ao seller informações de procedência, separação, embalagem, coleta ou
          conferência do item.
        </p>
        <p>
          A identificação do seller deve aparecer na jornada de compra sempre que ele participar da
          oferta, mantendo transparência sobre origem, envio e responsabilidade operacional.
        </p>
      </LegalSection>

      <LegalSection id="analise-reembolso" title="Análise e reembolso">
        <p>
          O reembolso é processado após a validação da solicitação e, quando necessário, após o
          recebimento ou conferência do produto devolvido.
        </p>
        <p>
          O prazo de crédito pode variar conforme o meio de pagamento, a instituição financeira, o
          emissor do cartão e as regras aplicáveis ao arranjo de pagamento.
        </p>
      </LegalSection>

      <LegalSection id="como-solicitar" title="Como solicitar atendimento">
        <p>
          Solicite atendimento pelo e-mail institucional{" "}
          <a
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href={`mailto:${belapopOperationalContacts.institutionalEmail}`}
          >
            {belapopOperationalContacts.institutionalEmail}
          </a>
          , informando número do pedido, CPF ou e-mail da compra e motivo da solicitação.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
