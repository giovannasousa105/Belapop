import { requireRole } from "@/lib/auth/requireRole";

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);
  return <>{children}</>;
}
