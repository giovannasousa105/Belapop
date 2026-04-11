import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title?: string;
  description: string;
  aside?: ReactNode;
};

export function AdminPageHeader({
  eyebrow = "Contexto operacional",
  title,
  description,
  aside
}: AdminPageHeaderProps) {
  return (
    <section className="grid grid-cols-1 gap-5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-6 shadow-[var(--adm-shadow-micro)] xl:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--adm-text-soft)]">
          {eyebrow}
        </p>
        {title ? (
          <h2 className="mt-3 font-editorial text-4xl tracking-[-0.04em] text-[var(--adm-text)]">
            {title}
          </h2>
        ) : null}
        <p
          className={`${title ? "mt-3" : "mt-1"} max-w-3xl text-sm leading-7 text-[var(--adm-text-muted)]`}
        >
          {description}
        </p>
      </div>
      {aside ? <div className="xl:justify-self-end">{aside}</div> : null}
    </section>
  );
}
