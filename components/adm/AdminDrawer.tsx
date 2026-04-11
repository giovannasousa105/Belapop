import Link from "next/link";
import type { ReactNode } from "react";

type AdminDrawerProps = {
  title: string;
  subtitle?: string;
  closeHref: string;
  children: ReactNode;
};

export function AdminDrawer({ title, subtitle, closeHref, children }: AdminDrawerProps) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[rgba(31,33,29,0.34)] backdrop-blur-[2px]">
      <aside className="adm-scrollbar h-full w-full overflow-y-auto bg-[var(--adm-bg)] px-4 py-5 shadow-[-20px_0_40px_rgba(32,30,28,0.12)] sm:max-w-[440px] sm:px-5 lg:max-w-[460px]">
        <div className="rounded-[24px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-soft)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-editorial text-[1.9rem] leading-none tracking-[-0.04em] text-[var(--adm-text)]">
                {title}
              </p>
              {subtitle ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--adm-text-muted)]">{subtitle}</p>
              ) : null}
            </div>
            <Link
              href={closeHref}
              className="rounded-full border border-[var(--adm-border)] bg-[var(--adm-surface-muted)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text)]"
            >
              Fechar
            </Link>
          </div>
          <div className="mt-5 space-y-4">{children}</div>
        </div>
      </aside>
    </div>
  );
}
