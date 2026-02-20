"use client";

import Link from "next/link";

export default function SellerPublicShell({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[100vh]">
      <div className="absolute inset-0 bg-bpGlow opacity-80" />
      <div className="relative z-10 mx-auto flex min-h-[100vh] w-full max-w-5xl flex-col px-6 py-12">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-lg tracking-[0.2em] text-bpOffWhite"
          >
            BelaPop
          </Link>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.08em] text-bpPinkSoft/70 hover:text-bpOffWhite"
          >
            Voltar ao site
          </Link>
        </div>
        <div className="mt-8 flex-1">{children}</div>
      </div>
    </div>
  );
}
