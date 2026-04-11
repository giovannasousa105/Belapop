"use client";

import Link from "next/link";
import { BookOpen, ScanFace, Store, User } from "lucide-react";
import type { ReactNode } from "react";

type AtelierCategoryBottomNavProps = {
  shopHref: string;
};

function BottomNavLink({
  active = false,
  children,
  href,
  label
}: {
  active?: boolean;
  children: ReactNode;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center pt-2 transition-colors ${
        active
          ? "border-t-2 border-black text-black"
          : "text-stone-400 hover:text-black"
      }`}
    >
      {children}
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
        {label}
      </span>
    </Link>
  );
}

export function AtelierCategoryBottomNav({
  shopHref
}: AtelierCategoryBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around border-t border-stone-200 bg-white/85 px-4 pb-6 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-md lg:hidden">
      <BottomNavLink active href={shopHref} label="Shop">
        <Store className="h-5 w-5" />
      </BottomNavLink>
      <BottomNavLink href="/diario" label="Journal">
        <BookOpen className="h-5 w-5" />
      </BottomNavLink>
      <BottomNavLink href="/skin-scan" label="AI Scan">
        <ScanFace className="h-5 w-5" />
      </BottomNavLink>
      <BottomNavLink href="/conta" label="Profile">
        <User className="h-5 w-5" />
      </BottomNavLink>
    </nav>
  );
}
