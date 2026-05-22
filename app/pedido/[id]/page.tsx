import { redirect } from "next/navigation";

import { buildLoginHref } from "@/lib/auth/redirects";
import { getPortalSession } from "@/lib/auth/getRole";

type PedidoDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PedidoDetalhePage({ params }: PedidoDetalhePageProps) {
  const { id } = await params;

  await getPortalSession({
    loginRedirectTo: buildLoginHref(`/pedido/${id}`)
  });

  redirect(`/conta/pedidos/${id}`);
}
