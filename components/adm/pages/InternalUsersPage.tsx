import Link from "next/link";

import { AdminFilters } from "@/components/adm/AdminFilters";
import { AdminTable } from "@/components/adm/AdminTable";
import { EmptyState } from "@/components/adm/EmptyState";
import { PermissionGate } from "@/components/adm/auth/PermissionGate";
import { ErrorState, NoResultsState } from "@/components/adm/DataStates";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { formatDateTime } from "@/lib/adm/format";
import { activitiesRepository, optionsRepository } from "@/lib/adm/repositories";
import { hasActiveFilterParams, toListQueryParams, type AdmFilters } from "@/lib/adm/url";

type InternalUsersPageProps = {
  filters: AdmFilters;
};

const sortOptions = [
  { value: "lastAccessAt", label: "Ultimo Acesso" },
  { value: "name", label: "Nome" },
  { value: "area", label: "Area" },
  { value: "status", label: "Status" }
];

export async function InternalUsersPage({ filters }: InternalUsersPageProps) {
  const query = toListQueryParams(filters, {
    page: 1,
    pageSize: 20,
    sortBy: "lastAccessAt",
    sortDir: "desc"
  });
  const listResult = await activitiesRepository.listInternalUsers(query);

  if (!listResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar usuarios internos"
        description={listResult.error?.message ?? "Nao foi possivel carregar usuarios internos."}
      />
    );
  }

  const rows = listResult.data.items;
  const showNoResults = rows.length === 0 && hasActiveFilterParams(filters);

  return (
    <div className="space-y-5">
      <AdminFilters
        searchPlaceholder="Buscar usuario por nome, area ou cargo"
        options={{
          status: optionsRepository.listStatusOptions()
        }}
        sorting={{ options: sortOptions }}
        pagination={listResult.data.meta}
        showDateRange
      />

      {showNoResults ? (
        <NoResultsState
          title="Sem usuarios para os filtros ativos"
          description="Ajuste busca, status ou ordenacao para encontrar usuarios."
          actionHref="/adm/gestao/usuarios-internos"
          actionLabel="Limpar filtros"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhum usuario interno encontrado"
          description="Nao ha usuarios internos cadastrados neste recorte."
        />
      ) : (
        <AdminTable
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            {
              id: "usuario",
              label: "Usuario",
              render: (row) => (
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-[#6f675e]">{row.id}</p>
                </div>
              )
            },
            {
              id: "area",
              label: "Area",
              render: (row) => row.area
            },
            {
              id: "cargo",
              label: "Cargo",
              render: (row) => row.role
            },
            {
              id: "status",
              label: "Status",
              render: (row) => <StatusBadge status={row.status} />
            },
            {
              id: "ultimo",
              label: "Ultimo acesso",
              render: (row) => formatDateTime(row.lastAccessAt)
            },
            {
              id: "acoes",
              label: "Acoes",
              className: "text-right",
              render: (row) => (
                <PermissionGate
                  route="/adm/gestao/log-atividades"
                  fallback={
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756d63]">
                      Sem acesso
                    </span>
                  }
                >
                  <Link
                    href={`/adm/gestao/log-atividades?user=${row.id}`}
                    className="text-xs font-semibold uppercase tracking-[0.14em] underline underline-offset-4"
                  >
                    Ver atividades
                  </Link>
                </PermissionGate>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
