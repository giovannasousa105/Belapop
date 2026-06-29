import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginPreviewScreen } from "@/components/previews/belapop/login-screen";

export const metadata: Metadata = {
  title: "Entrar ou criar conta · BelaPop",
  description: "Acesse sua conta BelaPop ou crie uma nova para acompanhar pedidos, acumular pontos PopClub e salvar sua análise de pele.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPreviewScreen mode="live" />
    </Suspense>
  );
}
