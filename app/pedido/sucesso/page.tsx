import { redirect } from "next/navigation";

import { buildLoginHref } from "@/lib/auth/redirects";
import { requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

export default async function PedidoSucessoPage() {
  await requireRole(["client"], {
    redirectTo: buildLoginHref("/pedido/sucesso")
  });

  redirect("/conta/pedidos?checkout=confirmado");
}
