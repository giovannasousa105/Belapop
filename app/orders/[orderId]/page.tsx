import BelaPopOrderDetail from "@/components/BelaPopOrderDetail";

type Props = {
  params: {
    orderId: string;
  };
};

export default function OrderDetailPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-noir-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-noir-200 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Pedido BelaPop</p>
          <h1 className="text-2xl font-semibold text-noir-900">#{params.orderId}</h1>
          <p className="text-sm text-noir-600">
            Aqui você vê cada envio e parcelamento por lojista.
          </p>
        </header>
        <BelaPopOrderDetail orderId={params.orderId} />
      </div>
    </div>
  );
}
