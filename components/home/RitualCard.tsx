import Link from "next/link";

import { EditorialCoverHeader } from "@/components/ui/EditorialCoverHeader";
import type { EditorialRitual } from "@/lib/queries/rituals";

type RitualCardProps = {
  ritual: EditorialRitual;
};

export function RitualCard({ ritual }: RitualCardProps) {
  return (
    <Link
      href={`/catalogo?ritual=${encodeURIComponent(ritual.title)}`}
      className="group block overflow-hidden rounded-bpLg border border-bpPink/15 bg-white transition hover:-translate-y-0.5"
    >
      <EditorialCoverHeader
        imageUrl={ritual.coverImageUrl}
        imageAlt={ritual.title}
        sizes="(max-width: 767px) 78vw, 50vw"
        heightClassName="h-34 sm:h-40"
        leftLabel="Ritual BelaPop"
        rightLabel="Beauty ritual"
        title="Ritual guiado"
        subtitle={ritual.title}
      />
      <div className="p-4 sm:p-7">
        <h3 className="font-display text-[1.36rem] font-medium leading-[1.06] text-bpBlack sm:text-[1.82rem]">{ritual.title}</h3>
        <p className="mt-3 text-[0.92rem] leading-6 text-bpGraphite/90 sm:text-sm sm:leading-relaxed">{ritual.subtitle}</p>
        <span className="mt-6 inline-flex text-xs uppercase tracking-[0.24em] text-bpPink">
          Ver ritual
        </span>
      </div>
    </Link>
  );
}
