import Link from "next/link";

import { AdminDrawer } from "@/components/adm/AdminDrawer";
import { AdminFilters } from "@/components/adm/AdminFilters";
import { AdminTable } from "@/components/adm/AdminTable";
import { EmptyState } from "@/components/adm/EmptyState";
import { AlertBanner } from "@/components/adm/AlertBanner";
import { ErrorState, NoResultsState, PartialDataState } from "@/components/adm/DataStates";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { formatDateTime } from "@/lib/adm/format";
import {
  documentsRepository,
  governanceRepository,
  optionsRepository,
  sellersRepository
} from "@/lib/adm/repositories";
import { buildHref, hasActiveFilterParams, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type CompliancePageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

const sortOptions = [
  { value: "createdAt", label: "Abertura" },
  { value: "priority", label: "Prioridade" },
  { value: "status", label: "Status" },
  { value: "seller", label: "Seller" },
  { value: "type", label: "Flag" }
];

function SummaryCard({
  label,
  value,
  note,
  href
}: {
  label: string;
  value: string;
  note: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-white p-5 shadow-[var(--adm-shadow-micro)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">{label}</p>
      <p className="mt-3 text-3xl font-editorial text-[var(--adm-text)]">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--adm-text-soft)]">{note}</p>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block transition-transform duration-200 hover:-translate-y-0.5">
      {content}
    </Link>
  );
}

export async function CompliancePage({ filters, searchParamsSource }: CompliancePageProps) {
  const query = toListQueryParams(searchParamsSource, {
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortDir: "desc"
  });

  const [listResult, selectedSellerResult, selectedDocumentResult, documentRows] = await Promise.all([
    Promise.resolve(governanceRepository.listComplianceFlags(query)),
    filters.seller ? sellersRepository.getSellerById(filters.seller) : Promise.resolve({ data: null } as const),
    filters.document ? documentsRepository.getDocumentById(filters.document) : Promise.resolve({ data: null } as const),
    documentsRepository.listDocuments({
      page: 1,
      pageSize: 100,
      sortBy: "dueDate",
      sortDir: "asc"
    })
  ]);

  const selectedDocument = selectedDocumentResult.data;
  const selectedSeller = selectedSellerResult.data;

  if (!listResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar compliance"
        description={listResult.error?.message ?? "Nao foi possivel carregar as flags de compliance."}
      />
    );
  }

  if (!documentRows.success) {
    return (
      <ErrorState
        title="Falha ao carregar documentos relacionados"
        description={documentRows.error?.message ?? "Nao foi possivel carregar o contexto documental da rota."}
      />
    );
  }

  const rows = listResult.data.items;
  const allFlags = governanceRepository.listComplianceFlags({
    page: 1,
    pageSize: 100,
    sortBy: "createdAt",
    sortDir: "desc"
  });

  const allRows = allFlags.success ? allFlags.data.items : rows;
  const openFlags = allRows.filter((row) => row.status !== "resolvido").length;
  const expiredDocuments = documentRows.data.items.filter((row) => row.status === "bloqueado").length;
  const blockedSellers = new Set(
    allRows.filter((row) => row.status === "bloqueado" || row.status === "critico").map((row) => row.sellerId)
  ).size;
  const financialImpact = allRows.filter((row) => row.alertId).length;
  const showNoResults = rows.length === 0 && hasActiveFilterParams(filters);

  return (
    <div className="space-y-5">
      <AlertBanner
        tone="warning"
        title="Pendencias regulatorias e flags de compliance"
        description="A tela cruza pendencia documental, seller bloqueado, impacto financeiro e risco reputacional. A base visual segue o modulo de documentos, mas com a lente de governanca da operacao."
        actionLabel="Abrir documentos pendentes"
        actionHref="/adm/curadoria/documentos?status=pendente"
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Flags abertas"
          value={String(openFlags)}
          note="Casos ativos que ainda exigem tratativa manual ou desbloqueio."
        />
        <SummaryCard
          label="Documentos vencidos"
          value={String(expiredDocuments)}
          note="Pendencias formais que costumam originar bloqueio preventivo."
          href="/adm/curadoria/documentos?status=bloqueado"
        />
        <SummaryCard
          label="Sellers bloqueados"
          value={String(blockedSellers)}
          note="Perfis com restricao operacional associada a documento, produto ou alerta."
          href="/adm/operacao/parceiros?status=bloqueado"
        />
        <SummaryCard
          label="Impacto financeiro"
          value={String(financialImpact)}
          note="Flags com alerta financeiro vinculado e possivel efeito em repasse ou auditoria."
          href="/adm/financeiro/auditoria"
        />
      </section>

      <AdminFilters
        searchPlaceholder="Buscar por flag, seller, documento ou resumo"
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
          title="Sem flags para os filtros ativos"
          description="Revise seller, status, prioridade ou periodo para retomar a visibilidade do quadro."
          actionHref="/adm/curadoria/compliance"
          actionLabel="Limpar filtros"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhuma flag de compliance neste recorte"
          description="A base atual nao possui flags regulatórias com os filtros selecionados."
        />
      ) : (
        <AdminTable
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            {
              id: "flag",
              label: "Flag",
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
                <Link
                  href={buildHref("/adm/curadoria/compliance", searchParamsSource, {
                    seller: row.sellerId
                  })}
                  className="underline underline-offset-4"
                >
                  {row.sellerName}
                </Link>
              )
            },
            {
              id: "origem",
              label: "Origem",
              render: (row) => row.documentType ?? row.productName ?? row.alertType ?? "--"
            },
            {
              id: "abertura",
              label: "Abertura",
              render: (row) => formatDateTime(row.createdAt)
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
                  {row.documentId ? (
                    <Link
                      href={buildHref("/adm/curadoria/compliance", searchParamsSource, {
                        document: row.documentId,
                        seller: row.sellerId
                      })}
                      className="underline underline-offset-4"
                    >
                      Documento
                    </Link>
                  ) : null}
                  <Link
                    href={row.alertId ? `/adm/financeiro/auditoria?alert=${row.alertId}` : `/adm/operacao/parceiros?seller=${row.sellerId}`}
                    className="underline underline-offset-4"
                  >
                    {row.alertId ? "Financeiro" : "Seller"}
                  </Link>
                </div>
              )
            }
          ]}
        />
      )}

      {selectedDocument || selectedSeller ? (
        <AdminDrawer
          title={selectedDocument ? selectedDocument.type : selectedSeller?.seller.name ?? "Foco de compliance"}
          subtitle={selectedDocument ? `Documento ${selectedDocument.id}` : "Seller sob observacao"}
          closeHref={buildHref("/adm/curadoria/compliance", searchParamsSource, {
            document: undefined,
            seller: selectedDocument ? filters.seller : undefined
          })}
        >
          {selectedDocument ? (
            <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
              <p className="text-sm text-[#2c2824]">
                {selectedDocument.sellerName} - owner {selectedDocument.owner}
              </p>
              <p className="mt-2 text-xs text-[#6f675e]">Vencimento {selectedDocument.dueDate}</p>
              <div className="mt-3 space-y-2 text-xs font-semibold uppercase tracking-[0.15em]">
                <Link href={`/adm/curadoria/documentos?document=${selectedDocument.id}`} className="block underline underline-offset-4">
                  Abrir modulo de documentos
                </Link>
                <Link href={`/adm/operacao/parceiros?seller=${selectedDocument.sellerId}`} className="block underline underline-offset-4">
                  Abrir seller
                </Link>
              </div>
            </div>
          ) : null}

          {selectedSeller ? (
            <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
              <p className="text-sm text-[#2c2824]">
                Seller {selectedSeller.seller.name} com {selectedSeller.pendingDocumentsCount} pendencia(s) documental(is).
              </p>
              <p className="mt-2 text-xs text-[#6f675e]">
                {selectedSeller.productsCount} produto(s) ativo(s) e {selectedSeller.openFinancialAlertsCount} alerta(s) financeiro(s) abertos.
              </p>
              <div className="mt-3 space-y-2 text-xs font-semibold uppercase tracking-[0.15em]">
                <Link href={`/adm/curadoria/documentos?seller=${selectedSeller.seller.id}`} className="block underline underline-offset-4">
                  Abrir documentos pendentes
                </Link>
                <Link href={`/adm/financeiro/auditoria?seller=${selectedSeller.seller.id}`} className="block underline underline-offset-4">
                  Abrir auditoria financeira
                </Link>
              </div>
            </div>
          ) : null}
        </AdminDrawer>
      ) : null}
    </div>
  );
}
