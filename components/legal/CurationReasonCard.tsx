export function CurationReasonCard({
  className = ""
}: {
  className?: string;
}) {
  const points = [
    "A curadoria considera composicao, contexto de uso e coerencia com jornadas de cuidado apresentadas no site.",
    "O item pode aparecer em fluxos personalizados quando houver compatibilidade com preferencias, rotina ou categoria explorada.",
    "A selecao editorial nao substitui orientacao medica e nao representa promessa de resultado individual."
  ];

  return (
    <section
      className={`rounded-[28px] border border-[#ebe1e2] bg-[#fcf7f7] p-6 ${className}`}
      aria-label="Por que esta na curadoria BelaPop"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c5d66]">
        Curadoria BelaPop
      </p>
      <h2 className="mt-3 font-display text-3xl leading-tight text-[#1c1b1b]">
        Por que esta na curadoria BelaPop
      </h2>
      <ul className="mt-5 space-y-3 text-sm leading-7 text-[#51494a]">
        {points.map((point) => (
          <li key={point} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
