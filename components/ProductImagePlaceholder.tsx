const CATEGORY_STYLES: Record<string, { bg: string; icon: string; accent: string }> = {
  limpeza:   { bg: "bg-blue-50",   icon: "🫧", accent: "border-blue-200" },
  tonico:    { bg: "bg-pink-50",   icon: "💧", accent: "border-pink-200" },
  serum:     { bg: "bg-amber-50",  icon: "✨", accent: "border-amber-200" },
  hidratante:{ bg: "bg-green-50",  icon: "🌿", accent: "border-green-200" },
  proteção:  { bg: "bg-yellow-50", icon: "☀️", accent: "border-yellow-200" },
  olhos:     { bg: "bg-purple-50", icon: "◉",  accent: "border-purple-200" },
};

export function ProductImagePlaceholder({
  category,
  name,
  className = "",
}: {
  category: string;
  name: string;
  className?: string;
}) {
  const key = (category ?? "").toLowerCase();
  const style = CATEGORY_STYLES[key] ?? { bg: "bg-neutral-50", icon: "✦", accent: "border-neutral-200" };

  return (
    <div
      className={`flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border ${style.bg} ${style.accent} ${className}`}
    >
      <span className="text-6xl leading-none" aria-hidden="true">
        {style.icon}
      </span>
      <span className="px-4 text-center text-xs text-neutral-500">{name}</span>
    </div>
  );
}
