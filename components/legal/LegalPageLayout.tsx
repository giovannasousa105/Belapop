import type { ReactNode } from "react";

type TocItem = {
  id: string;
  label: string;
};

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  tableOfContents: readonly TocItem[];
  aside?: ReactNode;
  children: ReactNode;
};

export function LegalPageLayout({
  eyebrow,
  title,
  intro,
  updatedAt,
  tableOfContents,
  aside,
  children
}: LegalPageLayoutProps) {
  return (
    <main className="bg-[#fcf9f8] text-[#1c1b1b]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#8c5d66]">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-[#1c1b1b] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#51494a] sm:text-base">
              {intro}
            </p>
            <div className="mt-8 rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6d6667]">
                Navegacao da pagina
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="text-sm leading-6 text-[#3d3536] transition-colors hover:text-[#c88fa3]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-[#6d6667]">
                Atualizado em {updatedAt}
              </p>
            </div>

            <div className="mt-8 space-y-8">{children}</div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28">{aside}</aside>
        </div>
      </div>
    </main>
  );
}

export function LegalSection({
  id,
  title,
  children
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-[28px] border border-black/8 bg-white p-5 sm:p-7"
    >
      <h2 className="font-display text-2xl text-[#1c1b1b] sm:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4 text-sm leading-7 text-[#51494a] sm:text-base">{children}</div>
    </section>
  );
}
