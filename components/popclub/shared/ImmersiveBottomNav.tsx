"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type ImmersiveBottomNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type ImmersiveBottomNavProps = {
  items: readonly ImmersiveBottomNavItem[];
  theme?: "light" | "dark";
  activeTone?: "black" | "pink";
};

export function ImmersiveBottomNav({
  items,
  theme = "light",
  activeTone = "black"
}: ImmersiveBottomNavProps) {
  const isDark = theme === "dark";
  const shellClassName = isDark
    ? "border-white/10 bg-black/78 text-white"
    : "border-black/5 bg-[#fcf9f8]/86 text-[#444748]";
  const activeClassName =
    activeTone === "pink"
      ? "border-[#ed93d5] text-[#ed93d5]"
      : isDark
        ? "border-white text-white"
        : "border-[#1c1b1b] text-[#1c1b1b]";
  const inactiveClassName = isDark
    ? "text-white/45 hover:text-white"
    : "text-[#444748] hover:text-[#1c1b1b]";

  return (
    <nav
      className={`fixed bottom-0 left-0 z-50 flex h-[88px] w-full items-center justify-around border-t px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_36px_rgba(0,0,0,0.05)] backdrop-blur-2xl md:hidden ${shellClassName}`}
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`flex min-w-[72px] flex-col items-center justify-center border-t-2 px-1 pt-2 text-[10px] font-bold uppercase tracking-[0.22em] transition-colors ${
              item.active ? activeClassName : `border-transparent ${inactiveClassName}`
            }`}
          >
            <Icon className="mb-1 h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
