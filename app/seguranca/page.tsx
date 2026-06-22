import type { Metadata } from "next";
import Link from "next/link";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { belapopContact } from "@/lib/brand/contact";

export const metadata: Metadata = {
  title: "Segurança | BelaPop",
  description:
    "Práticas de segurança aplicadas para proteger dados, conta e operação da BelaPop."
};

const UPDATED_AT = "29/05/2026";

const tableOfContents = [
  { id: "protecao-dados", label: "Proteção de dados" },
  { id: "pagamentos", label: "Pagamentos" },
  { id: "prevencao-fraude", label: "Prevenção a fraudes" },
  { id: "boas-praticas", label: "Boas práticas para você" },
  { id: "contato-seguranca", label: "Canal de atendimento" }
] as const;

export default function SegurancaPage() {
  const waHref = `https://wa.me/${belapopContact.whatsappNumber}?text=Olá%2C+BelaPop.+Preciso+de+suporte.`;

  return (
    <LegalPageLayout
      eyebrow="INSTITUCIONAL"
      title="Segurança"
      intro="Segurança é parte da experiência. Usamos boas práticas para proteger dados pessoais, acessos e operação do marketplace, com foco em minimização, controle e rastreabilidade."
      updatedAt={UPDATED_AT}
      tableOfContents={tableOfContents}
      aside={<InstitutionalIdentityCard />}
    >
      <LegalSection id="protecao-dados" title="Proteção de dados">
        <ul className="space-y-2">
          <li>Criptografia e canais seguros para transmissão de dados.</li>
          <li>Controles de acesso, permissão por função e segregação de responsabilidades.</li>
          <li>Boas práticas de desenvolvimento para reduzir riscos e falhas.</li>
        </ul>
        <p>
          Para entender como seus dados são coletados e tratados, veja nosso{" "}
          <Link
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href="/aviso-de-privacidade"
          >
            Aviso de Privacidade
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="pagamentos" title="Pagamentos">
        <p>
          Dados de pagamento são processados por provedores terceiros certificados. A BelaPop
          não armazena dados sensíveis completos de cartão. Quando aplicável, utilizamos
          tokenização e integrações alinhadas a padrões de mercado (PCI via provedor).
        </p>
        <p>
          Para detalhes sobre meios de pagamento aceitos e prazos, consulte os{" "}
          <Link
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href="/termos-de-uso"
          >
            Termos de Uso
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="prevencao-fraude" title="Prevenção a fraudes">
        <p>
          Podemos realizar verificações adicionais e aplicar mecanismos de prevenção a fraude
          para proteger a cliente, os sellers e a plataforma. Em caso de suspeita, o pedido
          pode ser pausado para análise antes da expedição.
        </p>
      </LegalSection>

      <LegalSection id="boas-praticas" title="Boas práticas para você">
        <ul className="space-y-2">
          <li>Use senhas fortes e não compartilhe credenciais de acesso.</li>
          <li>Mantenha navegador e dispositivo atualizados.</li>
          <li>Ao notar qualquer uso não autorizado, entre em contato imediatamente pelo canal abaixo.</li>
          <li>
            Links e e-mails que pedem dados sensíveis fora dos canais oficiais devem ser tratados
            como suspeitos. Em caso de dúvida, fale diretamente com o atendimento.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="contato-seguranca" title="Canal de atendimento">
        <p>
          Para relatar incidentes de segurança, uso não autorizado ou dúvidas sobre proteção
          de dados, utilize os canais oficiais:
        </p>
        <ul className="space-y-2">
          <li>
            <strong>WhatsApp:</strong>{" "}
            <a
              className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {belapopContact.whatsappDisplay}
            </a>
          </li>
          <li>
            <strong>E-mail:</strong>{" "}
            <a
              className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
              href={`mailto:${belapopContact.privacyEmail}`}
            >
              {belapopContact.privacyEmail}
            </a>
          </li>
        </ul>
        <p>
          Veja também nossa{" "}
          <Link
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href="/politica-de-cookies"
          >
            Política de Cookies
          </Link>{" "}
          e a{" "}
          <Link
            className="font-semibold text-[#1c1b1b] underline-offset-4 hover:underline"
            href="/politica-de-trocas-e-devolucoes"
          >
            Política de Trocas e Devoluções
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
