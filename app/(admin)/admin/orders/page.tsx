import { SectionFrame } from "@/components/SectionFrame";
import { fetchOrders, AdminOrderRow } from "@/lib/admin/data";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

const orderStatusLabel = (status: string) => {
  switch (status) {
    case "delivered":
      return "Entregue";
    case "shipped":
      return "Expedido";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
};

export default async function AdminOrdersPage() {
  const orders = await fetchOrders();

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Pedidos</p>
          <h1 className="font-display text-3xl text-bpBlack">Fluxo de pedidos</h1>
          <p className="text-sm text-bpGraphite/80">Visualize status, frete e comissão por pedido.</p>
        </div>
      </SectionFrame>
      <SectionFrame>
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
          {orders.length === 0 && (
            <p className="text-sm text-bpGraphite/80">Nenhum pedido registrado.</p>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}

const OrderRow = ({ order }: { order: AdminOrderRow }) => (
  <div className="rounded-2xl border border-[#F6D6E2] p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Pedido {order.id}</p>
        <h2 className="text-lg font-semibold text-bpBlackSoft">{formatPrice(order.total_cents)}</h2>
        <p className="text-xs text-bpGraphite/70">
          Criado em{" "}
          {order.created_at
            ? new Date(order.created_at).toLocaleDateString("pt-BR")
            : "—"}
        </p>
      </div>
      <StatusBadge status={orderStatusLabel(order.status)} />
    </div>
    <div className="mt-3 flex flex-wrap gap-4 text-sm text-bpGraphite/80">
      <p>Frete: {order.shipping_cents ? formatPrice(order.shipping_cents) : "—"}</p>
      <p>Comissão: {formatPrice(order.commission_cents ?? 0)}</p>
    </div>
  </div>
);
