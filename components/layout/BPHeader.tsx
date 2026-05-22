"use client";

import { usePathname } from "next/navigation";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";

function resolveActiveSection(pathname: string | null) {
  if (!pathname) return "loja" as const;
  if (pathname.startsWith("/diario")) return "diario" as const;
  if (pathname.startsWith("/universos")) return "universos" as const;
  if (pathname.startsWith("/popclub")) return "popclub" as const;
  if (
    pathname.startsWith("/skin-scan") ||
    pathname.startsWith("/faceshield") ||
    pathname.startsWith("/belacode")
  ) {
    return "skin-scan" as const;
  }
  if (pathname.startsWith("/maquiagem")) return "maquiagem" as const;
  if (pathname.startsWith("/cabelos")) return "cabelos" as const;
  if (pathname.startsWith("/perfumes")) return "perfumes" as const;
  if (pathname.startsWith("/skincare")) return "skincare" as const;
  return "loja" as const;
}

export function BPHeader() {
  const pathname = usePathname();

  return <BelaPopValidatedHeader activeSection={resolveActiveSection(pathname)} variant="dark" />;
}
