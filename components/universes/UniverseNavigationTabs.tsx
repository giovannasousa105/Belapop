import Link from "next/link";

import type { BelaPopUniverse } from "@/lib/discovery/universes";

type UniverseNavigationTabsProps = {
  universe: BelaPopUniverse;
  relatedUniverses: BelaPopUniverse[];
};

const tabs = [
  { href: "#narrativa", label: "Narrativa" },
  { href: "#produtos", label: "Produtos" },
  { href: "#kits", label: "Kits" },
  { href: "#coleções", label: "Colecoes" },
  { href: "#rotinas", label: "Rotinas" }
] as const;

export function UniverseNavigationTabs({
  universe,
  relatedUniverses
}: UniverseNavigationTabsProps) {
  return (
    <div className="sticky top-[78px] z-40 border-y border-[#ded8d2] bg-[#fcf9f8]/96 backdrop-blur lg:top-[88px]">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 overflow-x-auto px-5 py-3 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className="shrink-0 border border-[#ded8d2] bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1c1b1b] transition hover:border-[#1c1b1b]"
          >
            {tab.label}
          </a>
        ))}
        <span className="mx-1 h-px w-6 shrink-0 bg-[#d8d0c8]" aria-hidden="true" />
        {relatedUniverses.map((related) => (
          <Link
            key={related.id}
            href={`/universos/${related.slug}`}
            className="shrink-0 px-3 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f6862] transition hover:text-[#1c1b1b]"
          >
            {related.name}
          </Link>
        ))}
        <span
          className="ml-auto hidden shrink-0 px-3 py-3 text-[10px] font-bold uppercase tracking-[0.18em] lg:inline-flex"
          style={{ color: universe.theme.accent }}
        >
          {universe.badge}
        </span>
      </div>
    </div>
  );
}
