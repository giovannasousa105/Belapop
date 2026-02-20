import BelaPopOrderDetail from "@/components/BelaPopOrderDetail";

type Props = {
  params: {
    orderId: string;
  };
};

export default function OrderDetailPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-bpOffWhite p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-bpBlack/20 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Pedido BelaPop</p>
          <h1 className="text-2xl font-semibold text-bpBlackSoft">#{params.orderId}</h1>
          <p className="text-sm text-bpGraphite/80">
            Aqui você vê cada envio e parcelamento por lojista.
          </p>
        </header>
        <BelaPopOrderDetail orderId={params.orderId} />
      </div>
    </div>
  );
}
