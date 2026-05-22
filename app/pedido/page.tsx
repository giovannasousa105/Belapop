import { redirect } from "next/navigation";

import { buildLoginHref } from "@/lib/auth/redirects";
import { getPortalSession } from "@/lib/auth/getRole";

export default async function PedidoPage() {
  await getPortalSession({
    loginRedirectTo: buildLoginHref("/pedido")
  });

  redirect("/conta/pedidos");
}
