import Link from "next/link";

import { AdminDrawer } from "@/components/adm/AdminDrawer";
import { AdminFilters } from "@/components/adm/AdminFilters";
import { AdminTable } from "@/components/adm/AdminTable";
import { EmptyState } from "@/components/adm/EmptyState";
import { PermissionGate } from "@/components/adm/auth/PermissionGate";
import { ErrorState, NoResultsState, PartialDataState } from "@/components/adm/DataStates";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { formatDateTime, titleCase } from "@/lib/adm/format";
import { activitiesRepository, optionsRepository, type ActivityLogDetailItem } from "@/lib/adm/repositories";
import {
  buildHref,
  hasActiveFilterParams,
  toListQueryParams,
  type AdmFilters,
  type SearchParamsInput
} from "@/lib/adm/url";
import type { AuditSnapshotValue } from "@/types/adm";

type ActivityLogPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

const sortOptions = [
  { value: "createdAt", label: "Data do Evento" },
  { value: "user", label: "Usuario" },
  { value: "action", label: "Acao" },
  { value: "entity", label: "Entidade" },
  { value: "status", label: "Status" }
];

const formatAuditValue = (value: AuditSnapshotValue | undefined) => {
  if (value === null || value === undefined || value === "") return "Sem valor";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Sim" : "Nao";
  return String(value);
};

const formatFieldLabel = (value: string) =>
  titleCase(
    value
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[_\s]+/g, "-")
      .toLowerCase()
  );

function AuditSnapshotComparison({ activity }: { activity: ActivityLogDetailItem }) {
  const keys = Array.from(
    new Set([...Object.keys(activity.before ?? {}), ...Object.keys(activity.after ?? {})])
  );

  if (keys.length === 0) {
    return (
      <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b635a]">
          Before / After
        </p>
        <p className="mt-2 text-sm text-[#6f675e]">
          Este evento ainda nao possui diff detalhado armazenado.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b635a]">
        Before / After
      </p>
      <div className="mt-3 space-y-2">
        {keys.map((key) => (
          <div
            key={key}
            className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 rounded-lg border border-[#ece8df] px-3 py-2 text-sm"
          >
            <p className="font-medium text-[#2a2622]">{formatFieldLabel(key)}</p>
            <p className="text-[#756d63]">{formatAuditValue(activity.before?.[key])}</p>
            <p className="text-[#2a2622]">{formatAuditValue(activity.after?.[key])}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditMetadataCard({ activity }: { activity: ActivityLogDetailItem }) {
  const metadataEntries = Object.entries(activity.metadata ?? {});

  if (metadataEntries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b635a]">
        Metadados
      </p>
      <div className="mt-3 space-y-2">
        {metadataEntries.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-4 border-t border-[#f0ece5] pt-2 first:border-t-0 first:pt-0">
            <p className="text-sm font-medium text-[#2a2622]">{formatFieldLabel(key)}</p>
            <p className="text-right text-sm text-[#6f675e]">{formatAuditValue(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function ActivityLogPage({ filters, searchParamsSource }: ActivityLogPageProps) {
  const query = toListQueryParams(searchParamsSource, {
    page: 1,
    pageSize: 12,
    sortBy: "createdAt",
    sortDir: "desc"
  });

  const listResult = await activitiesRepository.listActivities(query);
  const selectedActivity = filters.activity
    ? (await activitiesRepository.getActivityById(filters.activity)).data
    : null;

  if (!listResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar log de atividades"
        description={listResult.error?.message ?? "Nao foi possivel carregar eventos de auditoria."}
      />
    );
  }

  const rows = listResult.data.items;
  const showNoResults = rows.length === 0 && hasActiveFilterParams(filters);

  return (
    <div className="space-y-5">
      <AdminFilters
        searchPlaceholder="Buscar no log por usuario, entidade, acao ou contexto"
        options={{
          status: optionsRepository.listStatusOptions(),
          action: optionsRepository.listActivityActionOptions(),
          entity: optionsRepository.listActivityEntityOptions(),
          period: optionsRepository.listPeriodOptions(),
          user: optionsRepository.listActivityActorOptions()
        }}
        sorting={{ options: sortOptions }}
        pagination={listResult.data.meta}
        showDateRange
      />

      {listResult.partial ? <PartialDataState /> : null}

      {showNoResults ? (
        <NoResultsState
          title="Sem eventos para os filtros ativos"
          description="Ajuste termo, entidade, acao, usuario ou periodo para visualizar a trilha."
          actionHref="/adm/gestao/log-atividades"
          actionLabel="Limpar filtros"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sem eventos de atividade"
          description="Ainda nao ha eventos registrados para este modulo."
        />
      ) : (
        <AdminTable
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            {
              id: "evento",
              label: "Evento",
              render: (row) => (
                <div>
                  <p className="font-semibold">{row.actionLabel}</p>
                  <p className="text-xs text-[#6f675e]">{row.summary ?? row.id}</p>
                </div>
              )
            },
            {
              id: "usuario",
              label: "Usuario",
              render: (row) => row.userName
            },
            {
              id: "entidade",
              label: "Entidade",
              render: (row) => (
                <div>
                  <p className="font-medium">{titleCase(row.entityType)}</p>
                  <p className="text-xs text-[#6f675e]">{row.entityId}</p>
                </div>
              )
            },
            {
              id: "status",
              label: "Status",
              render: (row) => <StatusBadge status={row.status} />
            },
            {
              id: "data",
              label: "Data",
              render: (row) => formatDateTime(row.createdAt)
            },
            {
              id: "acoes",
              label: "Acoes",
              className: "text-right",
              render: (row) => (
                <div className="flex justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  <Link
                    href={buildHref("/adm/gestao/log-atividades", searchParamsSource, {
                      activity: row.id
                    })}
                    className="underline underline-offset-4"
                  >
                    Detalhe
                  </Link>
                  <PermissionGate
                    route="/adm/gestao/usuarios-internos"
                    fallback={<span className="text-[#756d63]">Sem acesso</span>}
                  >
                    <Link
                      href={`/adm/gestao/usuarios-internos?user=${row.userId}`}
                      className="underline underline-offset-4"
                    >
                      Usuario
                    </Link>
                  </PermissionGate>
                </div>
              )
            }
          ]}
        />
      )}

      {selectedActivity ? (
        <AdminDrawer
          title={selectedActivity.actionLabel}
          subtitle={`${titleCase(selectedActivity.entityType)} ${selectedActivity.entityId}`}
          closeHref={buildHref("/adm/gestao/log-atividades", searchParamsSource, {
            activity: undefined
          })}
        >
          <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b635a]">
                  Resumo do Evento
                </p>
                <p className="mt-2 text-sm text-[#2a2622]">
                  {selectedActivity.summary ?? "Evento operacional registrado no backoffice."}
                </p>
              </div>
              <StatusBadge status={selectedActivity.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-[#f7f5f0] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#746d65]">Usuario</p>
                <p className="mt-1 font-medium text-[#2a2622]">{selectedActivity.userName}</p>
              </div>
              <div className="rounded-lg bg-[#f7f5f0] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#746d65]">Data</p>
                <p className="mt-1 font-medium text-[#2a2622]">
                  {formatDateTime(selectedActivity.createdAt)}
                </p>
              </div>
              <div className="rounded-lg bg-[#f7f5f0] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#746d65]">
                  Action Type
                </p>
                <p className="mt-1 font-medium text-[#2a2622]">{selectedActivity.actionType}</p>
              </div>
              <div className="rounded-lg bg-[#f7f5f0] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#746d65]">
                  Entidade
                </p>
                <p className="mt-1 font-medium text-[#2a2622]">
                  {titleCase(selectedActivity.entityType)} {selectedActivity.entityId}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs font-semibold uppercase tracking-[0.14em]">
              {selectedActivity.contextPathname ? (
                <Link href={selectedActivity.contextPathname} className="block underline underline-offset-4">
                  Abrir contexto da acao
                </Link>
              ) : null}
              <PermissionGate route="/adm/gestao/usuarios-internos">
                <Link
                  href={`/adm/gestao/usuarios-internos?user=${selectedActivity.userId}`}
                  className="block underline underline-offset-4"
                >
                  Abrir usuario responsavel
                </Link>
              </PermissionGate>
            </div>
          </div>

          <AuditSnapshotComparison activity={selectedActivity} />
          <AuditMetadataCard activity={selectedActivity} />
        </AdminDrawer>
      ) : null}
    </div>
  );
}
