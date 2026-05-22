export default function CatalogQualityLoading() {
  return (
    <div className="space-y-7">
      <section className="rounded-[8px] border border-[#2f2a25] bg-[#211d1a] p-6 text-white shadow-[var(--adm-shadow-micro)] md:p-8">
        <p className="h-3 w-56 rounded-full bg-white/15" />
        <div className="mt-5 h-10 w-full max-w-3xl rounded-full bg-white/12" />
        <div className="mt-3 h-10 w-full max-w-2xl rounded-full bg-white/10" />
        <div className="mt-5 h-4 w-full max-w-xl rounded-full bg-white/10" />
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[8px] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]"
          >
            <div className="h-3 w-32 rounded-full bg-black/8" />
            <div className="mt-5 h-9 w-20 rounded-full bg-black/10" />
            <div className="mt-4 h-4 w-full rounded-full bg-black/6" />
            <div className="mt-2 h-4 w-3/4 rounded-full bg-black/6" />
          </div>
        ))}
      </section>
    </div>
  );
}
