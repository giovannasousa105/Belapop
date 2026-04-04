import type { Metadata } from "next";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import { termsAndConditions } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Termos e Condicoes | BelaPop",
  description:
    "Regras de cadastro, seller, oferta, pagamento, antifraude, logistica, devolucao, propriedade intelectual e limitacao de responsabilidade da BelaPop."
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPageLayout
      eyebrow="Institucional e contratual"
      title="Termos e Condicoes"
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
      <LegalSection id="identificacao-escopo" title="Identificacao e escopo">
        <p>
          Estes Termos regulam o uso do site, a navegacao em paginas de produto, a colocacao de
          pedidos, a aprovacao de compra e o pos-venda operado pela BelaPop.
        </p>
        <p>
          Quando houver seller parceiro, essa informacao precisa aparecer de forma clara antes da
          conclusao da compra. Na ausencia dessa identificacao expressa, a BelaPop e a vendedora
          direta.
        </p>
      </LegalSection>

      <LegalSection id="cadastro-elegibilidade" title="Cadastro e elegibilidade">
        <p>
          O cliente deve fornecer dados verdadeiros, completos e atualizados. A BelaPop pode pedir
          validacao adicional quando identificar inconsistencias cadastrais, risco de fraude ou
          necessidade de confirmacao operacional.
        </p>
        <p>
          O uso do site com finalidade de fraude, abuso, revenda irregular, tentativa de burlar
          politicas ou descumprimento legal pode levar ao bloqueio de conta e ao cancelamento do
          pedido.
        </p>
      </LegalSection>

      <LegalSection id="seller-e-oferta" title="Seller, oferta e marcas exibidas">
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
            <span>A BelaPop e a vendedora direta, salvo indicacao expressa em contrario.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
            <span>Marcas, fabricantes e linhas exibidas nao se tornam automaticamente vendedoras.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
            <span>
              Seller parceiro so existe quando o front identificar isso de forma destacada antes
              da compra.
            </span>
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="preco-estoque-aprovacao" title="Preco, estoque e aprovacao">
        <p>
          Preco, disponibilidade, prazo e composicao do pedido dependem do momento da compra, do
          estoque, da aprovacao do pagamento e da validacao operacional. A inclusao do item no
          carrinho nao reserva automaticamente estoque.
        </p>
        <p>
          O pedido so e considerado apto para processamento depois da confirmacao do pagamento, da
          verificacao antifraude e das validacoes cadastrais ou documentais que a operacao exigir.
        </p>
      </LegalSection>

      <LegalSection id="pagamento-antifraude" title="Pagamento e antifraude">
        <p>
          Os meios de pagamento exibidos dependem da disponibilidade operacional do checkout e dos
          provedores integrados. A BelaPop pode submeter o pedido a ferramentas de score, analise
          documental, confirmacao de identidade e outras validacoes antifraude.
        </p>
        <p>
          A BelaPop pode recusar, suspender ou cancelar uma transacao quando houver indicios
          razoaveis de fraude, abuso, incongruencia cadastral, tentativa de chargeback abusivo ou
          risco juridico e operacional.
        </p>
      </LegalSection>

      <LegalSection id="logistica-entrega" title="Logistica e entrega">
        <p>
          A entrega pode ser executada por operadores logísticos, transportadoras ou parceiros
          contratados, sem afastar as responsabilidades da BelaPop dentro dos limites legais
          aplicáveis.
        </p>
        <p>
          Prazos de entrega sao estimativas contadas a partir da aprovacao do pagamento e da
          liberacao operacional. Eventos externos, restricoes de endereco, ocorrencias logísticas e
          auditorias de seguranca podem afetar o prazo informado.
        </p>
      </LegalSection>

      <LegalSection id="reembolso-e-devolucao" title="Reembolso e devolucao">
        <p>
          A BelaPop respeita o direito de arrependimento e as demais hipoteses legais aplicaveis ao
          consumidor. O fluxo de troca, devolucao e estorno depende da natureza do caso, do estado
          do produto devolvido e do meio de pagamento utilizado.
        </p>
        <p>
          O reembolso pode observar os prazos e procedimentos da instituicao financeira, do emissor
          do cartao ou do arranjo de pagamento. Em situacoes com suspeita de fraude ou abuso, a
          BelaPop pode exigir validacoes complementares antes da conclusao do estorno.
        </p>
      </LegalSection>

      <LegalSection id="propriedade-intelectual" title="Propriedade intelectual">
        <p>
          Marca, identidade visual, textos, layouts, software, selecao editorial e demais ativos do
          site pertencem a BelaPop ou aos respectivos titulares, quando licenciados. Nenhum uso
          comercial, copia sistematica ou reproducao e permitido sem autorizacao.
        </p>
      </LegalSection>

      <LegalSection id="limitacao-responsabilidade" title="Limitacao de responsabilidade">
        <p>
          A BelaPop nao responde por uso inadequado dos produtos, por expectativas individuais de
          resultado, por indisponibilidades temporarias de terceiros fora de seu controle razoavel
          ou por falhas decorrentes de dados incorretos fornecidos pelo cliente.
        </p>
        <p>
          Nenhuma pagina do site deve ser interpretada como promessa de resultado garantido,
          diagnostico definitivo ou recomendacao medica individualizada.
        </p>
      </LegalSection>

      <LegalSection id="atualizacoes-contato" title="Atualizacoes e contato">
        <p>
          Estes Termos podem ser atualizados para refletir mudancas de produto, operacao,
          obrigacoes legais ou integracoes tecnicas. A versao mais recente fica disponivel nesta
          pagina.
        </p>
        <p>
          Os contatos institucionais definitivos ainda dependem de validacao operacional formal pela
          BelaPop.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
