"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { WhatsappWidget } from "@/components/WhatsappWidget";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { CookieConsent } from "@/components/CookieConsent";
import { BPFooter } from "@/components/layout/BPFooter";
import { BPHeader } from "@/components/layout/BPHeader";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isSellerRoute = pathname?.startsWith("/seller");
  const isAdminRoute = pathname?.startsWith("/admin");
  const hasAccessibilityWidget = Boolean(
    process.env.NEXT_PUBLIC_ACCESSIBILITY_ACCOUNT_ID ||
      process.env.NEXT_PUBLIC_ACCESSIBE_ACCOUNT_ID
  );
  const hideFloating =
    !pathname ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/carrinho") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/minha-conta") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/pedido") ||
    isSellerRoute ||
    isAdminRoute;

  return (
    <>
      {isSellerRoute || isAdminRoute ? null : <BPHeader />}
      <main className={isSellerRoute || isAdminRoute ? "pt-0" : "pt-[72px]"}>
        {children}
      </main>
      {isSellerRoute || isAdminRoute ? null : <BPFooter />}
      {!hideFloating ? <WhatsappWidget /> : null}
      {!hideFloating && hasAccessibilityWidget ? <AccessibilityButton /> : null}
      {!isSellerRoute && !isAdminRoute ? <CookieConsent /> : null}
    </>
  );
};
