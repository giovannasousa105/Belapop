import Link from "next/link";

import { AdminActionPanel } from "@/components/adm/AdminActionPanel";
import { AdminDrawer } from "@/components/adm/AdminDrawer";
import { AdminFilters } from "@/components/adm/AdminFilters";
import { AdminTable } from "@/components/adm/AdminTable";
import { EmptyState } from "@/components/adm/EmptyState";
import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";
import { filterPermissionedActions } from "@/lib/adm/auth/guards";
import { ErrorState, NoResultsState, PartialDataState } from "@/components/adm/DataStates";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { PermissionGate } from "@/components/adm/auth/PermissionGate";
import { formatDateTime } from "@/lib/adm/format";
import { documentsRepository, optionsRepository } from "@/lib/adm/repositories";
import { buildHref, hasActiveFilterParams, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type DocumentsPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

const sortOptions = [
  { value: "dueDate", label: "Vencimento" },
  { value: "seller", label: "Seller" },
  { value: "type", label: "Tipo de Documento" },
  { value: "status", label: "Status" }
];

export async function DocumentsPage({ filters, searchParamsSource }: DocumentsPageProps) {
  const query = toListQueryParams(searchParamsSource, {
    page: 1,
    pageSize: 10,
    sortBy: "dueDate",
    sortDir: "asc"
  });

  const [listResult, selectedDocumentResult] = await Promise.all([
    documentsRepository.listDocuments(query),
    filters.document ? documentsRepository.getDocumentById(filters.document) : Promise.resolve({ data: null } as const)
  ]);
  const selectedDocument = selectedDocumentResult.data;
  const currentUser = await getCurrentAdmUser();
  const documentActions =
    currentUser && selectedDocument
      ? filterPermissionedActions(currentUser, [
          {
            label: "Validar",
            request: { type: "document.validate" as const, entityId: selectedDocument.id },
            requiredPermissions: ["manage_documents"]
          },
          {
            label: "Rejeitar",
            tone: "danger" as const,
            request: {
              type: "document.request-update" as const,
              entityId: selectedDocument.id,
              payload: { status: "reprovado" as const }
            },
            requiredPermissions: ["manage_documents"],
            confirmTitle: "Rejeitar documento",
            confirmDescription:
              "O documento sera marcado como reprovado e o seller precisara reenviar a versao correta.",
            confirmLabel: "Confirmar rejeicao"
          }
        ])
      : [];

  if (!listResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar documentos"
        description={listResult.error?.message ?? "Nao foi possivel carregar documentos."}
      />
    );
  }

  const rows = listResult.data.items;
  const showNoResults = rows.length === 0 && hasActiveFilterParams(filters);

  return (
    <div className="space-y-5">
      <AdminFilters
        searchPlaceholder="Buscar documento por tipo ou owner"
        options={{
          status: optionsRepository.listStatusOptions(),
          seller: optionsRepository.listSellerOptions(),
          period: optionsRepository.listPeriodOptions(),
          priority: optionsRepository.listPriorityOptions()
        }}
        sorting={{ options: sortOptions }}
        pagination={listResult.data.meta}
        showDateRange
      />

      {listResult.partial ? <PartialDataState /> : null}

      {showNoResults ? (
        <NoResultsState
          title="Sem documentos para os filtros ativos"
          description="Revise seller, status ou termo de busca."
          actionHref="/adm/curadoria/documentos"
          actionLabel="Limpar filtros"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhum documento para este recorte"
          description="A base atual nao possui documentos com os filtros selecionados."
        />
      ) : (
        <AdminTable
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            {
              id: "documento",
              label: "Documento",
              render: (row) => (
                <div>
                  <p className="font-semibold">{row.type}</p>
                  <p className="text-xs text-[#6f675e]">{row.id}</p>
                </div>
              )
            },
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
              id: "owner",
              label: "Owner",
              render: (row) => row.owner
            },
            {
              id: "vencimento",
              label: "Vencimento",
              render: (row) => row.dueDate
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
                    href={buildHref("/adm/curadoria/documentos", searchParamsSource, {
                      document: row.id
                    })}
                    className="underline underline-offset-4"
                  >
                    Detalhe
                  </Link>
                  <Link
                    href={`/adm/operacao/parceiros?seller=${row.sellerId}`}
                    className="underline underline-offset-4"
                  >
                    Seller
                  </Link>
                </div>
              )
            }
          ]}
        />
      )}

      {selectedDocument ? (
        <AdminDrawer
          title={`Documento ${selectedDocument.id}`}
          subtitle={selectedDocument.type}
          closeHref={buildHref("/adm/curadoria/documentos", searchParamsSource, {
            document: undefined
          })}
        >
          {documentActions.length > 0 ? (
            <AdminActionPanel title="Acoes documentais" actions={documentActions} />
          ) : null}

          <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
            <p className="text-sm text-[#2a2622]">
              Owner {selectedDocument.owner} - Vencimento {selectedDocument.dueDate}
            </p>
            <p className="mt-2 text-xs text-[#6f675e]">Atualizado em {formatDateTime(new Date().toISOString())}</p>
            <div className="mt-3 space-y-2 text-xs font-semibold uppercase tracking-[0.14em]">
              <PermissionGate route="/adm/operacao/parceiros">
                <Link href={`/adm/operacao/parceiros?seller=${selectedDocument.sellerId}`} className="block underline underline-offset-4">
                  Abrir seller
                </Link>
              </PermissionGate>
              <PermissionGate route="/adm/curadoria/compliance">
                <Link href={`/adm/curadoria/compliance?seller=${selectedDocument.sellerId}`} className="block underline underline-offset-4">
                  Abrir compliance
                </Link>
              </PermissionGate>
            </div>
          </div>
        </AdminDrawer>
      ) : null}
    </div>
  );
}
