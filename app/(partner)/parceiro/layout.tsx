import type { Metadata } from "next";
import { headers } from "next/headers";

import ActiveSellerSwitcher from "@/components/seller/ActiveSellerSwitcher";
import { requirePasskeyStepUp } from "@/lib/auth/requirePasskeyStepUp";
import { requireRole } from "@/lib/auth/requireRole";

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

  const { role } = await requireRole(["partner", "admin"], {
    redirectTo: "/login?tab=partner",
    unauthorizedTo: "/parceiro/onboarding?status=pending"
  });
  await requirePasskeyStepUp({ role, pathname });

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
        <ActiveSellerSwitcher />
      </div>
      {children}
    </main>
  );
}
