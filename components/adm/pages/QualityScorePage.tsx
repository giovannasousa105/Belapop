import Link from "next/link";

import { AdminFilters } from "@/components/adm/AdminFilters";
import { AdminTable } from "@/components/adm/AdminTable";
import { EmptyState } from "@/components/adm/EmptyState";
import { ErrorState, NoResultsState, PartialDataState } from "@/components/adm/DataStates";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { optionsRepository, qualityRepository } from "@/lib/adm/repositories";
import { hasActiveFilterParams, toListQueryParams, type AdmFilters } from "@/lib/adm/url";

type QualityScorePageProps = {
  filters: AdmFilters;
};

const sortOptions = [
  { value: "score", label: "Score" },
  { value: "updatedAt", label: "Atualizacao" },
  { value: "seller", label: "Seller" },
  { value: "status", label: "Status" }
];

export async function QualityScorePage({ filters }: QualityScorePageProps) {
  const query = toListQueryParams(filters, {
    page: 1,
    pageSize: 10,
    sortBy: "score",
    sortDir: "desc"
  });

  const listResult = await qualityRepository.listQualityScores(query);
  if (!listResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar scores de qualidade"
        description={listResult.error?.message ?? "Nao foi possivel carregar os indicadores."}
      />
    );
  }

  const rows = listResult.data.items;
  const showNoResults = rows.length === 0 && hasActiveFilterParams(filters);

  return (
    <div className="space-y-5">
      <AdminFilters
        searchPlaceholder="Buscar seller por nome para score"
        options={{
          status: optionsRepository.listStatusOptions(),
          seller: optionsRepository.listSellerOptions(),
          period: optionsRepository.listPeriodOptions(),
          priority: optionsRepository.listPriorityOptions()
        }}
        sorting={{ options: sortOptions }}
        pagination={listResult.data.meta}
      />

      {listResult.partial ? <PartialDataState /> : null}

      {showNoResults ? (
        <NoResultsState
          title="Sem scores para os filtros ativos"
          description="Ajuste seller, status ou busca para visualizar os indicadores."
          actionHref="/adm/curadoria/score"
          actionLabel="Limpar filtros"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sem scores para este recorte"
          description="Nao encontramos indicadores de qualidade para este modulo."
        />
      ) : (
        <AdminTable
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            {
              id: "seller",
              label: "Seller",
              render: (row) => (
                <Link href={`/adm/operacao/parceiros?seller=${row.sellerId}`} className="underline underline-offset-4">
                  {row.sellerName}
                </Link>
              )
            },
            {
              id: "score",
              label: "Score",
              render: (row) => `${row.score}/100`
            },
            {
              id: "trend",
              label: "Tendencia",
              render: (row) => row.trend
            },
            {
              id: "status",
              label: "Status",
              render: (row) => <StatusBadge status={row.status} />
            },
            {
              id: "acoes",
              label: "Acoes",
              className: "text-right",
              render: (row) => (
                <div className="flex justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  <Link
                    href={`/adm/operacao/parceiros?seller=${row.sellerId}`}
                    className="underline underline-offset-4"
                  >
                    Seller
                  </Link>
                  <Link
                    href={`/adm/curadoria/monitoramento?seller=${row.sellerId}`}
                    className="underline underline-offset-4"
                  >
                    Monitorar
                  </Link>
                </div>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
