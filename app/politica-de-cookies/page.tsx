import type { Metadata } from "next";

import { InstitutionalIdentityCard } from "@/components/legal/InstitutionalIdentityCard";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { OperationalPendingNotice } from "@/components/legal/OperationalPendingNotice";
import { cookieCategories, cookiesPolicy } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Política de Cookies | BelaPop",
  description:
    "Tipos de cookies usados pela BelaPop, ferramentas de analytics e marketing, banner de consentimento e preferências."
};

const toolRows = [
  {
    name: "Vercel Analytics e Speed Insights",
    purpose: "Medição de performance, estabilidade e experiência técnica.",
    status: "Carregados após consentimento de desempenho."
  },
  {
    name: "PostHog",
    purpose: "Eventos de produto, funil, checkout e comportamento agregado.",
    status: "Usado quando configurado e respeitando consentimento de analytics."
  },
  {
    name: "Google Analytics / GA4",
    purpose: "Mensuração de audiência, páginas vistas e eventos.",
    status: "Carregado apenas se houver ID público configurado."
  },
  {
    name: "Meta Pixel",
    purpose: "Medição de campanhas e audiências de mídia.",
    status: "Carregado apenas se houver Pixel ID configurado."
  },
  {
    name: "TikTok Pixel",
    purpose: "Medição de campanhas e audiências de mídia.",
    status: "Carregado apenas se houver Pixel ID configurado."
  },
  {
    name: "Hotjar",
    purpose: "Mapas de calor, gravações ou pesquisas de experiência.",
    status: "Não identificado no código atual."
  }
] as const;

export default function CookiesPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="PREFERÊNCIAS E COOKIES"
      title="Política de Cookies"
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
      <LegalSection id="o-que-sao" title="O que são cookies">
        <p>
          Cookies são pequenos arquivos ou identificadores armazenados no navegador. Tecnologias
          semelhantes incluem pixels, tags, scripts de analytics, identificadores locais e eventos
          enviados pelo navegador.
        </p>
        <p>
          A BelaPop usa essas tecnologias para manter a plataforma segura, lembrar sessão, prevenir
          fraude, medir desempenho e, quando autorizado, personalizar campanhas e conteúdo.
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

      <LegalSection id="ferramentas" title="Ferramentas de medição e mídia">
        <div className="space-y-4">
          {toolRows.map((tool) => (
            <article key={tool.name} className="rounded-[20px] border border-[#ebe1e2] p-4">
              <h3 className="font-semibold text-[#1c1b1b]">{tool.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5b5051]">{tool.purpose}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c5d66]">
                {tool.status}
              </p>
            </article>
          ))}
        </div>
        <p>
          Ferramentas de marketing e analytics podem envolver provedores fora do Brasil. Quando
          isso ocorrer, a BelaPop adota as bases e salvaguardas descritas no Aviso de Privacidade.
        </p>
      </LegalSection>

      <LegalSection id="consentimento" title="Como o consentimento funciona">
        <p>
          Na primeira visita, o banner de cookies permite aceitar todos, recusar cookies não
          essenciais ou personalizar categorias opcionais. Cookies estritamente necessários ficam
          ativos porque sustentam segurança, sessão, prevenção a fraude e funcionamento básico.
        </p>
        <p>
          A recusa de cookies não essenciais não impede a navegação, mas pode reduzir personalização,
          medição de campanha, preferências visuais ou melhoria de experiência.
        </p>
      </LegalSection>

      <LegalSection id="gestao" title="Como personalizar ou retirar o consentimento">
        <p>
          A cliente pode reabrir o painel pelo link &quot;Personalizar cookies&quot; no rodapé e alterar
          suas preferências a qualquer momento. Também é possível apagar cookies diretamente no
          navegador.
        </p>
        <p>
          A alteração não afeta tratamentos já concluídos antes da revogação, mas interrompe o uso
          futuro das categorias opcionais na medida tecnicamente possível.
        </p>
      </LegalSection>

      <LegalSection id="retencao" title="Retenção e revisão">
        <p>
          A preferência de cookies é armazenada por até 180 dias para evitar solicitar a mesma
          escolha a cada visita. Eventos de analytics e marketing seguem os prazos próprios dos
          fornecedores e as regras de retenção do Aviso de Privacidade.
        </p>
        <p>
          O inventário de cookies deve ser revisado quando novas ferramentas forem ativadas,
          especialmente Google Analytics, Meta Pixel, TikTok Pixel, Hotjar ou outras soluções de
          mídia e comportamento.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
