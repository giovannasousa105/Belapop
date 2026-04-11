import Link from "next/link";
import { redirect } from "next/navigation";

import PortalRoleSwitcher from "@/components/PortalRoleSwitcher";
import { isInternalPanelOwner } from "@/lib/auth/internalPanelOwner";
import { resolveUserRoleState } from "@/lib/auth/roleState";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PainelInternoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isInternalPanelOwner(user.email)) {
    redirect("/conta");
  }

  const roleState = await resolveUserRoleState({
    userId: user.id,
    authUser: user,
    admin: getSupabaseAdminClient()
  });

  const cards = [
    {
      title: "Painel Admin",
      description: "Curadoria, operacao, pedidos, sellers e visao executiva da BelaPop.",
      href: "/adm"
    },
    {
      title: "Painel Lojista",
      description: "Pedidos, produtos, repasse, SLA e operacao da loja ativa.",
      href: "/parceiro"
    },
    {
      title: "Painel Cliente",
      description: "Conta, pedidos, rastreio, favoritos e jornada de compra.",
      href: "/conta"
    }
  ] as const;

  return (
    <main className="min-h-screen bg-bpOffWhite px-4 py-10 text-bpBlackSoft sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] border border-[rgba(216,160,172,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.92))] p-6 shadow-[0_24px_70px_rgba(91,49,56,0.08)] sm:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">Hub interno</p>
          <h1 className="mt-3 font-display text-4xl text-bpBlack sm:text-5xl">
            Acessos BelaPop
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-bpGraphite/82 sm:text-base">
            O login com {user.email} liberou os ambientes de administracao e parceiro.
            Use os atalhos abaixo para abrir o painel desejado e alternar o papel ativo.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {roleState.assignedRoles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-bpGraphite/82"
              >
                {role}
              </span>
            ))}
          </div>

          <PortalRoleSwitcher className="mt-6 max-w-xl" compact />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_18px_40px_rgba(91,49,56,0.05)] transition hover:border-bpPinkCta/40 hover:shadow-[0_22px_50px_rgba(91,49,56,0.09)]"
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-bpGraphite/62">
                Abrir painel
              </p>
              <h2 className="mt-3 font-display text-3xl text-bpBlack">{card.title}</h2>
              <p className="mt-4 text-sm leading-7 text-bpGraphite/82">{card.description}</p>
              <span className="mt-6 inline-flex text-xs uppercase tracking-[0.24em] text-bpBlack">
                Entrar agora
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
