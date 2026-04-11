import Link from "next/link";

import { AdminActionPanel } from "@/components/adm/AdminActionPanel";
import { AdminDrawer } from "@/components/adm/AdminDrawer";
import { AdminFilters } from "@/components/adm/AdminFilters";
import { AdminTable } from "@/components/adm/AdminTable";
import { EmptyState } from "@/components/adm/EmptyState";
import { PermissionGate } from "@/components/adm/auth/PermissionGate";
import { ErrorState, NoResultsState, PartialDataState } from "@/components/adm/DataStates";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";
import { filterPermissionedActions } from "@/lib/adm/auth/guards";
import { optionsRepository, reviewsRepository } from "@/lib/adm/repositories";
import { buildHref, hasActiveFilterParams, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type ReviewsPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

const sortOptions = [
  { value: "createdAt", label: "Data da Review" },
  { value: "rating", label: "Nota" },
  { value: "seller", label: "Seller" },
  { value: "product", label: "Produto" }
];

export async function ReviewsPage({ filters, searchParamsSource }: ReviewsPageProps) {
  const query = toListQueryParams(searchParamsSource, {
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortDir: "desc"
  });

  const listResult = await reviewsRepository.listReviews(query);
  const selectedReview = filters.review
    ? (await reviewsRepository.getReviewById(filters.review)).data
    : null;
  const currentUser = await getCurrentAdmUser();
  const reviewActions =
    currentUser && selectedReview
      ? filterPermissionedActions(currentUser, [
          {
            label: "Aprovar",
            request: { type: "review.approve" as const, entityId: selectedReview.id },
            requiredPermissions: ["manage_reviews"]
          },
          {
            label: "Reprovar",
            tone: "danger" as const,
            request: {
              type: "review.hide" as const,
              entityId: selectedReview.id,
              payload: { status: "reprovado" as const }
            },
            requiredPermissions: ["manage_reviews"],
            confirmTitle: "Reprovar review",
            confirmDescription:
              "A avaliacao sera retirada do fluxo publico e o caso ficara registrado na moderacao.",
            confirmLabel: "Confirmar reprovacao"
          }
        ])
      : [];

  if (!listResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar reviews"
        description={listResult.error?.message ?? "Nao foi possivel carregar reviews."}
      />
    );
  }

  const rows = listResult.data.items;
  const showNoResults = rows.length === 0 && hasActiveFilterParams(filters);

  return (
    <div className="space-y-5">
      <AdminFilters
        searchPlaceholder="Buscar review por texto, seller ou produto"
        options={{
          status: optionsRepository.listStatusOptions(),
          seller: optionsRepository.listSellerOptions(),
          category: optionsRepository.listCategoryOptions(),
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
          title="Sem reviews para os filtros ativos"
          description="Ajuste seller, status, busca ou ordenacao para localizar avaliacoes."
          actionHref="/adm/catalogo-marca/reviews"
          actionLabel="Limpar filtros"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhuma review neste recorte"
          description="Nao encontramos avaliacoes para os filtros selecionados."
        />
      ) : (
        <AdminTable
          rows={rows}
          rowKey={(review) => review.id}
          columns={[
            {
              id: "review",
              label: "Review",
              render: (review) => (
                <div>
                  <p className="font-semibold">{review.id}</p>
                  <p className="text-xs text-[#6f675e]">{review.excerpt}</p>
                </div>
              )
            },
            {
              id: "produto",
              label: "Produto",
              render: (review) => review.productName
            },
            {
              id: "seller",
              label: "Seller",
              render: (review) => (
                <PermissionGate route="/adm/operacao/parceiros" fallback={review.sellerName}>
                  <Link
                    href={`/adm/operacao/parceiros?seller=${review.sellerId}`}
                    className="underline underline-offset-4"
                  >
                    {review.sellerName}
                  </Link>
                </PermissionGate>
              )
            },
            {
              id: "rating",
              label: "Nota",
              render: (review) => `${review.rating}/5`
            },
            {
              id: "status",
              label: "Status",
              render: (review) => <StatusBadge status={review.status} />
            },
            {
              id: "acoes",
              label: "Acoes",
              className: "text-right",
              render: (review) => (
                <div className="flex justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  <Link
                    href={buildHref("/adm/catalogo-marca/reviews", searchParamsSource, {
                      review: review.id
                    })}
                    className="underline underline-offset-4"
                  >
                    Detalhe
                  </Link>
                  <PermissionGate route="/adm/curadoria/produtos">
                    <Link
                      href={`/adm/curadoria/produtos?product=${review.productId}`}
                      className="underline underline-offset-4"
                    >
                      Curadoria
                    </Link>
                  </PermissionGate>
                </div>
              )
            }
          ]}
        />
      )}

      {selectedReview ? (
        <AdminDrawer
          title={`Review ${selectedReview.id}`}
          subtitle={`Sentimento ${selectedReview.sentiment}`}
          closeHref={buildHref("/adm/catalogo-marca/reviews", searchParamsSource, { review: undefined })}
        >
          {reviewActions.length > 0 ? (
            <AdminActionPanel title="Acoes de moderacao" actions={reviewActions} />
          ) : null}

          <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
            <p className="text-sm text-[#2a2622]">{selectedReview.excerpt}</p>
            <p className="mt-2 text-xs text-[#6f675e]">Nota {selectedReview.rating}/5</p>
            <div className="mt-3 space-y-2 text-xs font-semibold uppercase tracking-[0.15em]">
              <PermissionGate route="/adm/curadoria/produtos">
                <Link href={`/adm/curadoria/produtos?product=${selectedReview.productId}`} className="block underline underline-offset-4">
                  Abrir produto em curadoria
                </Link>
              </PermissionGate>
              <PermissionGate route="/adm/operacao/parceiros">
                <Link href={`/adm/operacao/parceiros?seller=${selectedReview.sellerId}`} className="block underline underline-offset-4">
                  Abrir seller
                </Link>
              </PermissionGate>
            </div>
          </div>
        </AdminDrawer>
      ) : null}
    </div>
  );
}
