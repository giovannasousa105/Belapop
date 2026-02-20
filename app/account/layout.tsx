import { AccountLayoutShell } from "@/components/AccountLayoutShell";
import { requireRole } from "@/lib/auth/requireRole";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["client", "partner", "admin"]);
  return <AccountLayoutShell>{children}</AccountLayoutShell>;
}
