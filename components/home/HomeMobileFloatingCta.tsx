import Link from "next/link";

export function HomeMobileFloatingCta() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4 md:hidden">
      <div className="mx-auto max-w-md">
        <Link
          href="/conta/skincare"
          className="pointer-events-auto flex min-h-[56px] items-center justify-between rounded-full border border-bpPink/28 bg-bpPinkCta px-5 py-3 text-white shadow-[0_22px_48px_rgba(213,30,113,0.22)]"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/78">SkinBela + BelaCode</p>
            <p className="truncate text-sm font-semibold">Fazer leitura da pele</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/84">Abrir</span>
        </Link>
      </div>
    </div>
  );
}
