import { TrustModalProvider } from "@/components/trust/TrustModal";
import React from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TrustModalProvider>{children}</TrustModalProvider>
  );
}