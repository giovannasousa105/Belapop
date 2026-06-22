import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { belapopCompany, belapopOperationalContacts } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Termos do Círculo BelaPop | BelaPop",
  description:
    "Regras de participação, conduta, cancelamento e direitos dos membros do Círculo BelaPop — o programa exclusivo de drops de skincare coreano."
};

const tableOfContents = [
  { id: "o-que-e", label: "O que é o Círculo BelaPop" },
  { id: "quem-pode", label: "Quem pode participar" },
  { id: "inscricao", label: "Como funciona a inscrição" },
  { id: "o-que-você-recebe", label: "O que você receberá" },
  { id: "canais", label: "Canais de comunicação" },
  { id: "cancelamento", label: "Cancelamento e descadastro" },
  { id: "conduta", label: "Conduta dos membros" },
  { id: "propriedade", label: "Propriedade intelectual" },
  { id: "isencao", label: "Isenção de responsabilidade" },
  { id: "modificacoes", label: "Modificações do programa" },
  { id: "disposicoes", label: "Disposições gerais" },
  { id: "contato", label: "Contato" },
];

export default function CirculoTermosPage() {
  return (
    <LegalPageLayout
      eyebrow="Círculo BelaPop"
      title="Termos do Círculo BelaPop"
      intro="Ao se inscrever no Círculo BelaPop, você concorda com os termos abaixo, que regulam sua participação no programa, o uso dos canais de comunicação e os direitos e deveres dos membros."
      updatedAt="29/05/2026"
      tableOfContents={tableOfContents}
    >
      <LegalSection id="o-que-e" title="O que é o Círculo BelaPop">
        <p>
          O Círculo BelaPop é um programa de acesso exclusivo e antecipado a lançamentos, drops curados
          e conteúdos de skincare coreano, oferecido gratuitamente pela BelaPop ({belapopCompany.legalName},
          CNPJ {belapopCompany.cnpj}).
        </p>
        <p>
          Ao se inscrever, você integra uma lista seleta de pessoas que recebem, antes do público geral,
          comunicações sobre novos produtos, edições limitadas, rituais de skincare e informações educativas
          sobre K-beauty.
        </p>
      </LegalSection>

      <LegalSection id="quem-pode" title="Quem pode participar">
        <p>Pode participar do Círculo BelaPop qualquer pessoa que:</p>
        <ul className="space-y-2">
          <li>Tenha 18 anos ou mais (ou 16/17 anos com autorização expressa dos pais ou responsáveis);</li>
          <li>Resida no território brasileiro;</li>
          <li>Possua um endereço de e-mail válido e/ou número de WhatsApp ativo;</li>
          <li>Aceite integralmente estes Termos e a{" "}
            <Link href="/aviso-de-privacidade" className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4">
              Política de Privacidade
            </Link>{" "}
            da BelaPop.
          </li>
        </ul>
        <p>
          A BelaPop reserva-se o direito de recusar ou cancelar inscrições a seu exclusivo critério,
          especialmente em caso de suspeita de fraude, dados inválidos ou violação destes Termos.
        </p>
      </LegalSection>

      <LegalSection id="inscricao" title="Como funciona a inscrição">
        <ol className="space-y-3">
          <li>A inscrição é realizada exclusivamente pelo formulário disponível em{" "}
            <Link href="/circulo" className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4">
              belapopoficial.com.br/circulo
            </Link>.
          </li>
          <li>Você deverá fornecer: nome, e-mail, WhatsApp e, opcionalmente, seu tipo de pele e
            principais preocupações de skincare.</li>
          <li>Após a inscrição, você receberá um e-mail de confirmação no endereço cadastrado.
            A participação só é efetivada após a confirmação.</li>
          <li>É vedado cadastrar dados de terceiros sem a sua autorização ou criar cadastros fictícios.</li>
        </ol>
      </LegalSection>

      <LegalSection id="o-que-voce-recebe" title="O que você receberá">
        <p>Membros do Círculo BelaPop podem receber:</p>
        <ul className="space-y-2">
          <li><strong>Drops antecipados:</strong> avisos exclusivos antes do lançamento público de novos produtos.</li>
          <li><strong>Conteúdo educativo:</strong> guias, rituais e dicas de skincare coreano.</li>
          <li><strong>Ofertas exclusivas:</strong> condições especiais disponíveis apenas para membros.</li>
          <li><strong>Acesso ao grupo de WhatsApp</strong> (quando disponível): espaço de comunidade com outros membros e a equipe BelaPop.</li>
        </ul>
        <p>
          A frequência, formato e conteúdo das comunicações podem variar. A participação no Círculo não
          garante compra antecipada de produtos, acesso a preços especiais ou qualquer vantagem além das
          descritas acima, salvo quando expressamente comunicado.
        </p>
      </LegalSection>

      <LegalSection id="canais" title="Canais de comunicação">
        <ul className="space-y-3">
          <li>
            <strong>E-mail:</strong> Comunicações serão enviadas pelo endereço{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">noreply@belapopoficial.com.br</code>{" "}
            com reply-to para <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">contato@belapopoficial.com.br</code>.
          </li>
          <li>
            <strong>WhatsApp:</strong> Caso você tenha fornecido seu número e consentido, poderemos enviar
            mensagens pelo WhatsApp Business da BelaPop.
          </li>
          <li>
            <strong>Grupo de WhatsApp do Círculo:</strong> A participação no grupo é opcional e regida pelas
            regras específicas descritas na{" "}
            <Link href="/aviso-de-privacidade" className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4">
              Política de Privacidade
            </Link>.
          </li>
          <li>
            <strong>WhatsApp Business:</strong>{" "}
            <a href="https://wa.me/553498047036" className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline">
              +55 (34) 9804-7036
            </a>
          </li>
          <li>
            <strong>Frequência:</strong> Nos comprometemos a não enviar comunicações excessivas. Em geral,
            a frequência será de no máximo 2 comunicações por semana.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cancelamento" title="Cancelamento e descadastro">
        <p>Você pode sair do Círculo a qualquer momento:</p>
        <ul className="space-y-2">
          <li>Clicando no link <em>Cancelar inscrição</em> presente em todo e-mail enviado;</li>
          <li>Enviando e-mail para{" "}
            <a href="mailto:contato@belapopoficial.com.br" className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4">
              contato@belapopoficial.com.br
            </a>{" "}
            com o assunto "Sair do Círculo";
          </li>
          <li>Saindo do grupo de WhatsApp (se aplicável).</li>
        </ul>
        <p>
          Após o cancelamento, você deixará de receber comunicações do Círculo em até 5 dias úteis
          (prazo técnico de processamento).
        </p>
        <p>
          O cancelamento não implica exclusão dos seus dados da BelaPop, caso você tenha realizado compras
          ou outros cadastros conosco. Para exclusão de dados, consulte a{" "}
          <Link href="/aviso-de-privacidade" className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4">
            Política de Privacidade
          </Link>.
        </p>
      </LegalSection>

      <LegalSection id="conduta" title="Conduta dos membros">
        <p>
          Ao participar do Círculo BelaPop, especialmente em canais comunitários como grupos de WhatsApp,
          você concorda em:
        </p>
        <ul className="space-y-2">
          <li>Tratar todos os membros com respeito e civilidade;</li>
          <li>Não compartilhar conteúdo exclusivo do Círculo em outros canais sem autorização expressa da BelaPop;</li>
          <li>Não utilizar os canais do Círculo para spam, divulgação de produtos concorrentes ou promoção pessoal;</li>
          <li>Não disseminar informações falsas, conteúdo ofensivo, discriminatório, ou que viole direitos de terceiros;</li>
          <li>Não capturar e compartilhar externamente conversas ou informações de outros membros sem o seu consentimento.</li>
        </ul>
        <p>
          O descumprimento dessas regras pode resultar em exclusão imediata do Círculo, sem prejuízo de
          outras medidas cabíveis.
        </p>
      </LegalSection>

      <LegalSection id="propriedade" title="Propriedade intelectual">
        <p>
          Todo o conteúdo enviado para membros do Círculo — incluindo textos, imagens, guias, rituais e
          vídeos — é de propriedade exclusiva da BelaPop ou de seus licenciadores, protegido pela Lei
          n.º 9.610/1998 (Lei de Direitos Autorais).
        </p>
        <p>Você pode utilizar o conteúdo para uso pessoal. É vedado:</p>
        <ul className="space-y-2">
          <li>Reproduzir, republicar ou distribuir o conteúdo comercialmente sem autorização;</li>
          <li>Remover marcas, logotipos ou indicações de autoria;</li>
          <li>Criar obras derivadas para fins comerciais.</li>
        </ul>
      </LegalSection>

      <LegalSection id="isencao" title="Isenção de responsabilidade">
        <ul className="space-y-3">
          <li>
            O Círculo BelaPop é oferecido "no estado em que se encontra". A BelaPop não garante
            disponibilidade ininterrupta dos serviços ou que as comunicações sempre chegarão ao
            destinatário (sujeito a filtros de spam, problemas de entrega, etc.).
          </li>
          <li>
            A BelaPop não se responsabiliza por eventuais danos decorrentes de uso inadequado das
            informações de skincare recebidas. Recomendamos sempre testar produtos em área restrita da
            pele e consultar um dermatologista em caso de reações adversas.
          </li>
          <li>
            A BelaPop não se responsabiliza por conteúdo postado por outros membros em grupos comunitários.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="modificacoes" title="Modificações do programa">
        <p>A BelaPop pode, a qualquer tempo:</p>
        <ul className="space-y-2">
          <li>Alterar as condições, formato ou benefícios do Círculo;</li>
          <li>Encerrar o programa, com aviso prévio de pelo menos 30 dias aos membros ativos;</li>
          <li>Alterar estes Termos, com notificação por e-mail com 15 dias de antecedência.</li>
        </ul>
        <p>O uso continuado do serviço após a notificação implica aceite das alterações.</p>
      </LegalSection>

      <LegalSection id="disposicoes" title="Disposições gerais">
        <ul className="space-y-3">
          <li><strong>Lei aplicável:</strong> Estes Termos são regidos pelas leis da República Federativa do Brasil.</li>
          <li>
            <strong>Foro:</strong> Fica eleito o foro da comarca de Araguari/MG para dirimir quaisquer
            controvérsias, ressalvado o direito do consumidor de optar pelo foro do seu domicílio,
            conforme Art. 101, I, do CDC.
          </li>
          <li>
            <strong>Separabilidade:</strong> Se qualquer cláusula for declarada nula ou ineficaz,
            as demais permanecerão em pleno vigor.
          </li>
          <li>
            <strong>Relação com a Política de Privacidade:</strong> Estes Termos devem ser lidos em
            conjunto com a{" "}
            <Link href="/aviso-de-privacidade" className="font-semibold text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4">
              Política de Privacidade
            </Link>{" "}
            da BelaPop, que é parte integrante deste instrumento.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="contato" title="Contato">
        <ul className="space-y-2">
          <li>
            <strong>E-mail:</strong>{" "}
            <a href={`mailto:${belapopOperationalContacts.institutionalEmail}`}
              className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline">
              {belapopOperationalContacts.institutionalEmail}
            </a>
          </li>
          <li>
            <strong>WhatsApp:</strong>{" "}
            <a href="https://wa.me/553498047036" className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline">
              +55 (34) 9804-7036
            </a>
          </li>
          <li><strong>Endereço:</strong> {belapopCompany.address}</li>
          <li><strong>CNPJ:</strong> {belapopCompany.cnpj}</li>
        </ul>
      </LegalSection>
    </LegalPageLayout>
  );
}
