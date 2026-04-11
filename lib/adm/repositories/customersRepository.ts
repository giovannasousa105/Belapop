import { applySearch, applySort, normalizeListQuery, toListResponse } from "@/lib/adm/repositories/base";
import { admDataSource as adminMockData } from "@/lib/adm/repositories/source";
import type { Customer, ListQueryParams, ListResponse } from "@/types/adm";

export const customersRepository = {
  listCustomers(params: ListQueryParams): ListResponse<Customer> {
    const query = normalizeListQuery(params, {
      defaultPageSize: 10,
      defaultSortBy: "ltv",
      defaultSortDir: "desc"
    });

    let rows = [...adminMockData.customers];

    if (query.status) rows = rows.filter((row) => row.status === query.status);

    rows = applySearch(rows, query.q, (row) => `${row.id} ${row.name} ${row.segment}`);

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      name: (row) => row.name,
      segment: (row) => row.segment,
      ltv: (row) => row.ltv,
      openTickets: (row) => row.openTickets,
      status: (row) => row.status
    });

    return toListResponse(rows, query.page, query.pageSize);
  }
};
