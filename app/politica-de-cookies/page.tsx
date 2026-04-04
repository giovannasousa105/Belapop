import type { Metadata } from "next";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import { cookieCategories, cookiesPolicy } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Politica de Cookies | BelaPop",
  description:
    "Categorias de cookies, banner de consentimento, preferencias e pontos de validacao operacional da BelaPop."
};

export default function CookiesPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Institucional e preferencias"
      title="Politica de Cookies"
      intro={cookiesPolicy.intro}
      updatedAt={cookiesPolicy.updatedAt}
      tableOfContents={cookiesPolicy.tableOfContents}
      aside={
        <>
          <InstitutionalIdentityCard showSellerNotice={false} />
          <OperationalPendingNotice />
        </>
      }
    >
      <LegalSection id="o-que-sao" title="O que sao cookies">
        <p>
          Cookies e tecnologias semelhantes sao usados para manter o funcionamento seguro da
          plataforma, reconhecer sessao, prevenir fraude, medir desempenho e, quando permitido,
          personalizar conteudo ou publicidade.
        </p>
      </LegalSection>

      <LegalSection id="categorias" title="Categorias utilizadas">
        <div className="grid gap-4 lg:grid-cols-2">
          {cookieCategories.map((category) => (
            <article
              key={category.key}
              className="rounded-[24px] border border-[#ebe1e2] bg-[#fcf7f7] p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-[#1c1b1b]">{category.title}</h3>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c5d66]">
                  {category.alwaysOn ? "Sempre ativo" : "Opcional"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#5b5051]">{category.description}</p>
            </article>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="consentimento" title="Como o consentimento funciona">
        <p>
          O banner de cookies da BelaPop oferece tres caminhos: aceitar todos, recusar os cookies
          nao essenciais ou personalizar as categorias opcionais.
        </p>
        <p>
          As escolhas ficam armazenadas localmente para reaproveitamento da preferencia e para
          futura integracao com gerenciadores de tags ou rotinas de analytics.
        </p>
      </LegalSection>

      <LegalSection id="gestao" title="Como personalizar ou retirar o consentimento">
        <p>
          O cliente pode reabrir o painel de preferencias pelo link “Personalizar cookies” no
          rodape. Tambem e possivel ajustar configuracoes diretamente no navegador, observadas as
          limitacoes tecnicas de cada ambiente.
        </p>
      </LegalSection>

      <LegalSection id="mapa-operacional" title="Mapa operacional e validacoes pendentes">
        <p>
          O front-end ja separa as categorias de consentimento e esta pronto para futuras
          integracoes com tag manager. O inventario definitivo de cookies, pixels, scripts de
          analytics e personalizacao ainda precisa de mapeamento operacional real.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
