"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect } from "react";

export type ImmersiveMenuLink = {
  label: string;
  href: string;
  accent?: boolean;
};

type ImmersiveMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  links: readonly ImmersiveMenuLink[];
  theme?: "light" | "dark";
  searchPlaceholder?: string;
};

export function ImmersiveMenuDrawer({
  open,
  onClose,
  title,
  links,
  theme = "light",
  searchPlaceholder = "Buscar"
}: ImmersiveMenuDrawerProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const isDark = theme === "dark";
  const panelClassName = isDark ? "bg-black text-white" : "bg-[#fcf9f8] text-[#1c1b1b]";
  const borderClassName = isDark ? "border-white/10" : "border-black/10";
  const inputClassName = isDark
    ? "border-white/10 bg-white/5 text-white placeholder:text-white/35"
    : "border-black/10 bg-white text-[#1c1b1b] placeholder:text-[#747878]";
  const linkClassName = isDark
    ? "border-white/10 text-white"
    : "border-black/10 text-[#1c1b1b]";

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm md:hidden">
      <aside
        className={`absolute inset-y-0 left-0 flex w-[88vw] max-w-[380px] flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 shadow-2xl ${panelClassName}`}
      >
        <div className={`flex items-center justify-between border-b pb-5 ${borderClassName}`}>
          <span className="font-[var(--font-playfair)] text-[28px] font-semibold tracking-[-0.04em]">
            {title}
          </span>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={onClose}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${borderClassName}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="relative mt-5 block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className={`h-13 w-full border pl-11 pr-4 text-sm outline-none transition focus:border-black/25 focus:ring-0 ${inputClassName}`}
          />
        </label>

        <p className={`mt-4 text-[10px] uppercase tracking-[0.22em] ${isDark ? "text-white/45" : "text-[#747878]"}`}>
          Navegacao premium mobile first
        </p>

        <nav className="mt-6 flex flex-col">
          {links.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={onClose}
              className={`border-b py-4 text-[17px] font-medium transition-colors ${
                link.accent
                  ? isDark
                    ? "border-white/10 text-[#f7e382]"
                    : "border-black/10 text-[#6c5e06]"
                  : linkClassName
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}
