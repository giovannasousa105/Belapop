import { ADM_MOCK_USERS } from "@/lib/adm/auth/mock-users";
import {
  applyDateRange,
  applySearch,
  applySort,
  normalizeListQuery,
  toDetailResponse,
  toListResponse
} from "@/lib/adm/repositories/base";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type {
  ActivityLog,
  AuditTrailEntry,
  DetailResponse,
  InternalUser,
  ListQueryParams,
  ListResponse
} from "@/types/adm";

export type ActivityLogListItem = {
  id: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  actionType: string;
  actionLabel: string;
  status: AuditTrailEntry["status"];
  createdAt: string;
  summary?: string;
  contextPathname?: string;
};

export type ActivityLogDetailItem = ActivityLogListItem & {
  before?: AuditTrailEntry["before"];
  after?: AuditTrailEntry["after"];
  metadata?: AuditTrailEntry["metadata"];
};

const getUserMap = (data: Awaited<ReturnType<typeof getAdmDataSource>>) =>
  Object.fromEntries(
    [
      ...data.internalUsers.map((user) => ({ id: user.id, name: user.name })),
      ...ADM_MOCK_USERS.map((user) => ({ id: user.id, name: user.name }))
    ].map((user) => [user.id, user])
  );

const toLegacyAuditEntry = (activity: ActivityLog): AuditTrailEntry => ({
  id: activity.id,
  userId: activity.userId,
  entityType: activity.entityType,
  entityId: activity.entityId,
  actionType: `legacy.${activity.entityType}`,
  actionLabel: activity.action,
  status: activity.status,
  createdAt: activity.createdAt
});

const getCombinedAuditTrail = (data: Awaited<ReturnType<typeof getAdmDataSource>>) => {
  const trailById = new Map<string, AuditTrailEntry>(
    data.auditTrail.map((entry) => [entry.id, entry])
  );

  data.activityLogs.forEach((activity) => {
    if (!trailById.has(activity.id)) {
      trailById.set(activity.id, toLegacyAuditEntry(activity));
    }
  });

  return Array.from(trailById.values());
};

const withRelations = (
  entry: AuditTrailEntry,
  data: Awaited<ReturnType<typeof getAdmDataSource>>
): ActivityLogDetailItem => {
  const userMap = getUserMap(data);

  return {
    id: entry.id,
    userId: entry.userId,
    userName: userMap[entry.userId]?.name ?? "Usuario removido",
    entityType: entry.entityType,
    entityId: entry.entityId,
    actionType: entry.actionType,
    actionLabel: entry.actionLabel,
    status: entry.status,
    createdAt: entry.createdAt,
    summary: entry.summary,
    contextPathname: entry.contextPathname,
    before: entry.before,
    after: entry.after,
    metadata: entry.metadata
  };
};

export const activitiesRepository = {
  async listActivities(params: ListQueryParams): Promise<ListResponse<ActivityLogListItem>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 12,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc"
    });

    let rows = getCombinedAuditTrail(adminMockData).map((entry) => withRelations(entry, adminMockData));

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.user) rows = rows.filter((row) => row.userId === query.user);
    if (query.entity) rows = rows.filter((row) => row.entityType === query.entity);
    if (query.action) rows = rows.filter((row) => row.actionType === query.action);
    rows = applyDateRange(rows, query.dateRange, (row) => row.createdAt);

    rows = applySearch(rows, query.q, (row) =>
      [
        row.id,
        row.userId,
        row.userName,
        row.actionType,
        row.actionLabel,
        row.summary,
        row.entityType,
        row.entityId,
        row.contextPathname
      ]
        .filter(Boolean)
        .join(" ")
    );

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      createdAt: (row) => row.createdAt,
      user: (row) => row.userName,
      action: (row) => row.actionLabel,
      entity: (row) => row.entityType,
      status: (row) => row.status
    });

    const partial = rows.some((row) => row.userName === "Usuario removido");
    return toListResponse(rows, query.page, query.pageSize, partial);
  },

  async getActivityById(activityId: string): Promise<DetailResponse<ActivityLogDetailItem>> {
    const adminMockData = await getAdmDataSource();
    const activity = getCombinedAuditTrail(adminMockData).find((row) => row.id === activityId);
    if (!activity) return toDetailResponse<ActivityLogDetailItem>(null);

    const related = withRelations(activity, adminMockData);
    return toDetailResponse(related, related.userName === "Usuario removido");
  },

  async listInternalUsers(params: ListQueryParams): Promise<ListResponse<InternalUser>> {
    const adminMockData = await getAdmDataSource();
    const query = normalizeListQuery(params, {
      defaultPageSize: 20,
      defaultSortBy: "lastAccessAt",
      defaultSortDir: "desc"
    });

    let rows = [...adminMockData.internalUsers];

    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.user) rows = rows.filter((row) => row.id === query.user);
    rows = applyDateRange(rows, query.dateRange, (row) => row.lastAccessAt);

    rows = applySearch(rows, query.q, (row) => `${row.id} ${row.name} ${row.area} ${row.role}`);

    rows = applySort(rows, query.sortBy, query.sortDir, {
      id: (row) => row.id,
      name: (row) => row.name,
      area: (row) => row.area,
      role: (row) => row.role,
      lastAccessAt: (row) => row.lastAccessAt,
      status: (row) => row.status
    });

    return toListResponse(rows, query.page, query.pageSize);
  }
};
