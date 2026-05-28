import Link from "next/link";

import { AlertBanner } from "@/components/adm/AlertBanner";
import { AdminTable } from "@/components/adm/AdminTable";
import { StatusBadge } from "@/components/adm/StatusBadge";
import {
  AuthenticityBadge,
  PackagingStandardCard,
  PackagingStandardChecklist,
  ProductImageChecklist,
  ProductPublishStatus,
  ProductQualityScore,
  ProductStandardsChecklist,
  ReturnPolicyCard,
  SellerPackagingGuidelines,
  SellerProfileHeader,
  SellerQualityBadge,
  SellerStandardsChecklist,
  ShippingInfoCard,
  VerifiedProductBadge
} from "@/components/catalog-standards";
import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";
import { canAccessRoute } from "@/lib/adm/auth/guards";
import { qualityRepository } from "@/lib/adm/repositories";
import { getCatalogStandardSnapshot } from "@/lib/catalog-standards/server";
import type {
  CatalogStandardDashboardMetric,
  SellerStandardRecord,
  StandardStatus
} from "@/lib/catalog-standards";

const statusTone: Record<StandardStatus, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  blocked: "border-rose-200 bg-rose-50 text-rose-800",
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  review: "border-stone-200 bg-stone-50 text-stone-800"
};

const metricLabel: Record<StandardStatus, string> = {
  approved: "OK",
  blocked: "Bloqueio",
  pending: "Pendente",
  review: "Revisao"
};

function MetricCard({ metric }: { metric: CatalogStandardDashboardMetric }) {
  return (
    <article className="rounded-[8px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
          {metric.label}
        </p>
        <span className={`rounded-[8px] border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${statusTone[metric.status]}`}>
          {metricLabel[metric.status]}
        </span>
      </div>
      <p className="mt-4 font-editorial text-4xl leading-none text-[var(--adm-text)]">{metric.value}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--adm-text-soft)]">{metric.detail}</p>
    </article>
  );
}

function SellerScoreBreakdown({ seller }: { seller: SellerStandardRecord }) {
  const entries = [
    ["Envio", seller.scoreBreakdown.shipment],
    ["Avaliacoes", seller.scoreBreakdown.reviews],
    ["Devolucao", seller.scoreBreakdown.returnRate],
    ["Resposta", seller.scoreBreakdown.responseTime],
    ["Catalogo", seller.scoreBreakdown.catalogQuality],
    ["Visual", seller.scoreBreakdown.visualStandardization],
    ["Reclamacoes", seller.scoreBreakdown.complaints],
    ["Confiabilidade", seller.scoreBreakdown.reliability]
  ] as const;

  return (
    <section className="rounded-[8px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
            Score interno do seller
          </p>
          <h3 className="mt-2 font-editorial text-2xl text-[var(--adm-text)]">{seller.brandName}</h3>
        </div>
        <SellerQualityBadge score={seller.qualityScore} status={seller.status} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {entries.map(([label, value]) => (
          <div key={label}>
            <div className="flex items-center justify-between gap-3 text-xs text-[var(--adm-text-soft)]">
              <span>{label}</span>
              <span className="font-semibold text-[var(--adm-text)]">{value}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/8">
              <div className="h-full rounded-full bg-[#2f2a25]" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function CatalogQualityHubPage() {
  const qualityStandard = await getCatalogStandardSnapshot();
  const catalogStandardDashboard = qualityStandard.dashboard;
  const productStandards = qualityStandard.products;
  const sellerStandards = qualityStandard.sellers;
  const verificationStatuses = qualityStandard.verificationStatuses;
  const issues = await qualityRepository.listCatalogQualityIssues();
  const criticalProducts = await qualityRepository.listCriticalProducts(6);
  const currentUser = await getCurrentAdmUser();
  const canVisit = (href: string) => (currentUser ? canAccessRoute(currentUser, href).allowed : false);
  const highlightedSeller = sellerStandards[0];
  const selectedPolicySeller = sellerStandards[1] ?? highlightedSeller;
  const productUnderReview =
    productStandards.find((product) => product.status !== "approved") ?? productStandards[3] ?? productStandards[0];
  const productUnderReviewSeller = sellerStandards.find((seller) => seller.sellerId === productUnderReview.sellerId);

  return (
    <div className="space-y-7">
      <AlertBanner
        tone="warning"
        title="BelaPop Quality Standard: governanca minima de sellers e SKUs"
        description="Camada operacional para controlar autenticidade, naming, imagem, claims, logistica, embalagem e score antes da publicação."
      />

      <section className="rounded-[8px] border border-[#2f2a25] bg-[#211d1a] p-6 text-white shadow-[var(--adm-shadow-micro)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
              Marketplace premium, nao vitrine aberta
            </p>
            <h1 className="mt-3 max-w-4xl font-editorial text-4xl leading-tight md:text-5xl">
              Todo seller e todo SKU precisam parecer auditados, consistentes e dignos da curadoria.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68">
              O painel abaixo consolida padrao por seller, padrao por SKU, autenticidade,
              logistica, visual, claims, embalagem e score para decidir o que publica, o que
              volta para ajuste e o que recebe selo BelaPop.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <VerifiedProductBadge type="seller-verified" className="border-white/15 bg-white/10 text-white" />
            <VerifiedProductBadge type="authentic-product" className="border-white/15 bg-white/10 text-white" />
            <VerifiedProductBadge type="premium-shipping" className="border-white/15 bg-white/10 text-white" />
            <VerifiedProductBadge type="invoice-guaranteed" className="border-white/15 bg-white/10 text-white" />
            <VerifiedProductBadge type="belapop-curation" className="border-white/15 bg-white/10 text-white" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalogStandardDashboard.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="rounded-[8px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
              BelaPop Quality Standard
            </p>
            <h2 className="mt-2 font-editorial text-3xl text-[var(--adm-text)]">Pilares obrigatorios de publicacao</h2>
          </div>
          <Link
            href="/adm/curadoria/regras"
            className="text-xs font-semibold uppercase tracking-[0.16em] underline underline-offset-4"
          >
            Ver regras de curadoria
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {catalogStandardDashboard.governancePillars.map((pillar) => (
            <div key={pillar} className="rounded-[8px] border border-[#ded8cf] bg-[#fbfaf7] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--adm-text)]">{pillar}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SellerProfileHeader seller={highlightedSeller} />
        <SellerScoreBreakdown seller={highlightedSeller} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <SellerStandardsChecklist seller={highlightedSeller} />
        <SellerPackagingGuidelines seller={selectedPolicySeller} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {productStandards.slice(0, 3).map((product) => (
          <ProductStandardsChecklist
            key={product.id}
            product={product}
            title={product.normalizedName}
            compact={product.status === "approved"}
          />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <ProductQualityScore
          score={productUnderReview.qualityScore}
          label="SKU em bloqueio editorial"
          breakdown={{
            authenticity: 58,
            claims: 32,
            content: 61,
            images: 42,
            logistics: 70,
            naming: 28,
            seo: 54
          }}
        />

        <section className="rounded-[8px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
            Claims controlados
          </p>
          <h2 className="mt-2 font-editorial text-3xl text-[var(--adm-text)]">Whitelist e blacklist da curadoria</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Permitidos</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {catalogStandardDashboard.claimControls.whitelist.map((claim) => (
                  <span key={claim} className="rounded-[8px] border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                    {claim}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-800">Bloqueados</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {catalogStandardDashboard.claimControls.blacklist.slice(0, 10).map((claim) => (
                  <span key={claim} className="rounded-[8px] border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                    {claim}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <ShippingInfoCard policy={selectedPolicySeller.shippingPolicy} />
        <ReturnPolicyCard policy={selectedPolicySeller.returnPolicy} />
        <PackagingStandardCard packaging={productUnderReview.packaging} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <ProductPublishStatus product={productUnderReview} seller={productUnderReviewSeller} />
        <ProductImageChecklist images={productUnderReview.images} />
        <PackagingStandardChecklist packaging={productUnderReview.packaging} />
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
              Triage operacional de SKU
            </p>
            <h2 className="mt-2 font-editorial text-3xl text-[var(--adm-text)]">Produtos, selos e inconsistencias</h2>
          </div>
          <Link
            href="/adm/curadoria/produtos"
            className="text-xs font-semibold uppercase tracking-[0.16em] underline underline-offset-4"
          >
            Abrir curadoria de produtos
          </Link>
        </div>
        <AdminTable
          rows={productStandards}
          rowKey={(product) => product.id}
          columns={[
            {
              id: "produto",
              label: "Produto / SKU",
              render: (product) => (
                <div>
                  <p className="font-semibold">{product.normalizedName}</p>
                  <p className="mt-1 text-xs text-[#6f675e]">{product.internalSku} - {product.brand}</p>
                </div>
              )
            },
            {
              id: "seller",
              label: "Seller",
              render: (product) => (
                canVisit("/adm/operacao/parceiros") ? (
                  <Link href={`/adm/operacao/parceiros?seller=${product.sellerId}`} className="underline underline-offset-4">
                    {sellerStandards.find((seller) => seller.sellerId === product.sellerId)?.brandName ?? product.sellerId}
                  </Link>
                ) : (
                  sellerStandards.find((seller) => seller.sellerId === product.sellerId)?.brandName ?? product.sellerId
                )
              )
            },
            {
              id: "autenticidade",
              label: "Autenticidade",
              render: (product) => <AuthenticityBadge authenticity={product.authenticity} compact />
            },
            {
              id: "score",
              label: "Score",
              render: (product) => `${product.qualityScore}/100`
            },
            {
              id: "alertas",
              label: "Alertas",
              render: (product) => (
                <span className="text-xs text-[#6f675e]">
                  {product.validationAlerts.filter((alert) => alert.severity !== "info").length} alerta(s)
                </span>
              )
            },
            {
              id: "acao",
              label: "Acao",
              className: "text-right",
              render: (product) => (
                canVisit("/adm/curadoria/produtos") ? (
                  <Link
                    href={`/adm/curadoria/produtos?product=${product.productId}&seller=${product.sellerId}`}
                    className="text-xs font-semibold uppercase tracking-[0.14em] underline underline-offset-4"
                  >
                    Revisar
                  </Link>
                ) : (
                  <span className="text-xs uppercase tracking-[0.14em] text-[#756d63]">Sem acesso</span>
                )
              )
            }
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[8px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
            Produto Verificado BelaPop
          </p>
          <h2 className="mt-2 font-editorial text-3xl text-[var(--adm-text)]">Selos de confianca</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {verificationStatuses.slice(0, 4).map((item) => (
              <div key={item.productId} className="rounded-[8px] border border-[#ded8cf] bg-[#fbfaf7] p-4">
                <p className="text-sm font-semibold text-[var(--adm-text)]">{item.productId}</p>
                <p className="mt-1 text-xs text-[var(--adm-text-soft)]">
                  Seller aprovado: {item.sellerApproved ? "sim" : "pendente"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.badges.map((badge) => (
                    <span key={badge} className="rounded-[8px] border border-black/10 bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em]">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[8px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
            Alertas de inconsistencia
          </p>
          <h2 className="mt-2 font-editorial text-3xl text-[var(--adm-text)]">O que impede uma experiencia premium</h2>
          <div className="mt-5 space-y-3">
            {catalogStandardDashboard.operationalAlerts.map((alert) => (
              <div key={alert} className="rounded-[8px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                {alert}
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {issues.map((issue) => (
          canVisit(issue.href) ? (
            <Link
              key={issue.id}
              href={issue.href}
              className="rounded-[8px] border border-[#d7d2c8] bg-white p-5 transition hover:border-[#b8b1a6]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-editorial text-2xl text-[#1f1b18]">{issue.title}</p>
                <StatusBadge status={issue.severity} />
              </div>
              <p className="mt-2 text-sm text-[#6c645b]">{issue.detail}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#35302c]">
                Abrir modulo relacionado
              </p>
            </Link>
          ) : (
            <div key={issue.id} className="rounded-[8px] border border-[#d7d2c8] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-editorial text-2xl text-[#1f1b18]">{issue.title}</p>
                <StatusBadge status={issue.severity} />
              </div>
              <p className="mt-2 text-sm text-[#6c645b]">{issue.detail}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b645b]">
                Visao consolidada sem navegacao para este perfil
              </p>
            </div>
          )
        ))}
      </section>

      <section>
        <AdminTable
          rows={criticalProducts}
          rowKey={(product) => product.id}
          columns={[
            {
              id: "produto",
              label: "Produto Critico",
              render: (product) => (
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-[#6f675e]">{product.id}</p>
                </div>
              )
            },
            {
              id: "seller",
              label: "Seller",
              render: (product) => (
                canVisit("/adm/operacao/parceiros") ? (
                  <Link
                    href={`/adm/operacao/parceiros?seller=${product.sellerId}`}
                    className="text-[#2f2a25] underline underline-offset-4"
                  >
                    {product.sellerName}
                  </Link>
                ) : (
                  product.sellerName
                )
              )
            },
            {
              id: "status",
              label: "Status",
              render: (product) => <StatusBadge status={product.curationStatus} />
            },
            {
              id: "acao",
              label: "Acao",
              className: "text-right",
              render: (product) => (
                canVisit("/adm/curadoria/produtos") ? (
                  <Link
                    href={`/adm/curadoria/produtos?product=${product.id}&status=${product.curationStatus}`}
                    className="text-xs font-semibold uppercase tracking-[0.16em] underline underline-offset-4"
                  >
                    Abrir curadoria
                  </Link>
                ) : (
                  <span className="text-xs uppercase tracking-[0.16em] text-[#756d63]">Sem acesso</span>
                )
              )
            }
          ]}
        />
      </section>
    </div>
  );
}
