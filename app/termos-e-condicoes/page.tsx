import type { Metadata } from "next";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import { belapopOperationalContacts, termsAndConditions } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Termos e Condições | BelaPop",
  description:
    "Regras de cadastro, seller, oferta, pagamento, antifraude, logística, devolução, propriedade intelectual e limitação de responsabilidade da BelaPop."
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPageLayout
      eyebrow="Institucional e contratual"
      title="Termos e Condições"
      intro={termsAndConditions.intro}
      updatedAt={termsAndConditions.updatedAt}
      tableOfContents={termsAndConditions.tableOfContents}
      aside={
        <>
          <InstitutionalIdentityCard />
          <OperationalPendingNotice />
        </>
      }
    >
      <LegalSection id="identificacao-escopo" title="Identificação e escopo">
        <p>
          Estes Termos regulam o uso do site, a navegação em páginas de produto, a colocação de
          pedidos, a aprovação de compra e o pós-venda operado pela BelaPop.
        </p>
        <p>
          Quando houver seller parceiro, essa informação aparece de forma clara antes da conclusão
          da compra. Na ausência dessa identificação expressa, a BelaPop conduz a venda e o
          atendimento do pedido.
        </p>
      </LegalSection>

      <LegalSection id="cadastro-elegibilidade" title="Cadastro e elegibilidade">
        <p>
          O cliente deve fornecer dados verdadeiros, completos e atualizados. A BelaPop pode pedir
          validação adicional quando identificar inconsistências cadastrais, risco de fraude ou
          necessidade de confirmação operacional.
        </p>
        <p>
          O uso do site com finalidade de fraude, abuso, revenda irregular, tentativa de burlar
          políticas ou descumprimento legal pode levar ao bloqueio de conta e ao cancelamento do
          pedido.
        </p>
      </LegalSection>

      <LegalSection id="seller-e-oferta" title="Seller, oferta e marcas exibidas">
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
            <span>A BelaPop é a vendedora direta, salvo indicação expressa em contrário.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
            <span>Marcas, fabricantes e linhas exibidas não se tornam automaticamente vendedoras.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
            <span>
              Seller parceiro só existe quando o front identificar isso de forma destacada antes
              da compra.
            </span>
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="preco-estoque-aprovacao" title="Preço, estoque e aprovação">
        <p>
          Preço, disponibilidade, prazo e composição do pedido dependem do momento da compra, do
          estoque e da aprovação do pagamento. A inclusão do item no carrinho não reserva
          automaticamente estoque; a disponibilidade final é confirmada no fechamento do pedido.
        </p>
        <p>
          O pedido só é considerado apto para processamento depois da confirmação do pagamento, da
          verificação antifraude e das confirmações cadastrais ou documentais que a operação exigir.
        </p>
      </LegalSection>

      <LegalSection id="pagamento-antifraude" title="Pagamento e antifraude">
        <p>
          Os meios de pagamento exibidos dependem da disponibilidade operacional do checkout e dos
          provedores integrados. A BelaPop pode submeter o pedido a ferramentas de score, análise
          documental, confirmação de identidade e outras validações antifraude.
        </p>
        <p>
          A BelaPop pode recusar, suspender ou cancelar uma transação quando houver indícios
          razoáveis de fraude, abuso, incongruência cadastral, tentativa de chargeback abusivo ou
          risco jurídico e operacional.
        </p>
      </LegalSection>

      <LegalSection id="logistica-entrega" title="Logística e entrega">
        <p>
          A entrega pode ser executada por operadores logísticos, transportadoras ou parceiros
          contratados, sem afastar as responsabilidades da BelaPop dentro dos limites legais
          aplicáveis.
        </p>
        <p>
          Prazos de entrega são estimativas contadas a partir da aprovação do pagamento e da
          liberação operacional. Eventos externos, restrições de endereço, ocorrências logísticas e
          auditorias de segurança podem afetar o prazo informado.
        </p>
      </LegalSection>

      <LegalSection id="reembolso-e-devolucao" title="Reembolso e devolução">
        <p>
          A BelaPop respeita o direito de arrependimento e as demais hipóteses legais aplicáveis ao
          consumidor. O fluxo de troca, devolução e estorno depende da natureza do caso, do estado
          do produto devolvido e do meio de pagamento utilizado.
        </p>
        <p>
          O reembolso pode observar os prazos e procedimentos da instituição financeira, do emissor
          do cartão ou do arranjo de pagamento. Em situações com suspeita de fraude ou abuso, a
          BelaPop pode exigir validações complementares antes da conclusão do estorno.
        </p>
      </LegalSection>

      <LegalSection id="propriedade-intelectual" title="Propriedade intelectual">
        <p>
          Marca, identidade visual, textos, layouts, software, seleção editorial e demais ativos do
          site pertencem à BelaPop ou aos respectivos titulares, quando licenciados. Nenhum uso
          comercial, cópia sistemática ou reprodução é permitido sem autorização.
        </p>
      </LegalSection>

      <LegalSection id="limitacao-responsabilidade" title="Limitação de responsabilidade">
        <p>
          A BelaPop não responde por uso inadequado dos produtos, por expectativas individuais de
          resultado, por indisponibilidades temporárias de terceiros fora de seu controle razoável
          ou por falhas decorrentes de dados incorretos fornecidos pelo cliente.
        </p>
        <p>
          Nenhuma página do site deve ser interpretada como promessa de resultado garantido,
          diagnóstico definitivo ou recomendação médica individualizada.
        </p>
      </LegalSection>

      <LegalSection id="atualizacoes-contato" title="Atualizações e contato">
        <p>
          Estes Termos podem ser atualizados para refletir mudanças de produto, operação,
          obrigações legais ou integrações técnicas. A versão mais recente fica disponível nesta
          página.
        </p>
        <p>
          O atendimento institucional da BelaPop está disponível em{" "}
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
