import type { Metadata } from "next";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import { belapopOperationalContacts, returnsPolicy } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Política de Trocas e Devoluções | BelaPop",
  description:
    "Direito de arrependimento em 7 dias, garantia legal de cosméticos, reações adversas, avarias, divergências e reembolso."
};

export default function ReturnsPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="PÓS-VENDA E ATENDIMENTO"
      title="Política de Trocas e Devoluções"
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
      <LegalSection id="arrependimento" title="Arrependimento em 7 dias">
        <p>
          Em compras feitas pela internet, a cliente pode desistir da compra em até 7 dias corridos,
          contados do recebimento do produto, sem precisar justificar o motivo.
        </p>
        <p>
          A solicitação deve ser feita pelo e-mail{" "}
          <a
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href={`mailto:${belapopOperationalContacts.institutionalEmail}`}
          >
            {belapopOperationalContacts.institutionalEmail}
          </a>{" "}
          ou pelo WhatsApp/atendimento informado no site, com número do pedido, CPF ou e-mail da
          compra e fotos do produto recebido.
        </p>
        <p>
          Dentro do prazo de arrependimento, a BelaPop orientará a logística reversa sem custo para
          a cliente e solicitará o estorno em até 7 dias corridos após a aprovação da solicitação ou,
          quando necessário, após o recebimento e conferência do produto devolvido. O crédito pode
          aparecer depois, conforme prazo do emissor do cartão, banco ou arranjo de pagamento.
        </p>
        <p>
          Por segurança e higiene, produtos usados, violados, contaminados, sem lacre quando o lacre
          for essencial à proteção do item, personalizados ou devolvidos em condição incompatível com
          a revenda podem exigir análise individual e podem não ser aceitos como arrependimento puro.
        </p>
      </LegalSection>

      <LegalSection id="drops-circulo" title="Arrependimento em drops e Círculo BelaPop">
        <p>
          Compras realizadas durante drops do Círculo BelaPop seguem as mesmas regras do Código de
          Defesa do Consumidor: direito de arrependimento em até 7 dias corridos do recebimento do
          produto, independentemente de o drop já ter encerrado ou de o item ter esgotado.
        </p>
        <p>
          Como os drops têm quantidade limitada e sem reposição, o produto devolvido não é
          recolocado à venda na mesma edição. Isso não elimina o direito de arrependimento, mas
          significa que não há troca por outro exemplar do mesmo drop — apenas reembolso integral
          pelo meio de pagamento original.
        </p>
        <p>
          Para arrependimento de compras feitas exclusivamente por acesso antecipado do Círculo,
          aplica-se o mesmo prazo de 7 dias, contado do recebimento físico do produto.
        </p>
      </LegalSection>

      <LegalSection id="troca-garantia" title="Troca, vício e garantia legal">
        <p>
          A troca por preferência da cliente é diferente do direito de arrependimento e pode seguir
          regras comerciais próprias. Já vício, defeito, produto impróprio, divergente ou com
          problema de qualidade segue a garantia legal do Código de Defesa do Consumidor.
        </p>
        <p>
          Cosméticos são classificados como produtos não duráveis pela legislação brasileira.
          A reclamação por vício aparente deve ser feita em até 30 dias do recebimento. Em caso de
          vício oculto, o prazo começa quando o problema se torna evidente. Para produtos regulados
          pela ANVISA, como cosméticos e produtos de higiene pessoal, eventuais não conformidades
          podem ser objeto de notificação ao órgão regulador competente.
        </p>
        <p>
          A solução pode incluir troca, reenvio, abatimento proporcional, reembolso ou orientação do
          fabricante/importador, conforme a natureza do problema e a legislação aplicável.
        </p>
      </LegalSection>

      <LegalSection id="reacao-adversa" title="Reação adversa e segurança">
        <p>
          Em caso de ardor intenso, coceira, vermelhidão persistente, inchaço, descamação anormal ou
          qualquer reação inesperada, suspenda o uso imediatamente, lave a área com água e procure
          orientação médica se necessário.
        </p>
        <p>
          Para análise, envie número do pedido, fotos do produto, lote, validade, modo de uso,
          momento da reação e registros da pele, se desejar. A BelaPop pode solicitar informações ao
          seller, fabricante ou importador responsável para definir troca, ressarcimento ou
          orientação complementar.
        </p>
        <p>
          A recomendação preventiva é realizar patch test antes do primeiro uso, especialmente em
          pele sensível, histórico de alergias, gestação, lactação ou tratamento dermatológico.
        </p>
      </LegalSection>

      <LegalSection id="avaria-divergencia" title="Avaria, divergência ou item incorreto">
        <p>
          Se a embalagem estiver violada, houver item incorreto, vazamento, quantidade divergente ou
          dano no transporte, acione o atendimento assim que identificar o problema.
        </p>
        <p>
          Informe número do pedido, descrição objetiva e fotos da embalagem externa, etiqueta de
          transporte, item recebido e eventual avaria. Esses registros ajudam a BelaPop a tratar a
          ocorrência com transportadora, fulfillment, seller ou importador.
        </p>
      </LegalSection>

      <LegalSection id="atraso-entrega" title="Atraso ou não entrega do produto">
        <p>
          Se o prazo informado no pedido for ultrapassado sem atualização de rastreio ou entrega, a
          cliente deve acionar o atendimento com o número do pedido para verificação junto à
          transportadora ou seller responsável.
        </p>
        <p>
          Em caso de extravio confirmado, produto não entregue por falha de logística ou retenção
          injustificada, a BelaPop buscará reenvio ou reembolso integral conforme a natureza do
          caso. Situações de ausência do destinatário, endereço incompleto ou recusa de entrega
          podem demandar reagendamento e são de responsabilidade compartilhada.
        </p>
      </LegalSection>

      <LegalSection id="marketplace" title="Pedidos com sellers parceiros">
        <p>
          Quando houver seller parceiro, a BelaPop coordena o atendimento e pode solicitar ao seller
          dados de origem, separação, embalagem, lote, validade, importador e documentação do item.
        </p>
        <p>
          Produtos importados devem permitir identificação do importador ou responsável pela
          regularização e atendimento, conforme a informação disponível na oferta, embalagem, nota
          fiscal ou documentação do produto.
        </p>
      </LegalSection>

      <LegalSection id="analise-reembolso" title="Análise e reembolso">
        <p>
          A BelaPop registra protocolo de atendimento para cada demanda e busca responder em até 5
          dias úteis. Casos urgentes de segurança, reação adversa ou pagamento podem receber
          prioridade.
        </p>
        <p>
          O reembolso é processado pelo meio de pagamento original sempre que possível. Os prazos
          estimados após aprovação da solicitação são:
        </p>
        <ul className="space-y-1">
          <li><strong>PIX e boleto bancário:</strong> até 7 dias úteis.</li>
          <li><strong>Cartão de crédito:</strong> até 2 faturas subsequentes, conforme prazo da operadora e do banco emissor.</li>
          <li><strong>Cartão de débito:</strong> até 10 dias úteis, conforme a instituição financeira.</li>
        </ul>
        <p>
          Esses prazos são estimados e podem variar conforme o arranjo de pagamento, a instituição
          financeira e o calendário bancário. A BelaPop não controla os prazos internos das
          operadoras e bancos após o estorno ser solicitado.
        </p>
      </LegalSection>

      <LegalSection id="como-solicitar" title="Como solicitar atendimento">
        <p>
          Solicite atendimento pelo e-mail{" "}
          <a
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href={`mailto:${belapopOperationalContacts.institutionalEmail}`}
          >
            {belapopOperationalContacts.institutionalEmail}
          </a>
          , pelo WhatsApp informado no site ou pela área de pedidos quando disponível.
        </p>
        <p>
          Se a solução não for satisfatória, a cliente pode buscar o PROCON local (em Minas Gerais,
          o PROCON-MG pode ser acessado via{" "}
          <a
            href="https://procon.mg.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
          >
            procon.mg.gov.br
          </a>
          ). Quando a BelaPop estiver obrigada ou cadastrada na plataforma, também poderá ser usado
          o canal{" "}
          <a
            href="https://www.consumidor.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
          >
            consumidor.gov.br
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
