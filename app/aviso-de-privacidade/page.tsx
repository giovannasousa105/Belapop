import type { Metadata } from "next";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import { belapopOperationalContacts, privacyNotice } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Aviso de Privacidade | BelaPop",
  description:
    "Identificação da controladora, dados tratados, finalidades, bases legais, compartilhamento, retenção e direitos do titular na BelaPop."
};

export default function PrivacyNoticePage() {
  return (
    <LegalPageLayout
      eyebrow="Institucional e privacidade"
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
      <LegalSection id="controladora" title="Controladora e identificação">
        <p>
          A BelaPop atua como controladora dos dados pessoais tratados em seu ambiente digital,
          observados os limites da LGPD e a estrutura operacional efetivamente implantada.
        </p>
        <p>
          Este aviso foi organizado para deixar claro quem responde pela relação com o titular,
          quais dados podem ser tratados e quais canais oficiais devem ser usados para atendimento
          e exercício de direitos.
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
      </LegalSection>

      <LegalSection id="compartilhamento" title="Compartilhamento">
        <p>
          O compartilhamento ocorre apenas quando houver necessidade operacional, base legal
          adequada ou exigência válida de autoridade competente.
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

      <LegalSection id="retencao" title="Retenção">
        <p>{privacyNotice.retention}</p>
      </LegalSection>

      <LegalSection id="direitos" title="Direitos do titular">
        <p>
          O titular pode exercer os direitos previstos na LGPD pelo canal de privacidade da
          BelaPop:{" "}
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

      <LegalSection id="seguranca" title="Segurança e antifraude">
        <p>{privacyNotice.security}</p>
      </LegalSection>

      <LegalSection id="contato" title="Contato e atualizações">
        <p>
          A BelaPop pode revisar este aviso para refletir mudanças jurídicas, operacionais ou
          técnicas. A versão em vigor fica identificada pela data de atualização indicada nesta
          página.
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
