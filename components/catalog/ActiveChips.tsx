"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-[rgba(216,160,172,0.18)] bg-white/84 px-3 py-1 text-xs text-bpBlack shadow-[0_8px_20px_rgba(91,49,56,0.03)] hover:bg-[#fffaf9]"
      aria-label={`Remover filtro ${label}`}
    >
      <span className="uppercase tracking-[0.16em]">{label}</span>
      <span className="text-bpPink">x</span>
    </button>
  );
}

export function ActiveChips() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const chips: { key: string; label: string }[] = [];
  const q = sp.get("q");
  const ritual = sp.get("ritual");
  const texture = sp.get("texture");
  const collection = sp.get("collection");
  const origin = sp.get("origin");
  const ingredient = sp.get("ingredient");
  const stock = sp.get("stock");
  const min = sp.get("min");
  const max = sp.get("max");
  const brands = sp.getAll("brand");
  const tags = sp.getAll("tags");

  const prettifySlug = (value: string) =>
    value
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  if (q) chips.push({ key: "q", label: `Busca: ${q}` });
  if (ritual) chips.push({ key: "ritual", label: ritual });
  if (texture) chips.push({ key: "texture", label: texture });
  if (collection) chips.push({ key: "collection", label: `Colecao: ${prettifySlug(collection)}` });
  if (origin) chips.push({ key: "origin", label: `Origem: ${prettifySlug(origin)}` });
  if (ingredient) chips.push({ key: "ingredient", label: `Ingrediente: ${prettifySlug(ingredient)}` });
  if (stock === "1") chips.push({ key: "stock", label: "Em estoque" });
  if (min || max) chips.push({ key: "price", label: `R$ ${min ?? "0"}-${max ?? "inf"}` });

  brands.forEach((b) => chips.push({ key: `brand:${b}`, label: b }));
  tags.forEach((t) => chips.push({ key: `tags:${t}`, label: t }));

  if (!chips.length) return null;

  function remove(key: string) {
    const params = new URLSearchParams(sp.toString());

    if (key === "price") {
      params.delete("min");
      params.delete("max");
    } else if (key.startsWith("brand:")) {
      const v = key.replace("brand:", "");
      const kept = sp.getAll("brand").filter((x) => x !== v);
      params.delete("brand");
      kept.forEach((x) => params.append("brand", x));
    } else if (key.startsWith("tags:")) {
      const v = key.replace("tags:", "");
      const kept = sp.getAll("tags").filter((x) => x !== v);
      params.delete("tags");
      kept.forEach((x) => params.append("tags", x));
    } else {
      params.delete(key);
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <Chip key={c.key} label={c.label} onRemove={() => remove(c.key)} />
      ))}
      <button
        type="button"
        onClick={() => router.push(pathname)}
        className="text-xs uppercase tracking-[0.22em] text-bpPink hover:opacity-80"
      >
        Limpar tudo
      </button>
    </div>
  );
}
