import { SectionFrame } from "@/components/SectionFrame";
import { EmptyState } from "@/components/EmptyState";

export default async function CustomersPage() {
  // placeholder: lista vazia
  const customers: any[] = [];

  return (
    <div className="flex flex-col gap-8">
      <SectionFrame>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Clientes</p>
          <h1 className="font-display text-3xl text-noir-950">Base de clientes</h1>
          <p className="text-sm text-noir-600">Visão simples da base para consultas e export.</p>
        </div>
      </SectionFrame>

      <SectionFrame>
        {customers.length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado." description="Importe dados ou aguarde novos cadastros." />
        ) : (
          <div className="space-y-3">/* tabela aqui */</div>
        )}
      </SectionFrame>
    </div>
  );
}
