import type { Metadata } from "next";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import { privacyNotice } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Aviso de Privacidade | BelaPop",
  description:
    "Identificacao da controladora, dados tratados, finalidades, bases legais, compartilhamento, retencao e direitos do titular na BelaPop."
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
      <LegalSection id="controladora" title="Controladora e identificacao">
        <p>
          A BelaPop atua como controladora dos dados pessoais tratados em seu ambiente digital,
          observados os limites da LGPD e a estrutura operacional efetivamente implantada.
        </p>
        <p>
          Este aviso foi organizado para deixar claro quem responde pela relacao com o titular,
          quais pontos ja estao definidos e quais dados ainda dependem de validacao operacional.
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
          adequada ou exigencia valida de autoridade competente.
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

      <LegalSection id="retencao" title="Retencao">
        <p>{privacyNotice.retention}</p>
      </LegalSection>

      <LegalSection id="direitos" title="Direitos do titular">
        <p>
          O titular pode exercer os direitos previstos na LGPD por canal que venha a ser
          formalizado pela BelaPop. Enquanto o canal definitivo nao for validado, o front exibe a
          pendencia de forma expressa.
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

      <LegalSection id="seguranca" title="Seguranca e antifraude">
        <p>{privacyNotice.security}</p>
      </LegalSection>

      <LegalSection id="contato" title="Contato e atualizacoes">
        <p>
          A BelaPop pode revisar este aviso para refletir mudancas juridicas, operacionais ou
          tecnicas. A versao em vigor fica identificada pela data de atualizacao indicada nesta
          pagina.
        </p>
        <p>
          Os contatos formais de e-mail institucional, privacidade e encarregado(a) ainda precisam
          de validacao operacional antes da publicacao definitiva.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
