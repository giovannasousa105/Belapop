type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-[#d0cbc3] bg-[#faf9f6] px-6 py-10 text-center">
      <p className="font-editorial text-2xl text-[#292623]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#6d665e]">{description}</p>
    </section>
  );
}
