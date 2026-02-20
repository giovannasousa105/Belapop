import Link from "next/link";

import type { EditorialRitual } from "@/lib/queries/rituals";

type RitualCardProps = {
  ritual: EditorialRitual;
};

export function RitualCard({ ritual }: RitualCardProps) {
  return (
    <Link
      href={`/catalogo?ritual=${encodeURIComponent(ritual.title)}`}
      className="group block rounded-bpLg border border-bpPink/15 bg-white p-6 shadow-bpMicro transition hover:-translate-y-0.5 hover:shadow-bpSoft"
    >
      <div className="h-32 rounded-bpMd bg-gradient-to-br from-bpOffWhite to-bpPinkSoft/30" />
      <h3 className="mt-5 font-display text-2xl text-bpBlack">{ritual.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-bpGraphite">{ritual.subtitle}</p>
      <span className="mt-5 inline-flex text-xs uppercase tracking-[0.24em] text-bpPink">
        Ver ritual
      </span>
    </Link>
  );
}
