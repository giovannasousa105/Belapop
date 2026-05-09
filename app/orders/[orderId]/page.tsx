import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { orderId } = await params;
  redirect(`/pedido/${orderId}`);
}
