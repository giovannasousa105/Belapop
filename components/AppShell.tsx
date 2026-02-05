"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { CuradoriaChat } from "@/components/CuradoriaChat";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { WhatsappWidget } from "@/components/WhatsappWidget";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isSellerRoute = pathname?.startsWith("/seller");
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      {isSellerRoute || isAdminRoute ? null : <Navbar />}
      <main className={isSellerRoute || isAdminRoute ? "pt-0" : "pt-36"}>
        {children}
      </main>
      {isSellerRoute || isAdminRoute ? null : <Footer />}
      {!isAdminRoute ? (
        <CuradoriaChat variant={isSellerRoute ? "seller" : "customer"} />
      ) : null}
      {!isAdminRoute ? <WhatsappWidget /> : null}
    </>
  );
};
