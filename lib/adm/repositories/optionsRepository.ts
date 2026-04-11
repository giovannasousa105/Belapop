import { titleCase } from "@/lib/adm/format";
import { ADM_MOCK_USERS } from "@/lib/adm/auth/mock-users";
import { toOptions } from "@/lib/adm/repositories/base";
import { admDataSource as adminMockData } from "@/lib/adm/repositories/source";
import type { FilterOption } from "@/types/adm";

const STATUS_VALUES = [
  "aprovado",
  "em-revisao",
  "pendente",
  "reprovado",
  "critico",
  "alerta",
  "resolvido",
  "bloqueado",
  "premium",
  "destaque"
] as const;

const PRIORITY_VALUES = ["baixa", "media", "alta", "critica"] as const;

const PERIOD_VALUES = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" }
] as const;

const getActivityTrailOptions = () => {
  const mappedTrail = adminMockData.auditTrail.map((entry) => ({
    id: entry.id,
    actionType: entry.actionType,
    actionLabel: entry.actionLabel,
    entityType: entry.entityType
  }));

  const legacyFallback = adminMockData.activityLogs
    .filter((activity) => !mappedTrail.some((entry) => entry.id === activity.id))
    .map((activity) => ({
      id: activity.id,
      actionType: `legacy.${activity.entityType}`,
      actionLabel: activity.action,
      entityType: activity.entityType
    }));

  return [...mappedTrail, ...legacyFallback];
};

export const optionsRepository = {
  listStatusOptions: (): FilterOption[] =>
    STATUS_VALUES.map((value) => ({ value, label: titleCase(value) })),
  listPriorityOptions: (): FilterOption[] =>
    PRIORITY_VALUES.map((value) => ({ value, label: titleCase(value) })),
  listPeriodOptions: (): FilterOption[] =>
    PERIOD_VALUES.map((period) => ({ value: period.value, label: period.label })),
  listSellerOptions: (): FilterOption[] =>
    toOptions(adminMockData.sellers.map((seller) => ({ value: seller.id, label: seller.name }))),
  listCategoryOptions: (): FilterOption[] =>
    toOptions(adminMockData.products.map((product) => ({ value: product.category }))),
  listRiskOptions: (): FilterOption[] =>
    PRIORITY_VALUES.map((value) => ({ value, label: titleCase(value) })),
  listInternalUserOptions: (): FilterOption[] =>
    toOptions(adminMockData.internalUsers.map((user) => ({ value: user.id, label: user.name }))),
  listActivityActorOptions: (): FilterOption[] =>
    toOptions([
      ...adminMockData.internalUsers.map((user) => ({ value: user.id, label: user.name })),
      ...ADM_MOCK_USERS.map((user) => ({ value: user.id, label: user.name }))
    ]),
  listActivityActionOptions: (): FilterOption[] =>
    toOptions(
      getActivityTrailOptions().map((entry) => ({
        value: entry.actionType,
        label: entry.actionLabel
      }))
    ),
  listActivityEntityOptions: (): FilterOption[] =>
    toOptions(
      getActivityTrailOptions().map((entry) => ({
        value: entry.entityType,
        label: titleCase(entry.entityType)
      }))
    )
};
