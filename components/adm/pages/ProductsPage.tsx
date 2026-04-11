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
import { canAccessRoute, filterPermissionedActions } from "@/lib/adm/auth/guards";
import { formatCurrency } from "@/lib/adm/format";
import { optionsRepository, productsRepository } from "@/lib/adm/repositories";
import { buildHref, hasActiveFilterParams, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type ProductsPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

const sortOptions = [
  { value: "qualityScore", label: "Score de Qualidade" },
  { value: "name", label: "Nome do Produto" },
  { value: "price", label: "Preco" },
  { value: "stock", label: "Estoque" },
  { value: "status", label: "Status" }
];

export async function ProductsPage({ filters, searchParamsSource }: ProductsPageProps) {
  const query = toListQueryParams(searchParamsSource, {
    page: 1,
    pageSize: 10,
    sortBy: "qualityScore",
    sortDir: "desc"
  });

  const listResult = await productsRepository.listProducts(query);
  const selectedProductResult = filters.product
    ? await productsRepository.getProductById(filters.product)
    : null;
  const selectedProduct = selectedProductResult?.data ?? null;
  const currentUser = await getCurrentAdmUser();
  const canVisit = (href: string) => (currentUser ? canAccessRoute(currentUser, href).allowed : false);
  const curationActions =
    currentUser && selectedProduct
      ? filterPermissionedActions(currentUser, [
          {
            label: "Aprovar",
            request: { type: "product.approve" as const, entityId: selectedProduct.product.id },
            requiredPermissions: ["approve_products"]
          },
          {
            label: "Pedir ajuste",
            request: {
              type: "product.request-adjustment" as const,
              entityId: selectedProduct.product.id
            },
            requiredPermissions: ["manage_products"]
          },
          {
            label: "Reprovar",
            tone: "danger" as const,
            request: { type: "product.reject" as const, entityId: selectedProduct.product.id },
            requiredPermissions: ["approve_products"]
          }
        ])
      : [];

  if (!listResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar curadoria"
        description={listResult.error?.message ?? "Nao foi possivel carregar os produtos."}
      />
    );
  }

  const rows = listResult.data.items;
  const showNoResults = rows.length === 0 && hasActiveFilterParams(filters);

  return (
    <div className="space-y-5">
      <AdminFilters
        searchPlaceholder="Buscar produto por nome ou SKU"
        options={{
          status: optionsRepository.listStatusOptions(),
          seller: optionsRepository.listSellerOptions(),
          category: optionsRepository.listCategoryOptions(),
          period: optionsRepository.listPeriodOptions(),
          priority: optionsRepository.listPriorityOptions()
        }}
        sorting={{
          options: sortOptions
        }}
        pagination={listResult.data.meta}
      />

      {listResult.partial ? <PartialDataState /> : null}

      {showNoResults ? (
        <NoResultsState
          title="Nenhum produto encontrado para os filtros ativos"
          description="Ajuste busca, seller, categoria ou status para localizar itens."
          actionHref="/adm/curadoria/produtos"
          actionLabel="Limpar filtros"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhum produto para este recorte"
          description="A base ainda nao possui produtos disponiveis neste modulo."
        />
      ) : (
        <AdminTable
          rows={rows}
          rowKey={(product) => product.id}
          columns={[
            {
              id: "produto",
              label: "Produto",
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
                    href={buildHref("/adm/operacao/parceiros", searchParamsSource, {
                      seller: product.sellerId,
                      status: undefined,
                      product: undefined
                    })}
                    className="underline underline-offset-4"
                  >
                    {product.sellerName}
                  </Link>
                ) : (
                  product.sellerName
                )
              )
            },
            {
              id: "categoria",
              label: "Categoria",
              render: (product) => product.category
            },
            {
              id: "curadoria",
              label: "Curadoria",
              render: (product) => <StatusBadge status={product.curationStatus} />
            },
            {
              id: "preco",
              label: "Preco",
              className: "text-right",
              render: (product) => formatCurrency(product.price)
            },
            {
              id: "acoes",
              label: "Acoes",
              className: "text-right",
              render: (product) => (
                <div className="flex justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  <Link
                    href={buildHref("/adm/curadoria/produtos", searchParamsSource, {
                      product: product.id
                    })}
                    className="underline underline-offset-4"
                  >
                    Detalhe
                  </Link>
                  {canVisit("/adm/catalogo-marca/reviews") ? (
                    <Link
                      href={`/adm/catalogo-marca/reviews?product=${product.id}&seller=${product.sellerId}`}
                      className="underline underline-offset-4"
                    >
                      Reviews
                    </Link>
                  ) : null}
                </div>
              )
            }
          ]}
        />
      )}

      {selectedProduct ? (
        <AdminDrawer
          title={selectedProduct.product.name}
          subtitle={`SKU ${selectedProduct.product.id} - Score ${selectedProduct.product.qualityScore}`}
          closeHref={buildHref("/adm/curadoria/produtos", searchParamsSource, {
            product: undefined
          })}
        >
          {curationActions.length > 0 ? (
            <AdminActionPanel title="Acoes de curadoria" actions={curationActions} />
          ) : null}

          <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#6f675f]">Contexto do seller</p>
            <p className="mt-1 text-sm font-semibold text-[#27231f]">
              {selectedProduct.seller?.name ?? "Seller removido"}
            </p>
            <PermissionGate route="/adm/operacao/parceiros">
              <Link
                href={`/adm/operacao/parceiros?seller=${selectedProduct.product.sellerId}`}
                className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.15em] underline underline-offset-4"
              >
                Abrir gestao de parceiros
              </Link>
            </PermissionGate>
          </div>

          <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#6f675f]">Pedidos impactados</p>
            <div className="mt-2 space-y-2">
              {selectedProduct.relatedOrders.length === 0 ? (
                <p className="text-sm text-[#6f675f]">Sem pedidos em aberto.</p>
              ) : (
                selectedProduct.relatedOrders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-[#ece8e0] bg-[#faf8f4] p-3">
                    <p className="text-sm font-semibold">{order.id}</p>
                    <p className="mt-1 text-xs text-[#655e56]">
                      Status logistico: {order.logisticsStatus}
                    </p>
                    <div className="mt-2 flex gap-3">
                      <PermissionGate route={`/adm/operacao/logistica/envios/${order.shipmentId}`}>
                        <Link
                          href={`/adm/operacao/logistica/envios/${order.shipmentId}?order=${order.id}`}
                          className="text-xs font-semibold uppercase tracking-[0.13em] underline underline-offset-4"
                        >
                          Detalhe de envio
                        </Link>
                      </PermissionGate>
                      <PermissionGate route="/adm/financeiro/reembolsos">
                        <Link
                          href={`/adm/financeiro/reembolsos?order=${order.id}`}
                          className="text-xs font-semibold uppercase tracking-[0.13em] underline underline-offset-4"
                        >
                          Reembolsos
                        </Link>
                      </PermissionGate>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </AdminDrawer>
      ) : null}
    </div>
  );
}
