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
  const isHomeRoute = pathname === "/";
  const isCatalogRoute = pathname === "/catalogo";
  const isSkincareRoute = pathname === "/skincare";
  const isMakeupRoute = pathname === "/maquiagem";
  const isHairRoute = pathname === "/cabelos";
  const isPerfumeRoute = pathname === "/perfumes";
  const isProductRoute = Boolean(pathname?.startsWith("/produto/"));
  const isCartRoute = pathname === "/carrinho";
  const isCheckoutRoute = pathname === "/checkout";
  const isSkinScanRoute = Boolean(
    pathname?.startsWith("/skin-scan") || pathname?.startsWith("/faceshield")
  );
  const isSellerRoute = pathname?.startsWith("/seller");
  const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/adm");
  const hasPageOwnedChrome = Boolean(
    isHomeRoute ||
      isCatalogRoute ||
      isSkincareRoute ||
      isMakeupRoute ||
      isHairRoute ||
      isPerfumeRoute ||
      isProductRoute ||
      isCartRoute ||
      isCheckoutRoute ||
      isSkinScanRoute
  );
  const hasPageOwnedLightFooter = Boolean(
    hasPageOwnedChrome ||
      pathname?.startsWith("/belacode") ||
      pathname?.startsWith("/skinbela") ||
      pathname === "/popclub" ||
      pathname?.startsWith("/popclub/membership") ||
      pathname?.startsWith("/popclub/boas-vindas") ||
      pathname?.startsWith("/popclub/ativar") ||
      pathname === "/contato" ||
      pathname === "/sobre" ||
      pathname === "/rituais"
  );
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
    pathname.startsWith("/skin-scan") ||
    pathname.startsWith("/faceshield") ||
    isSellerRoute ||
    isAdminRoute;

  return (
    <>
      {isSellerRoute || isAdminRoute || hasPageOwnedChrome ? null : <BPHeader />}
      <div
        className={isSellerRoute || isAdminRoute || hasPageOwnedChrome ? "pt-0" : "pt-[72px]"}
      >
        {children}
      </div>
      {isSellerRoute || isAdminRoute || hasPageOwnedLightFooter ? null : <BPFooter />}
      {!hideFloating ? <WhatsappWidget /> : null}
      {!hideFloating && hasAccessibilityWidget ? <AccessibilityButton /> : null}
      {!isSellerRoute && !isAdminRoute ? <CookieConsent /> : null}
    </>
  );
};
