1) Objetivo

Mostrar status atual + historico cronologico do pedido dentro da BelaPop (nao mandar o usuario para sites de transportadora).

Deixar a experiencia branded (rosa & preto) e editorial.

2) Modelagem no Supabase
2.1. Status canonical do pedido (orders.status)

Use estados simples, universais:

created (pedido criado)

paid (pagamento aprovado)

processing (separando/confirmando)

shipped (enviado)

delivered (entregue)

canceled

refunded

Regra: orders.status = "ultimo estado" (rapido para listagem). O historico fica em eventos.

2.2. Nova tabela: order_events

Campos:

id uuid pk

order_id uuid fk orders.id

event_type text (ex: paid, shipped, delivered, note)

title text (ex: "Pedido enviado")

description text (opcional)

occurred_at timestamptz (quando aconteceu)

metadata jsonb (ex: { "tracking_url": "...", "tracking_code": "..." })

created_by uuid null (admin/partner/sistema)

Indices:

(order_id, occurred_at desc)

2.3. Politica RLS (essencial)

Cliente pode SELECT eventos apenas se orders.buyer_id = auth.uid()

Admin pode SELECT/INSERT/UPDATE todos

Partner: se voce permitir, SELECT apenas eventos de pedidos com order_items.partner_id = auth.uid() (opcional)

3) Regras de UX (luxo + clareza)

Mostrar um Step Indicator (etapas) + abaixo um historico (eventos).

Etapas recomendadas (4-5):

Confirmado

Pago

Enviado

Entregue
(Cancelar/Reembolso aparecem como "estado alternativo")

Historico em ordem do mais recente para o mais antigo, mas a barra de etapas pode ser "da esquerda para direita" (progressao).

Sempre incluir:

status atual em destaque

data/hora do ultimo evento

codigo de rastreio e botao "Acompanhar entrega" (se houver)

microcopy calma (ex.: "Estamos cuidando do seu ritual.")

4) Acessibilidade (obrigatorio)

Step indicator como lista (<ol>) com o item atual marcado com aria-current="step"

Texto oculto ("Concluido", "Atual") para leitores de tela.

Botoes e links com aria-label claro (ex.: "Abrir rastreio do pedido 1234").

Nao depender so de cor (rosa) para indicar etapa (usar icone/label tambem).

5) Implementacao (arquivos)
5.1 Query SSR

/lib/queries/orders.ts

```ts
import { createSupabaseServer } from "@/lib/supabase/server";

export async function getOrderWithTimeline(orderId: string) {
  const supabase = createSupabaseServer();

  const { data: order, error: e1 } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (e1) throw e1;

  const { data: events, error: e2 } = await supabase
    .from("order_events")
    .select("*")
    .eq("order_id", orderId)
    .order("occurred_at", { ascending: false }); // historico: mais recente primeiro
  if (e2) throw e2;

  return { order, events: events ?? [] };
}
```
5.2 Componente Timeline (Client, so UI)

/components/orders/OrderTimeline.tsx

```tsx
"use client";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  occurred_at: string;
  metadata?: any;
  event_type: string;
};

const STEPS = ["created", "paid", "shipped", "delivered"] as const;

function statusToStep(status: string) {
  if (status === "processing") return "paid";
  if (status === "canceled" || status === "refunded") return status;
  return status;
}

export function OrderTimeline({ status, events }: { status: string; events: Event[] }) {
  const step = statusToStep(status);
  const currentIndex = STEPS.indexOf(step as any);

  const isTerminalBad = step === "canceled" || step === "refunded";

  return (
    <section className="space-y-6">
      <div className="rounded-bpMd border border-bpGraphite/20 bg-bpOffWhite p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Status</p>

        <div className="mt-3">
          {isTerminalBad ? (
            <p className="text-lg font-medium text-bpBlack">Pedido {step === "canceled" ? "cancelado" : "reembolsado"}</p>
          ) : (
            <ol className="grid grid-cols-4 gap-2" aria-label="Progresso do pedido">
              {STEPS.map((s, idx) => {
                const done = idx < currentIndex;
                const current = idx === currentIndex;
                return (
                  <li
                    key={s}
                    aria-current={current ? "step" : undefined}
                    className="rounded-bpMd border border-bpGraphite/20 bg-white p-3"
                  >
                    <p className="text-[11px] uppercase tracking-[0.22em] text-bpGraphite/70">
                      {s === "created" ? "Confirmado" : s === "paid" ? "Pago" : s === "shipped" ? "Enviado" : "Entregue"}
                      <span className="sr-only">{current ? " (atual)" : done ? " (concluido)" : ""}</span>
                    </p>
                    <div className="mt-2 h-1 w-full rounded-full bg-bpGraphite/10">
                      <div className={`h-1 rounded-full ${done || current ? "bg-bpPink" : "bg-transparent"}`} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="rounded-bpMd border border-bpGraphite/20 bg-white p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Linha do tempo</p>

        <ul className="mt-4 space-y-4">
          {events.map((ev) => (
            <li key={ev.id} className="border-l-2 border-bpPink/40 pl-4">
              <p className="text-sm font-medium text-bpBlack">{ev.title}</p>
              {ev.description ? <p className="text-sm text-bpGraphite/70">{ev.description}</p> : null}
              <p className="mt-1 text-xs text-bpGraphite/60">
                {new Date(ev.occurred_at).toLocaleString("pt-BR")}
              </p>

              {ev.metadata?.tracking_url ? (
                <a
                  className="mt-2 inline-block text-xs uppercase tracking-[0.22em] text-bpPink hover:opacity-80"
                  href={ev.metadata.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Abrir rastreio da entrega"
                >
                  Acompanhar entrega
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```
5.3 Pagina do pedido

/app/(client)/conta/pedidos/[id]/page.tsx

```tsx
import { getOrderWithTimeline } from "@/lib/queries/orders";
import { OrderTimeline } from "@/components/orders/OrderTimeline";

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { order, events } = await getOrderWithTimeline(params.id);

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10">
      <h1 className="font-display text-3xl text-bpBlack">Pedido</h1>
      <p className="mt-2 text-sm text-bpGraphite/70">Acompanhe cada etapa do seu ritual.</p>

      <div className="mt-8">
        <OrderTimeline status={order.status} events={events} />
      </div>
    </div>
  );
}
```
6) Conteudo (microcopy premium)

Confirmado: "Recebemos seu pedido."

Pago: "Pagamento aprovado. Estamos preparando tudo com cuidado."

Enviado: "Seu pedido saiu para entrega."

Entregue: "Entrega confirmada. Que seu ritual comece."

7) Criterios de aceite (QA)

Usuario logado ve apenas seus pedidos (RLS ok).

Timeline renderiza sem eventos (mostra "Ainda em edicao" com elegancia).

Mobile: timeline legivel, sem overflow.

Teclado: foco funciona em links/botoes.

aria-current presente na etapa atual.
