"use client";

type AnalyzingOverlayProps = {
  progress: number;
  activeLabel: string;
};

export default function AnalyzingOverlay({ progress, activeLabel }: AnalyzingOverlayProps) {
  return (
    <div className="absolute inset-x-0 bottom-[max(1.75rem,env(safe-area-inset-bottom))] px-5 text-white">
      <div className="mx-auto max-w-md border border-white/14 bg-black/34 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/56">
          Analisando sua pele com IA...
        </p>
        <p className="mt-3 text-xl font-medium leading-7">{activeLabel}</p>
        <div className="mt-5 h-[2px] w-full overflow-hidden rounded-full bg-white/14">
          <div
            className="h-full rounded-full bg-white/88 transition-[width] duration-300"
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
        </div>
        <p className="mt-4 text-sm leading-7 text-white/72">
          Mantendo a leitura visual segura antes de montar sua rotina.
        </p>
      </div>
    </div>
  );
}
