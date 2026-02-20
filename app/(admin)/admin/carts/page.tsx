import { SectionFrame } from "@/components/SectionFrame";
import { AdminCartTabs } from "@/components/AdminCartTabs";
import { markAbandonedCarts } from "@/lib/admin/carts";

export default async function AdminCartsPage() {
  await markAbandonedCarts();

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Carrinhos</p>
          <h1 className="font-display text-3xl text-bpBlack">Carrinhos abandonados</h1>
          <p className="text-sm text-bpGraphite/80">
            Visualize carrinhos ativos, abandonados e convertidos com contexto de usuário/anon ID.
          </p>
        </div>
      </SectionFrame>
      <SectionFrame>
        <AdminCartTabs />
      </SectionFrame>
    </div>
  );
}
