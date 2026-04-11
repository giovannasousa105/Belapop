import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

// Nota: Assumindo que requireRole e portalRole existem conforme CODEX_ROLES_PORTAIS.md
// Se estiver usando Supabase, a lógica de validação de role deve ser importada aqui.

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

interface AdmLayoutProps {
  children: React.ReactNode;
}

export default async function AdmLayout({ children }: AdmLayoutProps) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("belapop_admin_session");
  
  const headerList = await headers();
  const forwardPath = headerList.get("x-forwarded-path") || "";
  const invokePath = headerList.get("x-invoke-path") || "";
  const isLoginPage = forwardPath.includes("/adm/login") || invokePath.includes("/adm/login");

  if (!adminSession && !isLoginPage) {
    redirect("/adm/login");
  }
  
  return (
    <div className="min-h-screen bg-[#0b0b10] text-white selection:bg-[#B80F5A]/30">
      {children}
    </div>
  );
}