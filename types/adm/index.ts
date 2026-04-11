export type AdminVisualStatus =
  | "aprovado"
  | "em-revisao"
  | "pendente"
  | "reprovado"
  | "critico"
  | "alerta"
  | "resolvido"
  | "bloqueado"
  | "premium"
  | "destaque";

export type PriorityLevel = "baixa" | "media" | "alta" | "critica";
export type TimePeriod = "7d" | "30d" | "90d";
export type SortDirection = "asc" | "desc";

export interface DateRange {
  from?: string;
  to?: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface ListQueryParams {
  q?: string;
  status?: string;
  action?: string;
  entity?: string;
  campaign?: string;
  seller?: string;
  category?: string;
  period?: string;
  priority?: string;
  risk?: string;
  product?: string;
  order?: string;
  shipment?: string;
  alert?: string;
  payout?: string;
  refund?: string;
  review?: string;
  document?: string;
  user?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: SortDirection;
  dateRange?: DateRange;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ResponseError {
  code: string;
  message: string;
}

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  partial?: boolean;
  error?: ResponseError;
}

export type ListResponse<T> = ResponseEnvelope<PaginatedResult<T>>;
export type DetailResponse<T> = ResponseEnvelope<T | null>;

export interface Seller {
  id: string;
  name: string;
  category: string;
  tier: "premium" | "core";
  status: AdminVisualStatus;
  riskLevel: PriorityLevel;
  qualityScore: number;
  activeProducts: number;
  gmv30d: number;
  pendingDocuments: number;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  category: string;
  price: number;
  status: AdminVisualStatus;
  curationStatus: AdminVisualStatus;
  qualityScore: number;
  featured: boolean;
  stock: number;
}

export interface CurationStatus {
  id: string;
  productId: string;
  sellerId: string;
  status: AdminVisualStatus;
  reviewer: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  sellerId: string;
  productId: string;
  shipmentId: string;
  status: AdminVisualStatus;
  logisticsStatus: AdminVisualStatus;
  priority: PriorityLevel;
  total: number;
  createdAt: string;
  eta: string;
}

export interface LogisticsIncident {
  id: string;
  orderId: string;
  shipmentId: string;
  sellerId: string;
  status: AdminVisualStatus;
  priority: PriorityLevel;
  type: string;
  summary: string;
  openedAt: string;
  refundId?: string;
}

export interface Payout {
  id: string;
  sellerId: string;
  orderIds: string[];
  period: TimePeriod;
  grossAmount: number;
  netAmount: number;
  status: AdminVisualStatus;
  scheduledAt: string;
}

export interface Refund {
  id: string;
  orderId: string;
  sellerId: string;
  customerId: string;
  amount: number;
  reason: string;
  status: AdminVisualStatus;
  requestedAt: string;
  logisticsIncidentId?: string;
}

export interface FinancialAlert {
  id: string;
  sellerId: string;
  orderId?: string;
  payoutId?: string;
  refundId?: string;
  status: AdminVisualStatus;
  priority: PriorityLevel;
  type: string;
  summary: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  segment: "premium" | "standard";
  status: AdminVisualStatus;
  ltv: number;
  openTickets: number;
  riskFlag: boolean;
}

export interface Review {
  id: string;
  productId: string;
  sellerId: string;
  customerId: string;
  rating: number;
  status: AdminVisualStatus;
  sentiment: "positivo" | "neutro" | "negativo";
  excerpt: string;
  createdAt: string;
}

export interface Document {
  id: string;
  sellerId: string;
  type: string;
  status: AdminVisualStatus;
  dueDate: string;
  owner: string;
}

export interface CurationRule {
  id: string;
  name: string;
  scope: "claim" | "imagem" | "documento" | "logistica" | "reputacao";
  status: AdminVisualStatus;
  priority: PriorityLevel;
  owner: string;
  targetType: "product" | "seller";
  targetId: string;
  condition: string;
  action: string;
  updatedAt: string;
}

export interface ComplianceFlag {
  id: string;
  sellerId: string;
  productId?: string;
  documentId?: string;
  alertId?: string;
  type: string;
  status: AdminVisualStatus;
  priority: PriorityLevel;
  summary: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  productIds: string[];
  sellerIds: string[];
  status: AdminVisualStatus;
  period: TimePeriod;
  highlight: boolean;
  upliftPct: number;
}

export interface InternalUser {
  id: string;
  name: string;
  role: string;
  area: string;
  status: AdminVisualStatus;
  lastAccessAt: string;
}

export interface PlatformSetting {
  id: string;
  area: "financeiro" | "logistica" | "curadoria" | "seguranca";
  label: string;
  value: string;
  owner: string;
  status: AdminVisualStatus;
  linkedRoute: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  status: AdminVisualStatus;
  createdAt: string;
}

export type AuditSnapshotValue =
  | string
  | number
  | boolean
  | null
  | Array<string | number | boolean>;

export type AuditSnapshot = Record<string, AuditSnapshotValue>;

export interface AuditTrailEntry {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  actionType: string;
  actionLabel: string;
  status: AdminVisualStatus;
  createdAt: string;
  contextPathname?: string;
  summary?: string;
  before?: AuditSnapshot;
  after?: AuditSnapshot;
  metadata?: AuditSnapshot;
}

export interface QualityScore {
  id: string;
  sellerId: string;
  productId?: string;
  score: number;
  status: AdminVisualStatus;
  trend: "up" | "down" | "stable";
  updatedAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  sellerId: string;
  carrier: string;
  trackingCode: string;
  status: AdminVisualStatus;
  eta: string;
  lastUpdateAt: string;
}

export type LogisticsShipment = Shipment;

export * from "./auth";
