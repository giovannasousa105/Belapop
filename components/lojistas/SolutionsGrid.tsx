"use client";

type Solution = {
  title: string;
  description: string;
  tag: string;
};

type SolutionsGridProps = {
  items: Solution[];
};

export const SolutionsGrid = ({ items }: SolutionsGridProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((solution) => (
        <div
          key={solution.title}
          className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
        >
          <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-belapop-rose opacity-10 blur-2xl" />
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
            {solution.tag}
          </p>
          <h3 className="mt-4 font-display text-2xl text-bpBlack">
            {solution.title}
          </h3>
          <p className="mt-3 text-sm text-bpGraphite/80">{solution.description}</p>
          <div className="mt-6 h-px w-16 bg-belapop-rose opacity-40" />
        </div>
      ))}
    </div>
  );
};
