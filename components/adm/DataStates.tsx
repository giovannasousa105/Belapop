import Link from "next/link";

type EmptyLikeProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function LoadingState({ title = "Carregando dados..." }: { title?: string }) {
  return (
    <section className="rounded-2xl border border-[#d8d5ce] bg-white p-6">
      <p className="text-sm font-semibold text-[#2a2622]">{title}</p>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#ece8df]" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-[#ece8df]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[#ece8df]" />
      </div>
    </section>
  );
}

export function ErrorState({ title, description, actionHref, actionLabel }: EmptyLikeProps) {
  return (
    <section className="rounded-2xl border border-[#dac9c6] bg-[#fff8f7] p-6">
      <p className="text-lg font-semibold text-[#3b2622]">{title}</p>
      <p className="mt-2 text-sm text-[#6f5b56]">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-full border border-[#cfb9b3] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#533b36]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

export function NoResultsState({ title, description, actionHref, actionLabel }: EmptyLikeProps) {
  return (
    <section className="rounded-2xl border border-[#d8d5ce] bg-[#fcfbf8] p-6">
      <p className="text-lg font-semibold text-[#2b2723]">{title}</p>
      <p className="mt-2 text-sm text-[#6c645b]">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-full border border-[#d4cec4] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#575149]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

export function PartialDataState({
  title = "Dados parciais detectados",
  description = "Algumas relacoes ainda nao foram carregadas. A visualizacao segue disponivel para analise."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="rounded-2xl border border-[#d9d2c5] bg-[#f8f5ee] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f493f]">{title}</p>
      <p className="mt-1 text-sm text-[#6c645b]">{description}</p>
    </section>
  );
}
