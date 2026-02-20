import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { requireRole } from "@/lib/auth/requireRole";

const NAV_ITEMS = [
  { href: "/parceiro", label: "Overview" },
  { href: "/parceiro/produtos", label: "Produtos" },
  { href: "/parceiro/pedidos", label: "Pedidos" },
  { href: "/parceiro/repasse", label: "Repasse" },
  { href: "/parceiro/suporte", label: "Suporte" }
];

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function ParceiroLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isOnboarding = pathname.startsWith("/parceiro/onboarding");

  if (isOnboarding) {
    await requireRole(["client", "partner", "admin"], {
      redirectTo: "/login?tab=partner"
    });
    return <>{children}</>;
  }

  await requireRole(["partner", "admin"], {
    redirectTo: "/login?tab=partner",
    unauthorizedTo: "/parceiro/onboarding?status=pending"
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black/10 bg-bpBlack text-bpOffWhite">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-6 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.25em] transition ${
                pathname === item.href
                  ? "border-bpPink bg-bpPink/15 text-bpPinkSoft"
                  : "border-white/20 text-bpOffWhite/85 hover:border-bpPink/60"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <main>{children}</main>
    </div>
  );
}
