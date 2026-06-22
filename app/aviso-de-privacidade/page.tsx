import type { Metadata } from "next";
import Link from "next/link";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import { belapopOperationalContacts, legalRoutes, privacyNotice } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Aviso de Privacidade | BelaPop",
  description:
    "Como a BelaPop trata dados pessoais, dados de pele, WhatsApp, cookies, Stripe, retenção, direitos LGPD e incidentes de segurança."
};

export default function PrivacyNoticePage() {
  return (
    <LegalPageLayout
      eyebrow="PRIVACIDADE E LGPD"
      title="Aviso de Privacidade"
      intro={privacyNotice.intro}
      updatedAt={privacyNotice.updatedAt}
      tableOfContents={privacyNotice.tableOfContents}
      aside={
        <>
          <InstitutionalIdentityCard />
          <OperationalPendingNotice />
        </>
      }
    >
      <LegalSection id="controladora" title="Controladora, DPO e contato">
        <p>
          A BelaPop atua como controladora dos dados pessoais tratados no site, no checkout, no
          Círculo BelaPop, no WhatsApp, no atendimento e nas experiências de skincare.
        </p>
        <p>
          O canal do encarregado/responsável por privacidade é{" "}
          <a
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href={`mailto:${belapopOperationalContacts.privacyChannel}`}
          >
            {belapopOperationalContacts.privacyChannel}
          </a>
          . Use esse canal para exercer direitos LGPD, tirar dúvidas sobre este aviso ou comunicar
          suspeita de incidente envolvendo dados pessoais.
        </p>
      </LegalSection>

      <LegalSection id="dados-tratados" title="Dados tratados">
        <ul className="space-y-3">
          {privacyNotice.dataTypes.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="dados-pele" title="Dados de pele e saúde">
        <p>
          A BelaPop coleta informações como tipo de pele, principal preocupação de skincare, foco de
          cuidado, preferências dermatológicas e, quando a cliente usa o Skin Scan, imagem enviada
          para leitura visual. Esses dados podem revelar ou sugerir informação de saúde.
        </p>
        <p>
          Por isso, quando esses dados estiverem associados a uma pessoa identificada ou
          identificável, a BelaPop os trata como dados pessoais sensíveis, com governança reforçada.
          A base legal usada para funcionalidades de pele é o consentimento específico e destacado
          da titular.
        </p>
        <p>
          O consentimento para dados de pele é separado do consentimento de marketing. No formulário
          do Círculo, há um checkbox próprio apenas para autorizar o uso da preocupação de pele e
          preferência de skincare na curadoria dos drops.
        </p>
      </LegalSection>

      <LegalSection id="finalidades-bases-legais" title="Finalidades e bases legais">
        <div className="grid gap-4 lg:grid-cols-2">
          {privacyNotice.purposes.map((item) => (
            <article
              key={item.title}
              className="rounded-[24px] border border-[#ebe1e2] bg-[#fcf7f7] p-5"
            >
              <h3 className="text-base font-semibold text-[#1c1b1b]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5b5051]">
                <span className="font-semibold text-[#1c1b1b]">Base legal:</span>{" "}
                {item.legalBasis}
              </p>
            </article>
          ))}
        </div>
        <p>
          Para dados sensíveis de pele, a base legal é consentimento específico e destacado. Para
          pagamentos, entrega, emissão fiscal e pós-venda, a base pode ser execução de contrato,
          cumprimento de obrigação legal, exercício regular de direitos ou legítimo interesse,
          conforme a finalidade.
        </p>
      </LegalSection>

      <LegalSection id="circulo-whatsapp" title="Círculo BelaPop e WhatsApp">
        <p>
          Ao se inscrever no Círculo BelaPop, a cliente informa nome, e-mail, WhatsApp, principal
          preocupação de pele e faixa de investimento. Esses dados são usados para confirmar a
          inscrição, enviar comunicações do Círculo e personalizar curadoria de drops.
        </p>
        <ul className="space-y-3">
          <li>O número e o nome exibido no WhatsApp podem ser acessados pela BelaPop.</li>
          <li>Mensagens enviadas dentro do grupo são visíveis aos demais membros.</li>
          <li>A BelaPop não grava as conversas do grupo como prática operacional.</li>
          <li>Comunicações comerciais do Círculo podem ocorrer por e-mail e WhatsApp, em regra até 2 mensagens por semana, além de mensagens transacionais necessárias.</li>
          <li>Para cancelar, responda SAIR, use o link de descadastro no e-mail ou escreva para o canal de atendimento.</li>
          <li>Sair manualmente do grupo não elimina automaticamente o cadastro; o cancelamento expresso é necessário para interromper comunicações futuras.</li>
        </ul>
      </LegalSection>

      <LegalSection id="compartilhamento" title="Compartilhamento">
        <p>
          A BelaPop compartilha dados apenas quando necessário para operar a plataforma, cumprir
          obrigações legais, proteger direitos, prevenir fraude ou executar o pedido.
        </p>
        <ul className="space-y-3">
          {privacyNotice.sharing.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="transferencia-internacional" title="Transferência internacional">
        <p>
          Alguns fornecedores globais podem tratar dados fora do Brasil. No pagamento, o Stripe pode
          transferir ou acessar dados em outros países, especialmente Estados Unidos, conforme sua
          infraestrutura e contratos.
        </p>
        <p>
          A transferência internacional pode ocorrer quando necessária para executar o contrato de
          compra, processar pagamento, prevenir fraude ou cumprir obrigações legais. A BelaPop busca
          trabalhar com fornecedores que adotem contratos de tratamento de dados, medidas de
          segurança e cláusulas compatíveis com a LGPD. O Stripe disponibiliza DPA/termos de
          tratamento de dados para seus serviços.
        </p>
      </LegalSection>

      <LegalSection id="cookies-rastreamento" title="Cookies e rastreamento">
        <p>
          A BelaPop usa cookies essenciais para sessão, segurança, autenticação e prevenção de
          fraude. Cookies de desempenho, analytics, funcionalidade e publicidade dependem da escolha
          feita no banner de cookies, exceto quando estritamente necessários.
        </p>
        <p>
          A base de código prevê uso de Vercel Analytics, Vercel Speed Insights, PostHog, Google
          Analytics, Meta Pixel e TikTok Pixel quando configurados. Hotjar não está configurado no
          código atual; se for ativado, esta política deve ser atualizada.
        </p>
        <p>
          A cliente pode aceitar todos, recusar não essenciais ou personalizar categorias no banner
          da primeira visita. Depois, pode revisar a escolha pelo link{" "}
          <Link
            href={legalRoutes.cookies}
            className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4"
          >
            Política de Cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="retencao" title="Prazos de retenção">
        <p>{privacyNotice.retention}</p>
        <ul className="space-y-3">
          <li>Dados fiscais, cobrança, pagamento e transações: até 5 anos, conforme obrigações tributárias e defesa de direitos.</li>
          <li>Dados de consumidor, atendimento, pedidos, trocas e devoluções: até 5 anos para reclamações e pretensões de consumo.</li>
          <li>Logs de acesso: 6 meses, conforme Marco Civil da Internet; podem ser preservados por mais tempo mediante ordem judicial ou necessidade de investigação legítima.</li>
          <li>Marketing, newsletter, WhatsApp e Círculo: até revogação do consentimento ou descadastro.</li>
          <li>Dados de pele: pelo tempo necessário para curadoria, análise e histórico solicitado pela cliente; podem ser eliminados, bloqueados ou anonimizados quando cabível.</li>
        </ul>
      </LegalSection>

      <LegalSection id="menores" title="Menores de idade">
        <p>
          A BelaPop não direciona o Círculo, checkout ou Skin Scan a menores de 18 anos. O cadastro
          deve exigir declaração de maioridade. Se a BelaPop identificar dados de menor tratados sem
          autorização adequada, poderá bloquear o cadastro, remover a inscrição e eliminar os dados
          quando cabível.
        </p>
        <p>
          Dados de criança ou adolescente só devem ser tratados com consentimento específico de
          responsável legal e no melhor interesse do menor.
        </p>
      </LegalSection>

      <LegalSection id="direitos" title="Direitos do titular">
        <p>
          O titular pode exercer os direitos previstos na LGPD pelo canal{" "}
          <a
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href={`mailto:${belapopOperationalContacts.privacyChannel}`}
          >
            {belapopOperationalContacts.privacyChannel}
          </a>
          .
        </p>
        <ul className="space-y-3">
          {privacyNotice.rights.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="seguranca" title="Segurança, antifraude e incidentes">
        <p>{privacyNotice.security}</p>
        <p>Medidas técnicas adotadas:</p>
        <ul className="space-y-2">
          <li>Transmissão de dados via HTTPS/TLS em todo o site e APIs;</li>
          <li>Acesso restrito por autenticação e controle granular de permissões;</li>
          <li>Dados de cartão de crédito não armazenados pela BelaPop — processados diretamente pelo gateway Stripe (PCI-DSS);</li>
          <li>Logs de auditoria para operações sensíveis;</li>
          <li>Revisão periódica de políticas e dependências de segurança.</li>
        </ul>
        <p>
          Em caso de incidente de segurança que possa gerar risco ou dano relevante aos titulares, a
          BelaPop avaliará o evento, adotará medidas de contenção e comunicará a ANPD em até 3 dias
          úteis, quando a comunicação for exigida. Titulares afetados serão comunicados o mais breve
          possível, com informações úteis sobre o ocorrido e medidas recomendadas.
        </p>
        <p>
          Suspeitas de vazamento, acesso indevido ou uso irregular de dados podem ser comunicadas
          pelo e-mail{" "}
          <a
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href={`mailto:${belapopOperationalContacts.privacyChannel}`}
          >
            {belapopOperationalContacts.privacyChannel}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="links-terceiros" title="Links para sites de terceiros">
        <p>
          O site da BelaPop pode conter links para sites externos — redes sociais, marcas parceiras e
          fornecedores. Este Aviso de Privacidade não se aplica a esses sites. Recomendamos que você
          leia as políticas de privacidade de cada site antes de fornecer dados pessoais.
        </p>
      </LegalSection>

      <LegalSection id="atualizacoes" title="Alterações neste aviso">
        <p>
          A BelaPop pode atualizar este aviso para refletir mudanças de operação, legislação,
          fornecedores, cookies, WhatsApp, Skin Scan ou Círculo. Quando fizermos alterações relevantes,
          notificaremos por e-mail ou por aviso destacado no site com pelo menos 15 dias de antecedência.
          A data de "última atualização" no topo do documento será sempre revisada.
        </p>
        <p>O uso continuado do site após a notificação implica aceite das alterações.</p>
      </LegalSection>

      <LegalSection id="contato" title="Contato e canal de privacidade">
        <p>
          A BelaPop pode atualizar este aviso para refletir mudanças de operação, legislação,
          fornecedores, cookies, WhatsApp, Skin Scan ou Círculo. A versão vigente fica identificada
          pela data de atualização desta página.
        </p>
        <p>
          Dúvidas sobre pedidos, conta ou atendimento podem ser enviadas para{" "}
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
