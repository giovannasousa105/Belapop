import { AccountLayoutShell } from "@/components/AccountLayoutShell";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountLayoutShell>{children}</AccountLayoutShell>;
}
