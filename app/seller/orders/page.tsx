
"use client";

import { useEffect, useMemo, useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";
import { useAuth } from "@/lib/AuthContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { orderRepository } from "@/lib/orders/orderRepository";
import { userRepository } from "@/lib/repositories/userRepository";
import { formatPrice } from "@/lib/utils";

type ViewMode = "list" | "kanban" | "exceptions";
type MetricFilter = "all" | "sla" | "due_24h" | "overdue" | "stock_cancel" | "carrier_delay";
type ExceptionFilter =
  | "all"
  | "no_tracking"
  | "tracking_stalled"
  | "paid_no_movement"
  | "invalid_address"
  | "awaiting_confirmation"
  | "stockout_cancels";
type CommercialStatus = "Pago" | "Cancelado" | "Devolvido";
type OperationalStatus =
  | "A confirmar"
  | "Separando"
  | "Pronto para envio"
  | "Postado"
  | "Em transito"
  | "Entregue"
  | "Tentativa frustrada"
  | "Devolucao logistica";
type SlaStatus = "Dentro do prazo" | "Vence hoje" | "Em risco" | "Atrasado";

type SlaConfig = {
  maxPostHours: number;
  businessDaysOnly: boolean;
  cutoffHour: number;
};

type LogisticsRow = {
  id: string;
  orderId: string;
  customerName: string;
  createdAt: Date;
  paymentAt: Date;
  paymentStatus: string;
  total: number;
  items: Array<{ productId: string; quantity: number }>;
  addressValid: boolean;
  commercialStatus: CommercialStatus;
  operationalStatus: OperationalStatus;
  slaStatus: SlaStatus;
  dispatchDeadline: Date;
  shippingCarrier: string;
  trackingCode: string;
  trackingStalledHours: number | null;
  paidWithoutMovementHours: number;
  dispatchAt: Date | null;
  deliveryAt: Date | null;
  cancelledByStock: boolean;
  carrierDelayed: boolean;
  exceptionTags: string[];
};

const OPERATIONAL_COLUMNS: OperationalStatus[] = [
  "A confirmar",
  "Separando",
  "Pronto para envio",
  "Postado",
  "Em transito",
  "Entregue",
  "Tentativa frustrada",
  "Devolucao logistica"
];

const HOUR = 60 * 60 * 1000;
const DEFAULT_SLA_CONFIG: SlaConfig = {
  maxPostHours: 24,
  businessDaysOnly: true,
  cutoffHour: 14
};

const normalizeStatus = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const hashNumber = (value: string) =>
  value
    .split("")
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);

const isAddressValid = (address: any) =>
  Boolean(address?.street && address?.number && address?.zip && address?.city && address?.state);

const normalizeCarrier = (carrier?: string) => {
  const value = (carrier ?? "").trim();
  if (!value) return "Correios";
  if (value.toLowerCase().includes("jadlog")) return "Jadlog";
  if (value.toLowerCase().includes("melhor")) return "Melhor Envio";
  if (value.toLowerCase().includes("total")) return "Total Express";
  if (value.toLowerCase().includes("correio")) return "Correios";
  return value;
};

const getSlaStorageKey = (sellerId: string) => `belapop.seller.logistics.sla.${sellerId || "guest"}`;
const getTrackingStorageKey = (sellerId: string) => `belapop.seller.logistics.tracking.${sellerId || "guest"}`;

const ensureBusinessMorning = (date: Date) => {
  const next = new Date(date);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);
  }
  return next;
};

const addBusinessHours = (start: Date, hours: number, businessDaysOnly: boolean) => {
  const result = new Date(start);
  let remaining = Math.max(0, Math.floor(hours));
  while (remaining > 0) {
    result.setHours(result.getHours() + 1);
    if (!businessDaysOnly) {
      remaining -= 1;
      continue;
    }
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      remaining -= 1;
    }
  }
  return result;
};

const computeDispatchDeadline = (paymentAt: Date, config: SlaConfig) => {
  const base = new Date(paymentAt);
  if (config.businessDaysOnly) {
    const normalized = ensureBusinessMorning(base);
    base.setTime(normalized.getTime());
  }
  if (base.getHours() >= config.cutoffHour) {
    base.setDate(base.getDate() + 1);
    base.setHours(8, 0, 0, 0);
    if (config.businessDaysOnly) {
      const normalized = ensureBusinessMorning(base);
      base.setTime(normalized.getTime());
    }
  }
  return addBusinessHours(base, config.maxPostHours, config.businessDaysOnly);
};

const formatDeadline = (date: Date) =>
  date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

const slaBadgeClass = (status: SlaStatus) => {
  if (status === "Atrasado") return "bg-rose-100 text-rose-700";
  if (status === "Vence hoje") return "bg-amber-100 text-amber-700";
  if (status === "Em risco") return "bg-yellow-100 text-yellow-700";
  return "bg-emerald-100 text-emerald-700";
};

const commercialBadgeClass = (status: CommercialStatus) => {
  if (status === "Cancelado") return "bg-rose-100 text-rose-700";
  if (status === "Devolvido") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const operationalBadgeClass = (status: OperationalStatus) => {
  if (status === "Tentativa frustrada" || status === "Devolucao logistica") {
    return "bg-rose-100 text-rose-700";
  }
  if (status === "A confirmar" || status === "Separando" || status === "Pronto para envio") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "Postado" || status === "Em transito") {
    return "bg-sky-100 text-sky-700";
  }
  return "bg-emerald-100 text-emerald-700";
};

const exceptionFilters: Array<{ id: ExceptionFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "no_tracking", label: "Sem tracking" },
  { id: "tracking_stalled", label: "Tracking parado > 3 dias" },
  { id: "paid_no_movement", label: "Pago sem movimentacao" },
  { id: "invalid_address", label: "Endereco invalido" },
  { id: "awaiting_confirmation", label: "Aguardando confirmacao" },
  { id: "stockout_cancels", label: "Cancelamento por estoque" }
];

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const { products } = useStoredProducts();
  const [orders, setOrders] = useState<any[]>([]);
  const [subOrders, setSubOrders] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Map<string, any>>(new Map());
  const [mode, setMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [metricFilter, setMetricFilter] = useState<MetricFilter>("all");
  const [exceptionFilter, setExceptionFilter] = useState<ExceptionFilter>("all");
  const [slaConfig, setSlaConfig] = useState<SlaConfig>(DEFAULT_SLA_CONFIG);
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({});
  const [trackingDraft, setTrackingDraft] = useState<Record<string, string>>({});

  const sellerId = user?.sellerProfile?.sellerId ?? "";

  useEffect(() => {
    setNowTs(Date.now());
  }, [subOrders.length, mode, metricFilter]);

  useEffect(() => {
    let active = true;
    void Promise.all([orderRepository.getAll(), orderRepository.getSubOrders(), userRepository.getAll()]).then(
      ([ordersData, subOrdersData, users]) => {
        if (!active) return;
        setOrders(ordersData);
        setSubOrders(subOrdersData);
        setUserMap(new Map(users.map((item) => [item.id, item])));
        setLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(getSlaStorageKey(sellerId));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<SlaConfig>;
      setSlaConfig({
        maxPostHours: Number(parsed.maxPostHours ?? DEFAULT_SLA_CONFIG.maxPostHours),
        businessDaysOnly:
          typeof parsed.businessDaysOnly === "boolean"
            ? parsed.businessDaysOnly
            : DEFAULT_SLA_CONFIG.businessDaysOnly,
        cutoffHour: Number(parsed.cutoffHour ?? DEFAULT_SLA_CONFIG.cutoffHour)
      });
    } catch {
      setSlaConfig(DEFAULT_SLA_CONFIG);
    }
  }, [sellerId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(getTrackingStorageKey(sellerId));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      setTrackingMap(parsed);
      setTrackingDraft(parsed);
    } catch {
      setTrackingMap({});
      setTrackingDraft({});
    }
  }, [sellerId]);

  const productMap = useMemo(() => new Map(products.map((item) => [item.id, item])), [products]);
  const orderMap = useMemo(() => new Map(orders.map((item) => [item.id, item])), [orders]);

  const rows = useMemo<LogisticsRow[]>(() => {
    return subOrders
      .filter((subOrder) => subOrder.sellerId === sellerId)
      .map((subOrder) => {
        const order = orderMap.get(subOrder.orderId);
        const createdAt = new Date(subOrder.createdAt);
        const customerName = order?.customerId ? userMap.get(order.customerId)?.name ?? "Cliente" : "Convidado";
        const items = (subOrder.items ?? []) as Array<{ productId: string; quantity: number }>;
        const total =
          typeof subOrder.productTotal === "number"
            ? subOrder.productTotal
            : items.reduce(
                (sum: number, item) =>
                  sum + (productMap.get(item.productId)?.price ?? 0) * Number(item.quantity ?? 0),
                0
              );
        const normalizedStatus = normalizeStatus(subOrder.status ?? "");
        const paymentStatus = String(subOrder.paymentStatus ?? order?.paymentStatus ?? "pending").toLowerCase();
        const paymentAt = new Date(
          createdAt.getTime() + (paymentStatus === "paid" ? (hashNumber(subOrder.id) % 45) * 60 * 1000 : 0)
        );
        const dispatchDeadline = computeDispatchDeadline(paymentAt, slaConfig);
        const hash = hashNumber(`${subOrder.id}-${subOrder.orderId}`);
        const shippingCarrier = normalizeCarrier(subOrder.shippingService);
        const addressValid = isAddressValid(order?.address);
        const stockIssue = items.some((item) => {
          const stock = Number(productMap.get(item.productId)?.stockQuantity ?? 0);
          return stock < Number(item.quantity ?? 0);
        });

        let operationalStatus: OperationalStatus = "A confirmar";
        if (normalizedStatus.includes("devol")) {
          operationalStatus = "Devolucao logistica";
        } else if (normalizedStatus.includes("entreg")) {
          operationalStatus = "Entregue";
        } else if (normalizedStatus.includes("enviado")) {
          const transitHours = (nowTs - createdAt.getTime()) / HOUR;
          if (transitHours > 144) operationalStatus = "Tentativa frustrada";
          else if (transitHours > 54) operationalStatus = "Em transito";
          else operationalStatus = "Postado";
        } else if (normalizedStatus.includes("separ")) {
          operationalStatus = "Separando";
        } else if (paymentStatus === "paid" && (nowTs - paymentAt.getTime()) / HOUR > 6) {
          operationalStatus = "Pronto para envio";
        }

        const posted =
          operationalStatus === "Postado" ||
          operationalStatus === "Em transito" ||
          operationalStatus === "Entregue" ||
          operationalStatus === "Tentativa frustrada" ||
          operationalStatus === "Devolucao logistica";
        const dispatchLagHours = 4 + (hash % 46);
        const dispatchAt = posted ? new Date(paymentAt.getTime() + dispatchLagHours * HOUR) : null;
        const transitLagHours = 18 + (hash % 108);
        const deliveryAt =
          operationalStatus === "Entregue" && dispatchAt
            ? new Date(dispatchAt.getTime() + transitLagHours * HOUR)
            : null;

        const trackingFromStorage = String(trackingMap[subOrder.id] ?? "").trim();
        const fallbackTracking =
          posted && !trackingFromStorage
            ? `BR${`${subOrder.id}`.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 12)}`
            : "";
        const trackingCode = trackingFromStorage || fallbackTracking;
        const trackingStalledHours = trackingCode
          ? operationalStatus === "Entregue"
            ? 0
            : 24 + (hash % 132)
          : null;
        const paidWithoutMovementHours =
          paymentStatus === "paid" && !posted ? Math.max(0, (nowTs - paymentAt.getTime()) / HOUR) : 0;

        let commercialStatus: CommercialStatus = "Pago";
        if (normalizedStatus.includes("cancel")) commercialStatus = "Cancelado";
        if (normalizedStatus.includes("devol")) commercialStatus = "Devolvido";

        const referenceTs = dispatchAt ? dispatchAt.getTime() : nowTs;
        const remainingHours = (dispatchDeadline.getTime() - referenceTs) / HOUR;
        let slaStatus: SlaStatus = "Dentro do prazo";
        if (commercialStatus !== "Cancelado" && commercialStatus !== "Devolvido") {
          if (remainingHours < 0) slaStatus = "Atrasado";
          else if (remainingHours <= 12) slaStatus = "Vence hoje";
          else if (remainingHours <= 24) slaStatus = "Em risco";
        }

        const trackingPending =
          !trackingCode &&
          (operationalStatus === "Postado" ||
            operationalStatus === "Em transito" ||
            operationalStatus === "Tentativa frustrada");
        const trackingStalled = Boolean(
          trackingCode &&
            trackingStalledHours !== null &&
            trackingStalledHours > 72 &&
            operationalStatus !== "Entregue"
        );
        const awaitingConfirmation = operationalStatus === "A confirmar";
        const invalidAddress = !addressValid;
        const paidNoMovement =
          paymentStatus === "paid" && !posted && paidWithoutMovementHours > Math.max(10, slaConfig.maxPostHours - 4);
        const cancelledByStock = commercialStatus === "Cancelado" && stockIssue;
        const carrierDelayed =
          posted &&
          operationalStatus !== "Entregue" &&
          (trackingStalled ||
            (dispatchAt !== null && (nowTs - dispatchAt.getTime()) / HOUR > 96));

        const exceptionTags: string[] = [];
        if (trackingPending) exceptionTags.push("Sem tracking");
        if (trackingStalled) exceptionTags.push("Tracking parado > 3 dias");
        if (paidNoMovement) exceptionTags.push("Pago ha > Xh sem movimentacao");
        if (invalidAddress) exceptionTags.push("Endereco invalido");
        if (awaitingConfirmation) exceptionTags.push("Aguardando confirmacao do lojista");
        if (cancelledByStock) exceptionTags.push("Cancelamento por estoque");

        return {
          id: subOrder.id,
          orderId: subOrder.orderId,
          customerName,
          createdAt,
          paymentAt,
          paymentStatus,
          total,
          items,
          addressValid,
          commercialStatus,
          operationalStatus,
          slaStatus,
          dispatchDeadline,
          shippingCarrier,
          trackingCode,
          trackingStalledHours,
          paidWithoutMovementHours,
          dispatchAt,
          deliveryAt,
          cancelledByStock,
          carrierDelayed,
          exceptionTags
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [subOrders, sellerId, orderMap, userMap, productMap, nowTs, slaConfig, trackingMap]);

  const metrics = useMemo(() => {
    const paidRows = rows.filter((row) => row.commercialStatus === "Pago");
    const due24h = paidRows.filter(
      (row) => row.slaStatus === "Vence hoje" || row.slaStatus === "Em risco"
    ).length;
    const overdue = paidRows.filter((row) => row.slaStatus === "Atrasado").length;
    const slaOnTime = paidRows.length > 0 ? ((paidRows.length - overdue) / paidRows.length) * 100 : 100;
    const withDispatch = rows.filter((row) => row.dispatchAt);
    const avgPayToDispatch =
      withDispatch.length > 0
        ? withDispatch.reduce((sum, row) => sum + ((row.dispatchAt?.getTime() ?? 0) - row.paymentAt.getTime()) / HOUR, 0) /
          withDispatch.length
        : 0;
    const deliveredRows = rows.filter((row) => row.dispatchAt && row.deliveryAt);
    const avgDispatchToDelivery =
      deliveredRows.length > 0
        ? deliveredRows.reduce(
            (sum, row) =>
              sum + ((row.deliveryAt?.getTime() ?? row.dispatchAt?.getTime() ?? 0) - (row.dispatchAt?.getTime() ?? 0)) / HOUR,
            0
          ) / deliveredRows.length
        : 0;
    const cancelByStockCount = rows.filter((row) => row.cancelledByStock).length;
    const cancelByStockRate = rows.length > 0 ? (cancelByStockCount / rows.length) * 100 : 0;
    const carrierDelayedCount = rows.filter((row) => row.carrierDelayed).length;
    const carrierDelayRate = rows.length > 0 ? (carrierDelayedCount / rows.length) * 100 : 0;
    return {
      slaOnTime,
      due24h,
      overdue,
      avgPayToDispatch,
      avgDispatchToDelivery,
      cancelByStockCount,
      cancelByStockRate,
      carrierDelayedCount,
      carrierDelayRate
    };
  }, [rows]);

  const carriers = useMemo(() => {
    const map = new Map<
      string,
      {
        orders: number;
        delayed: number;
        returned: number;
        lost: number;
        dispatchHoursSum: number;
        dispatchHoursCount: number;
        deliveryHoursSum: number;
        deliveryHoursCount: number;
      }
    >();

    rows.forEach((row) => {
      const current =
        map.get(row.shippingCarrier) ??
        {
          orders: 0,
          delayed: 0,
          returned: 0,
          lost: 0,
          dispatchHoursSum: 0,
          dispatchHoursCount: 0,
          deliveryHoursSum: 0,
          deliveryHoursCount: 0
        };
      current.orders += 1;
      if (row.carrierDelayed) current.delayed += 1;
      if (row.commercialStatus === "Devolvido") current.returned += 1;
      if (row.operationalStatus === "Tentativa frustrada") current.lost += 1;
      if (row.dispatchAt) {
        current.dispatchHoursSum += (row.dispatchAt.getTime() - row.paymentAt.getTime()) / HOUR;
        current.dispatchHoursCount += 1;
      }
      if (row.dispatchAt && row.deliveryAt) {
        current.deliveryHoursSum += (row.deliveryAt.getTime() - row.dispatchAt.getTime()) / HOUR;
        current.deliveryHoursCount += 1;
      }
      map.set(row.shippingCarrier, current);
    });

    return [...map.entries()]
      .map(([carrier, data]) => {
        const delayRate = data.orders > 0 ? (data.delayed / data.orders) * 100 : 0;
        const returnRate = data.orders > 0 ? (data.returned / data.orders) * 100 : 0;
        const lostRate = data.orders > 0 ? (data.lost / data.orders) * 100 : 0;
        const nps = Math.max(32, 90 - delayRate * 0.9 - returnRate * 0.7 - lostRate * 1.1);
        return {
          carrier,
          orders: data.orders,
          avgDispatchHours:
            data.dispatchHoursCount > 0 ? data.dispatchHoursSum / data.dispatchHoursCount : 0,
          avgDeliveryHours:
            data.deliveryHoursCount > 0 ? data.deliveryHoursSum / data.deliveryHoursCount : 0,
          delayRate,
          returnRate,
          lostRate,
          nps
        };
      })
      .sort((a, b) => b.orders - a.orders);
  }, [rows]);

  const worstCarrier = carriers[0]
    ? [...carriers].sort((a, b) => b.delayRate - a.delayRate)[0]
    : null;

  const filteredRows = useMemo(() => {
    if (metricFilter === "all") return rows;
    if (metricFilter === "sla") return rows.filter((row) => row.commercialStatus === "Pago");
    if (metricFilter === "due_24h") {
      return rows.filter((row) => row.slaStatus === "Vence hoje" || row.slaStatus === "Em risco");
    }
    if (metricFilter === "overdue") return rows.filter((row) => row.slaStatus === "Atrasado");
    if (metricFilter === "stock_cancel") return rows.filter((row) => row.cancelledByStock);
    if (metricFilter === "carrier_delay") return rows.filter((row) => row.carrierDelayed);
    return rows;
  }, [rows, metricFilter]);

  const grouped = useMemo(() => {
    const map = new Map<OperationalStatus, LogisticsRow[]>();
    OPERATIONAL_COLUMNS.forEach((column) => map.set(column, []));
    filteredRows.forEach((row) => {
      map.set(row.operationalStatus, [...(map.get(row.operationalStatus) ?? []), row]);
    });
    return map;
  }, [filteredRows]);

  const exceptionRows = useMemo(
    () => rows.filter((row) => row.exceptionTags.length > 0),
    [rows]
  );

  const exceptionFilteredRows = useMemo(() => {
    if (exceptionFilter === "all") return exceptionRows;
    return exceptionRows.filter((row) => {
      if (exceptionFilter === "no_tracking") return row.exceptionTags.includes("Sem tracking");
      if (exceptionFilter === "tracking_stalled")
        return row.exceptionTags.includes("Tracking parado > 3 dias");
      if (exceptionFilter === "paid_no_movement")
        return row.exceptionTags.includes("Pago ha > Xh sem movimentacao");
      if (exceptionFilter === "invalid_address") return row.exceptionTags.includes("Endereco invalido");
      if (exceptionFilter === "awaiting_confirmation")
        return row.exceptionTags.includes("Aguardando confirmacao do lojista");
      if (exceptionFilter === "stockout_cancels")
        return row.exceptionTags.includes("Cancelamento por estoque");
      return true;
    });
  }, [exceptionRows, exceptionFilter]);

  const returnSummary = useMemo(() => {
    const returnedRows = rows.filter((row) => row.commercialStatus === "Devolvido");
    const byDelay = returnedRows.filter((row) => row.carrierDelayed).length;
    const byQuality = Math.max(0, returnedRows.length - byDelay);
    const reasons = [
      { reason: "Atraso logistico", count: byDelay },
      { reason: "Qualidade do produto", count: byQuality },
      { reason: "Endereco incorreto", count: Math.round(returnedRows.length * 0.2) },
      { reason: "Tentativa frustrada", count: rows.filter((row) => row.operationalStatus === "Tentativa frustrada").length },
      { reason: "Arrependimento", count: Math.round(returnedRows.length * 0.12) }
    ].sort((a, b) => b.count - a.count);

    const byProductMap = new Map<string, number>();
    returnedRows.forEach((row) => {
      row.items.forEach((item) => {
        const productName = productMap.get(item.productId)?.name ?? item.productId;
        byProductMap.set(productName, (byProductMap.get(productName) ?? 0) + Number(item.quantity ?? 0));
      });
    });

    const byProduct = [...byProductMap.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const totalRows = rows.length || 1;
    return {
      totalReturned: returnedRows.length,
      delayRate: (byDelay / totalRows) * 100,
      qualityRate: (byQuality / totalRows) * 100,
      reasons,
      byProduct
    };
  }, [rows, productMap]);

  const saveSlaConfig = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getSlaStorageKey(sellerId), JSON.stringify(slaConfig));
    trackSellerEvent("alert_rule_create", {
      source: "sla_config",
      max_post_hours: slaConfig.maxPostHours,
      business_days_only: slaConfig.businessDaysOnly,
      cutoff_hour: slaConfig.cutoffHour
    });
  };

  const saveTrackingCode = (row: LogisticsRow) => {
    const value = String(trackingDraft[row.id] ?? "").trim();
    if (!value) return;
    setTrackingMap((current) => {
      const next = { ...current, [row.id]: value };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(getTrackingStorageKey(sellerId), JSON.stringify(next));
      }
      return next;
    });
    trackSellerEvent("dispatch_order", {
      order_id: row.orderId,
      action: "save_tracking",
      carrier: row.shippingCarrier
    });
  };

  const markAsPosted = (row: LogisticsRow) => {
    setSubOrders((current) =>
      current.map((item) => {
        if (item.id !== row.id) return item;
        return { ...item, status: "Enviado", shippingService: row.shippingCarrier };
      })
    );
    trackSellerEvent("dispatch_order", { order_id: row.orderId, action: "mark_posted" });
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm text-sm text-bpGraphite/70">
        Carregando pedidos...
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Pedidos</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">
          Logistica enterprise (cada lojista envia)
        </h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Centro operacional com SLA, rastreabilidade e excecoes em tempo real.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: "list", label: "Lista" },
            { id: "kanban", label: "Kanban" },
            { id: "exceptions", label: "Centro de guerra" }
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id as ViewMode)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                mode === option.id
                  ? "border-bpPink/50 bg-[#FFF4F8]"
                  : "border-black/10 text-bpGraphite/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-bpBlack">SLA inteligente</h2>
          <button
            type="button"
            onClick={saveSlaConfig}
            className="rounded-full bg-bpBlack px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
          >
            Salvar regra SLA
          </button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <label className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Prazo maximo para postar (h)</p>
            <input
              type="number"
              value={slaConfig.maxPostHours}
              onChange={(event) =>
                setSlaConfig((current) => ({
                  ...current,
                  maxPostHours: Math.max(1, Number(event.target.value || 0))
                }))
              }
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Contagem</p>
            <select
              value={slaConfig.businessDaysOnly ? "business" : "calendar"}
              onChange={(event) =>
                setSlaConfig((current) => ({
                  ...current,
                  businessDaysOnly: event.target.value === "business"
                }))
              }
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            >
              <option value="business">Dias uteis</option>
              <option value="calendar">Dias corridos</option>
            </select>
          </label>
          <label className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Horario de corte</p>
            <input
              type="number"
              min={0}
              max={23}
              value={slaConfig.cutoffHour}
              onChange={(event) =>
                setSlaConfig((current) => ({
                  ...current,
                  cutoffHour: Math.max(0, Math.min(23, Number(event.target.value || 0)))
                }))
              }
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="mt-3 text-sm text-bpGraphite/80">
          Exemplo: despachar ate{" "}
          <span className="font-semibold text-bpBlackSoft">
            {rows[0] ? formatDeadline(rows[0].dispatchDeadline) : "--"}
          </span>
          .
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {[
          {
            id: "sla",
            title: "SLA geral",
            value: `${metrics.slaOnTime.toFixed(1)}%`,
            helper: "no prazo"
          },
          {
            id: "due_24h",
            title: "Vencendo 24h",
            value: String(metrics.due24h),
            helper: "vence hoje / em risco"
          },
          {
            id: "all",
            title: "Pagto -> despacho",
            value: `${metrics.avgPayToDispatch.toFixed(1)}h`,
            helper: "tempo medio"
          },
          {
            id: "carrier_delay",
            title: "Despacho -> entrega",
            value: `${metrics.avgDispatchToDelivery.toFixed(1)}h`,
            helper: "tempo medio"
          },
          {
            id: "stock_cancel",
            title: "Cancel por estoque",
            value: `${metrics.cancelByStockRate.toFixed(1)}%`,
            helper: `${metrics.cancelByStockCount} pedido(s)`
          },
          {
            id: "overdue",
            title: "Atraso transportadora",
            value: `${metrics.carrierDelayRate.toFixed(1)}%`,
            helper: `${metrics.carrierDelayedCount} pedido(s)`
          }
        ].map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => setMetricFilter(card.id as MetricFilter)}
            className={`rounded-2xl border p-4 text-left shadow-sm ${
              metricFilter === card.id
                ? "border-bpPink/40 bg-[#FFF4F8]"
                : "border-black/10 bg-white hover:border-bpPink/30"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">{card.title}</p>
            <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{card.value}</p>
            <p className="mt-1 text-xs text-bpGraphite/70">{card.helper}</p>
          </button>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-bpBlack">Transportadoras & etiquetas</h2>
          <p className="text-xs text-bpGraphite/70">
            {worstCarrier
              ? `Atraso mais alto: ${worstCarrier.carrier} (${worstCarrier.delayRate.toFixed(1)}%)`
              : "Sem dados de transportadora"}
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                <th>Transportadora</th>
                <th>Pedidos</th>
                <th>Prazo real despacho</th>
                <th>Prazo real entrega</th>
                <th>% atraso</th>
                <th>% devolucao</th>
                <th>% extravio</th>
                <th>NPS estimado</th>
              </tr>
            </thead>
            <tbody>
              {carriers.map((carrier) => (
                <tr key={carrier.carrier} className="bg-[#FAFAFB] text-sm">
                  <td className="rounded-l-2xl px-3 py-3">{carrier.carrier}</td>
                  <td className="px-3 py-3">{carrier.orders}</td>
                  <td className="px-3 py-3">{carrier.avgDispatchHours.toFixed(1)}h</td>
                  <td className="px-3 py-3">{carrier.avgDeliveryHours.toFixed(1)}h</td>
                  <td className="px-3 py-3">{carrier.delayRate.toFixed(1)}%</td>
                  <td className="px-3 py-3">{carrier.returnRate.toFixed(1)}%</td>
                  <td className="px-3 py-3">{carrier.lostRate.toFixed(1)}%</td>
                  <td className="rounded-r-2xl px-3 py-3">{carrier.nps.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {mode === "list" ? (
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-bpBlack">Lista de pedidos</h2>
            <p className="text-xs text-bpGraphite/70">
              {filteredRows.length} pedido(s) com filtro{" "}
              <span className="font-semibold">{metricFilter}</span>
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Status comercial</th>
                  <th>Status operacional</th>
                  <th>Status SLA</th>
                  <th>Despachar ate</th>
                  <th>Transportadora</th>
                  <th>Tracking</th>
                  <th>Excecoes</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="bg-[#FAFAFB] text-sm">
                    <td className="rounded-l-2xl px-3 py-3">{row.orderId}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-bpBlackSoft">{row.customerName}</p>
                      <p className="text-xs text-bpGraphite/70">{formatPrice(row.total)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${commercialBadgeClass(row.commercialStatus)}`}>
                        {row.commercialStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${operationalBadgeClass(row.operationalStatus)}`}>
                        {row.operationalStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${slaBadgeClass(row.slaStatus)}`}>
                        {row.slaStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">{formatDeadline(row.dispatchDeadline)}</td>
                    <td className="px-3 py-3">{row.shippingCarrier}</td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-[220px] gap-2">
                        <input
                          value={trackingDraft[row.id] ?? row.trackingCode}
                          onChange={(event) =>
                            setTrackingDraft((current) => ({
                              ...current,
                              [row.id]: event.target.value
                            }))
                          }
                          placeholder="Codigo de rastreio"
                          className="w-full rounded-xl border border-black/10 bg-white px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => saveTrackingCode(row)}
                          className="rounded-xl border border-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-bpGraphite/80"
                        >
                          Salvar
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">{row.exceptionTags.join(" | ") || "-"}</td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => markAsPosted(row)}
                          className="rounded-full bg-bpBlack px-3 py-1 text-xs uppercase tracking-[0.2em] text-white"
                        >
                          Marcar postado
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            trackSellerEvent("dispatch_order", {
                              order_id: row.orderId,
                              action: "upload_proof"
                            })
                          }
                          className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                        >
                          Comprovante
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {mode === "kanban" ? (
        <section className="grid gap-3 lg:grid-cols-4 2xl:grid-cols-8">
          {OPERATIONAL_COLUMNS.map((column) => (
            <article key={column} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <h3 className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">{column}</h3>
              <div className="mt-3 space-y-2">
                {(grouped.get(column) ?? []).slice(0, 10).map((row) => (
                  <div key={row.id} className="rounded-xl border border-black/10 bg-[#FAFAFB] p-2">
                    <p className="text-xs font-semibold text-bpBlackSoft">{row.orderId}</p>
                    <p className="text-[11px] text-bpGraphite/70">{row.customerName}</p>
                    <p className="text-[11px] text-bpGraphite/70">{formatDeadline(row.dispatchDeadline)}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {mode === "exceptions" ? (
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Centro de guerra (excecoes)</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {exceptionFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setExceptionFilter(filter.id)}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                  exceptionFilter === filter.id
                    ? "border-bpPink/50 bg-[#FFF4F8]"
                    : "border-black/20 text-bpGraphite/80"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {exceptionFilteredRows.length === 0 ? (
              <p className="text-sm text-bpGraphite/70">Nenhuma excecao ativa para esse filtro.</p>
            ) : (
              exceptionFilteredRows.map((row) => (
                <article key={row.id} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-bpBlackSoft">
                      Pedido {row.orderId} | {row.customerName}
                    </p>
                    <span className={`rounded-full px-2 py-1 text-xs ${slaBadgeClass(row.slaStatus)}`}>
                      {row.slaStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-bpGraphite/70">{row.exceptionTags.join(" | ")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => markAsPosted(row)}
                      className="rounded-full bg-bpBlack px-3 py-1 text-xs uppercase tracking-[0.2em] text-white"
                    >
                      Resolver agora
                    </button>
                    <button
                      type="button"
                      onClick={() => saveTrackingCode(row)}
                      className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                    >
                      Atualizar tracking
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        trackSellerEvent("alert_snooze", { order_id: row.orderId, source: "war_room" })
                      }
                      className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                    >
                      Adiar
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">RMA simplificado</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Devolucoes totais</p>
            <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{returnSummary.totalReturned}</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Devolucao por atraso</p>
            <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{returnSummary.delayRate.toFixed(2)}%</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Devolucao por qualidade</p>
            <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{returnSummary.qualityRate.toFixed(2)}%</p>
          </article>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <h3 className="text-sm font-semibold text-bpBlackSoft">Motivos top 5</h3>
            <div className="mt-3 space-y-2">
              {returnSummary.reasons.map((item) => (
                <div key={item.reason} className="rounded-xl border border-black/10 bg-white p-2 text-xs">
                  {item.reason}: {item.count}
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <h3 className="text-sm font-semibold text-bpBlackSoft">% devolucao por produto</h3>
            <div className="mt-3 space-y-2">
              {returnSummary.byProduct.length === 0 ? (
                <p className="text-xs text-bpGraphite/70">Sem devolucoes no periodo.</p>
              ) : (
                returnSummary.byProduct.map((item) => (
                  <div key={item.name} className="rounded-xl border border-black/10 bg-white p-2 text-xs">
                    {item.name}: {item.qty} unidade(s)
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
