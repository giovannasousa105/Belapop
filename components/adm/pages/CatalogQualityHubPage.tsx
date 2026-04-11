import Link from "next/link";

import { AlertBanner } from "@/components/adm/AlertBanner";
import { AdminTable } from "@/components/adm/AdminTable";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";
import { canAccessRoute } from "@/lib/adm/auth/guards";
import { qualityRepository } from "@/lib/adm/repositories";

export async function CatalogQualityHubPage() {
  const issues = await qualityRepository.listCatalogQualityIssues();
  const criticalProducts = await qualityRepository.listCriticalProducts(6);
  const currentUser = await getCurrentAdmUser();
  const canVisit = (href: string) => (currentUser ? canAccessRoute(currentUser, href).allowed : false);

  return (
    <div className="space-y-6">
      <AlertBanner
        tone="warning"
        title="Hub de Qualidade do Catalogo"
        description="Cada bloco abaixo aponta diretamente para o modulo responsavel: curadoria, parceiros, logistica, financeiro, documentos e reviews."
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {issues.map((issue) => (
          canVisit(issue.href) ? (
            <Link
              key={issue.id}
              href={issue.href}
              className="rounded-2xl border border-[#d7d2c8] bg-white p-5 transition hover:border-[#b8b1a6]"
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
            <div key={issue.id} className="rounded-2xl border border-[#d7d2c8] bg-white p-5">
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
