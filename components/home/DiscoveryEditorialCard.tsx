import Link from "next/link";

import { EditorialCoverHeader } from "@/components/ui/EditorialCoverHeader";

type DiscoveryEditorialCardProps = {
  item: {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    href: string;
    eyebrow: string;
    productCount: number;
    supportingLabel?: string;
  };
};

export function DiscoveryEditorialCard({ item }: DiscoveryEditorialCardProps) {
  const productCountLabel =
    item.productCount > 0
      ? `${item.productCount} ${item.productCount === 1 ? "produto" : "produtos"}`
      : "Selecao editorial";

  return (
    <Link
      href={item.href}
      className="group block overflow-hidden rounded-bpLg border border-bpPink/15 bg-white shadow-bpMicro transition hover:-translate-y-0.5 hover:shadow-bpSoft"
    >
      <EditorialCoverHeader
        imageUrl={item.coverImage}
        imageAlt={item.title}
        sizes="(max-width: 767px) 78vw, (max-width: 1279px) 33vw, 25vw"
        heightClassName="h-38 sm:h-44"
        leftLabel={item.eyebrow}
        rightLabel="Curadoria"
        title={item.supportingLabel ?? "Editorial curado"}
        subtitle={item.title}
      />
      <div className="p-4 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-bpPink">{item.eyebrow}</p>
        <h3 className="mt-3 text-balance font-display text-[1.5rem] font-medium leading-[1.04] text-bpBlack sm:text-[1.86rem]">
          {item.title}
        </h3>
        <p className="mt-3 text-[0.92rem] leading-6 text-bpGraphite/90 sm:text-sm sm:leading-relaxed">
          {item.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-bpGraphite/72">
            {item.supportingLabel ?? "Curadoria premium"}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-bpGraphite/72">
            {productCountLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
