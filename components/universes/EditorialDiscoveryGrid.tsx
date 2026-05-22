import { UniverseCard } from "@/components/universes/UniverseCard";
import type { BelaPopUniverse } from "@/lib/discovery/universes";

type EditorialDiscoveryGridProps = {
  universes: BelaPopUniverse[];
  source?: string;
  featuredFirst?: boolean;
};

export function EditorialDiscoveryGrid({
  universes,
  source = "editorial_discovery_grid",
  featuredFirst = true
}: EditorialDiscoveryGridProps) {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 [scrollbar-width:none] sm:px-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
      {universes.map((universe, index) => (
        <UniverseCard
          key={universe.id}
          universe={universe}
          featured={featuredFirst && index === 0}
          source={source}
        />
      ))}
    </div>
  );
}
