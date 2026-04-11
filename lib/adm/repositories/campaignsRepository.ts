import {
  applySearch,
  applySort,
  normalizeListQuery,
  toDetailResponse,
  toListResponse
} from "@/lib/adm/repositories/base";
import { admDataSource as adminMockData } from "@/lib/adm/repositories/source";
import type { Campaign, DetailResponse, ListQueryParams, ListResponse } from "@/types/adm";

export const campaignsRepository = {
  listCampaigns(params: ListQueryParams): ListResponse<Campaign> {
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "upliftPct",
      defaultSortDir: "desc"
    });

    let rows = [...adminMockData.campaigns];

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.period) rows = rows.filter((row) => row.period === query.period);
    if (query.campaign) rows = rows.filter((row) => row.id === query.campaign);

    rows = applySearch(rows, query.q, (row) => `${row.id} ${row.name}`);

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      name: (row) => row.name,
      upliftPct: (row) => row.upliftPct,
      status: (row) => row.status,
      period: (row) => row.period
    });

    return toListResponse(rows, query.page, query.pageSize);
  },

  getCampaignById(campaignId: string): DetailResponse<Campaign> {
    const campaign = adminMockData.campaigns.find((row) => row.id === campaignId) ?? null;
    return toDetailResponse(campaign);
  }
};
