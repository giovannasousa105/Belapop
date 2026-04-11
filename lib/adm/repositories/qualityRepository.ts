import { applySearch, applySort, normalizeListQuery, toListResponse } from "@/lib/adm/repositories/base";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { AdminVisualStatus, ListQueryParams, ListResponse, QualityScore } from "@/types/adm";

export type QualityScoreListItem = QualityScore & {
  sellerName: string;
};

export type CatalogQualityIssue = {
  id: string;
  title: string;
  detail: string;
  severity: AdminVisualStatus;
  href: string;
};

const withRelations = (
  score: QualityScore,
  sellerMap: Record<string, { name: string }>
): QualityScoreListItem => ({
  ...score,
  sellerName: sellerMap[score.sellerId]?.name ?? "Seller removido"
});

export const qualityRepository = {
  async listQualityScores(params: ListQueryParams): Promise<ListResponse<QualityScoreListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "score",
      defaultSortDir: "desc"
    });
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));

    let rows = adminMockData.qualityScores.map((score) => withRelations(score, sellerMap));

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.seller) rows = rows.filter((row) => row.sellerId === query.seller);

    rows = applySearch(rows, query.q, (row) => `${row.id} ${row.sellerName} ${row.score}`);

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      seller: (row) => row.sellerName,
      score: (row) => row.score,
      trend: (row) => row.trend,
      status: (row) => row.status,
      updatedAt: (row) => row.updatedAt
    });

    const partial = rows.some((row) => row.sellerName === "Seller removido");
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async listCatalogQualityIssues(): Promise<CatalogQualityIssue[]> {
    const adminMockData = await getAdmDataSource();
    const worstSeller = [...adminMockData.sellers].sort((left, right) => left.qualityScore - right.qualityScore)[0];
    const worstProduct = [...adminMockData.products].sort(
      (left, right) => left.qualityScore - right.qualityScore
    )[0];
    const criticalIncident = adminMockData.logisticsIncidents.find(
      (incident) => incident.priority === "critica"
    );
    const criticalAlert = adminMockData.financialAlerts.find((alert) => alert.priority === "critica");
    const blockedDocument = adminMockData.documents.find((document) => document.status === "bloqueado");
    const criticalReview = adminMockData.reviews.find(
      (review) => review.status === "critico" || review.sentiment === "negativo"
    );

    return [
      {
        id: "issue-curadoria-pendente",
        title: "Fila de curadoria acima do limite",
        detail: "Produtos em revisao e pendentes acumulados nas ultimas 24h.",
        severity: "alerta",
        href: "/adm/curadoria/produtos?status=pendente"
      },
      {
        id: "issue-seller-risco",
        title: "Seller com score em queda",
        detail:
          worstSeller
            ? `${worstSeller.name} caiu para ${worstSeller.qualityScore} no score de qualidade.`
            : "Seller com score abaixo do esperado.",
        severity: worstSeller?.status ?? "alerta",
        href: worstSeller
          ? `/adm/operacao/parceiros?seller=${worstSeller.id}`
          : "/adm/operacao/parceiros?priority=alta"
      },
      {
        id: "issue-logistica",
        title: "Incidente logistico impactando reputacao",
        detail:
          criticalIncident?.summary ?? "Atraso critico com possibilidade de chargeback ou review negativa.",
        severity: criticalIncident?.status ?? "critico",
        href: criticalIncident
          ? `/adm/operacao/logistica/incidentes?shipment=${criticalIncident.shipmentId}&priority=${criticalIncident.priority}`
          : "/adm/operacao/logistica/incidentes?priority=critica"
      },
      {
        id: "issue-financeiro",
        title: "Divergencia financeira em repasse",
        detail:
          criticalAlert?.summary ?? "Repasse bloqueado ou alerta financeiro em aberto para seller sensivel.",
        severity: criticalAlert?.status ?? "alerta",
        href: criticalAlert
          ? `/adm/financeiro/auditoria?alert=${criticalAlert.id}`
          : "/adm/financeiro/auditoria?priority=alta"
      },
      {
        id: "issue-documentos",
        title: "Documentos vencidos em seller bloqueado",
        detail:
          blockedDocument
            ? `${blockedDocument.type} segue pendente sob ${blockedDocument.owner}.`
            : "Existem pendencias regulatorias exigindo revisao.",
        severity: blockedDocument?.status ?? "bloqueado",
        href: blockedDocument
          ? `/adm/curadoria/documentos?document=${blockedDocument.id}`
          : "/adm/curadoria/documentos?status=bloqueado"
      },
      {
        id: "issue-reviews",
        title: "Reputacao em queda em SKU sensivel",
        detail:
          criticalReview?.excerpt ?? "Reviews negativas acima da media em produto de alto valor editorial.",
        severity: criticalReview?.status ?? "alerta",
        href: criticalReview
          ? `/adm/catalogo-marca/reviews?review=${criticalReview.id}`
          : "/adm/catalogo-marca/reviews?status=critico"
      }
    ];
  },

  async listCriticalProducts(limit = 6) {
    const adminMockData = await getAdmDataSource();
    const sellerMap = Object.fromEntries(adminMockData.sellers.map((seller) => [seller.id, seller]));

    return adminMockData.products
      .filter((product) => product.status === "critico" || product.curationStatus === "pendente")
      .slice(0, limit)
      .map((product) => ({
        ...product,
        sellerName: sellerMap[product.sellerId]?.name ?? "Seller removido"
      }));
  }
};
