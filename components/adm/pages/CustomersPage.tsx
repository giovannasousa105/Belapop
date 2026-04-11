import Link from "next/link";

import { AdminFilters } from "@/components/adm/AdminFilters";
import { AdminTable } from "@/components/adm/AdminTable";
import { EmptyState } from "@/components/adm/EmptyState";
import { ErrorState, NoResultsState } from "@/components/adm/DataStates";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { customersRepository, optionsRepository } from "@/lib/adm/repositories";
import { hasActiveFilterParams, toListQueryParams, type AdmFilters } from "@/lib/adm/url";

type CustomersPageProps = {
  filters: AdmFilters;
};

const sortOptions = [
  { value: "ltv", label: "LTV" },
  { value: "name", label: "Nome do Cliente" },
  { value: "openTickets", label: "Tickets Abertos" },
  { value: "status", label: "Status" }
];

export function CustomersPage({ filters }: CustomersPageProps) {
  const query = toListQueryParams(filters, {
    page: 1,
    pageSize: 10,
    sortBy: "ltv",
    sortDir: "desc"
  });

  const listResult = customersRepository.listCustomers(query);
  if (!listResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar clientes"
        description={listResult.error?.message ?? "Nao foi possivel carregar os clientes."}
      />
    );
  }

  const rows = listResult.data.items;
  const showNoResults = rows.length === 0 && hasActiveFilterParams(filters);

  return (
    <div className="space-y-5">
      <AdminFilters
        searchPlaceholder="Buscar cliente por nome ou segmento"
        options={{
          status: optionsRepository.listStatusOptions(),
          period: optionsRepository.listPeriodOptions(),
          priority: optionsRepository.listPriorityOptions()
        }}
        sorting={{ options: sortOptions }}
        pagination={listResult.data.meta}
      />

      {showNoResults ? (
        <NoResultsState
          title="Sem clientes para os filtros ativos"
          description="Ajuste busca, status ou ordenacao para localizar clientes."
          actionHref="/adm/relacionamento/clientes"
          actionLabel="Limpar filtros"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhum cliente encontrado"
          description="Sem resultados para os filtros selecionados."
        />
      ) : (
        <AdminTable
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            {
              id: "cliente",
              label: "Cliente",
              render: (row) => (
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-[#6f675e]">{row.id}</p>
                </div>
              )
            },
            {
              id: "segmento",
              label: "Segmento",
              render: (row) => row.segment
            },
            {
              id: "ltv",
              label: "LTV",
              className: "text-right",
              render: (row) => `R$ ${row.ltv.toLocaleString("pt-BR")}`
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
                  <Link href={`/adm/operacao/pedidos-criticos?q=${encodeURIComponent(row.name)}`} className="underline underline-offset-4">
                    Pedidos
                  </Link>
                  <Link href={`/adm/catalogo-marca/reviews?q=${encodeURIComponent(row.name)}`} className="underline underline-offset-4">
                    Reviews
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
