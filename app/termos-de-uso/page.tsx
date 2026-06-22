import type { Metadata } from "next";
import Link from "next/link";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import { belapopOperationalContacts, legalRoutes, termsAndConditions } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Termos de Uso | BelaPop",
  description:
    "Regras de uso do site, Círculo BelaPop, drops, checkout, pagamento, atendimento, segurança de cosméticos e pós-venda."
};

export default function TermsOfUsePage() {
  return (
    <LegalPageLayout
      eyebrow="INSTITUCIONAL E CONTRATUAL"
      title="Termos de Uso"
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
          Estes Termos regulam o uso do site, cadastro, navegação, Círculo BelaPop, drops, pedidos,
          pagamento, entrega e pós-venda operados pela BelaPop.
        </p>
        <p>
          A BelaPop atua como e-commerce e plataforma de curadoria de skincare. Quando houver seller,
          importador ou parceiro responsável por uma oferta, essa informação deve aparecer de forma
          clara antes da conclusão da compra.
        </p>
      </LegalSection>

      <LegalSection id="cadastro-elegibilidade" title="Cadastro e elegibilidade">
        <p>
          A cliente deve fornecer dados verdadeiros, completos e atualizados. A BelaPop pode pedir
          validações adicionais quando identificar inconsistência cadastral, risco de fraude,
          suspeita de abuso ou necessidade operacional.
        </p>
        <p>
          O site, o checkout e o Círculo BelaPop são direcionados a pessoas maiores de 18 anos. Se
          houver uso por menor de idade, será necessário consentimento de responsável legal e a
          BelaPop poderá remover ou bloquear o cadastro até a regularização.
        </p>
      </LegalSection>

      <LegalSection id="circulo-whatsapp" title="Círculo BelaPop e WhatsApp">
        <p>
          O Círculo BelaPop é um grupo fechado no WhatsApp para receber curadoria, avisos de drops e
          comunicações comerciais sobre skincare coreano. A entrada depende de consentimento para
          comunicações por WhatsApp e e-mail.
        </p>
        <ul className="space-y-3">
          <li>O número de telefone e o nome exibido no WhatsApp podem ficar visíveis para a BelaPop.</li>
          <li>Mensagens enviadas no grupo podem ser vistas pelos demais membros do grupo.</li>
          <li>A BelaPop pode remover membros que pratiquem assédio, spam, revenda irregular, divulgação não autorizada ou desrespeito às regras.</li>
          <li>A BelaPop não grava as conversas do grupo como rotina operacional.</li>
          <li>Sair do grupo não cancela automaticamente o cadastro; para cancelar comunicações, responda SAIR ou use o link de descadastro enviado por e-mail.</li>
        </ul>
      </LegalSection>

      <LegalSection id="drops" title="Drops e janela de compra">
        <p>
          Os drops do Círculo BelaPop são oportunidades de compra limitadas no tempo e no estoque.
          Como regra operacional, cada drop pode ter janela de compra de até 48 horas, salvo
          informação diferente exibida na oferta.
        </p>
        <p>
          A participação no Círculo não obriga compra em nenhum drop. O esgotamento de estoque,
          encerramento de prazo ou indisponibilidade de SKU não gera direito automático à reposição,
          reserva futura ou manutenção de preço.
        </p>
      </LegalSection>

      <LegalSection id="seller-e-oferta" title="Seller, oferta e marcas exibidas">
        <ul className="space-y-3">
          <li>A BelaPop é a vendedora direta, salvo indicação expressa de seller parceiro na jornada.</li>
          <li>Marcas, fabricantes e linhas exibidas não se tornam automaticamente vendedoras.</li>
          <li>Produtos importados devem informar, quando aplicável, o responsável pela importação, regularização e atendimento.</li>
          <li>As características essenciais do produto, preço, prazo, frete, encargos e forma de pagamento devem estar disponíveis antes da conclusão do pedido.</li>
        </ul>
      </LegalSection>

      <LegalSection id="preco-estoque-aprovacao" title="Preço, estoque e aprovação">
        <p>
          Preço, disponibilidade, prazo e composição do pedido dependem do momento da compra, estoque
          e aprovação do pagamento. A inclusão do item no carrinho não reserva estoque por prazo
          indefinido.
        </p>
        <p>
          O pedido só segue para processamento depois da confirmação do pagamento, validação
          antifraude e conferências cadastrais ou documentais necessárias.
        </p>
      </LegalSection>

      <LegalSection id="pagamento-antifraude" title="Pagamento e antifraude">
        <p>
          O checkout usa conexão segura SSL/TLS. Pagamentos podem ser processados pelo Stripe, que
          atua como processador de pagamento e mantém certificações e controles próprios, incluindo
          PCI-DSS para o ambiente de pagamento.
        </p>
        <p>
          A BelaPop não armazena dados completos de cartão. A transação pode passar por validação
          antifraude, score de risco, confirmação de identidade e revisão operacional. Pedidos com
          indícios razoáveis de fraude, abuso ou inconsistência podem ser recusados ou cancelados.
        </p>
      </LegalSection>

      <LegalSection id="logistica-entrega" title="Logística e entrega">
        <p>
          A entrega pode ser realizada por transportadoras, operadores logísticos, Correios,
          fulfillment ou seller parceiro, conforme a oferta e o checkout. O prazo informado é
          estimado a partir da aprovação do pagamento e liberação operacional.
        </p>
        <p>
          Eventos externos, restrição de endereço, auditoria antifraude, indisponibilidade
          logística ou força maior podem afetar o prazo. A cliente será orientada pelo atendimento
          quando houver ocorrência relevante.
        </p>
      </LegalSection>

      <LegalSection id="cosmeticos-seguranca" title="Uso de cosméticos e patch test">
        <p>
          Informações de skincare no site não substituem consulta médica, diagnóstico dermatológico
          ou prescrição profissional. Pessoas com alergias, pele sensibilizada, gestantes, lactantes
          ou em tratamento dermatológico devem consultar profissional de saúde antes do uso.
        </p>
        <p>
          Antes de usar um cosmético novo, recomenda-se fazer patch test em pequena área da pele e
          suspender o uso em caso de ardor intenso, coceira, vermelhidão persistente, inchaço ou
          qualquer reação inesperada.
        </p>
      </LegalSection>

      <LegalSection id="reembolso-e-devolucao" title="Reembolso e devolução">
        <p>
          A BelaPop respeita o direito de arrependimento de 7 dias corridos em compras online,
          contado do recebimento do produto, e as regras de vício/defeito previstas no Código de
          Defesa do Consumidor.
        </p>
        <p>
          O procedimento completo está na{" "}
          <Link
            href={legalRoutes.returns}
            className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4"
          >
            Política de Trocas e Devoluções
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="propriedade-intelectual" title="Propriedade intelectual">
        <p>
          Marca, identidade visual, textos, seleção editorial, imagens, layout, software e demais
          ativos pertencem à BelaPop ou aos respectivos titulares licenciantes. Cópia, uso comercial
          ou reprodução sistemática sem autorização não é permitido.
        </p>
      </LegalSection>

      <LegalSection id="limitacao-responsabilidade" title="Limitação de responsabilidade">
        <p>
          A BelaPop não responde por uso inadequado dos produtos, dados incorretos fornecidos pela
          cliente, expectativas individuais de resultado, indisponibilidade temporária de terceiros
          fora de seu controle razoável ou interrupções necessárias para segurança e manutenção.
        </p>
      </LegalSection>

      <LegalSection id="atualizacoes-contato" title="Atualizações e contato">
        <p>
          Estes Termos podem ser atualizados para refletir mudanças de operação, tecnologia,
          legislação, atendimento ou canais do Círculo. A versão vigente é identificada pela data de
          atualização desta página.
        </p>
        <p>
          Atendimento:{" "}
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
