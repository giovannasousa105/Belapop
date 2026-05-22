"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { WhatsappWidget } from "@/components/WhatsappWidget";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { CookieConsent } from "@/components/CookieConsent";
import { BPFooter } from "@/components/layout/BPFooter";
import { BPHeader } from "@/components/layout/BPHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { isConsultoraBelaPopEnabledPath } from "@/lib/assistant/surfaces";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isHomeRoute = pathname === "/";
  const isCatalogRoute = pathname === "/catalogo";
  const isSkincareRoute = pathname === "/skincare";
  const isMakeupRoute = pathname === "/maquiagem";
  const isHairRoute = pathname === "/cabelos";
  const isPerfumeRoute = pathname === "/perfumes";
  const isProductRoute = Boolean(pathname?.startsWith("/produto/"));
  const isUniversesRoute = Boolean(pathname?.startsWith("/universos"));
  const isCartRoute = pathname === "/carrinho";
  const isCheckoutRoute = pathname === "/checkout";
  const isLoginRoute = pathname === "/login";
  const isSkinScanCaptureRoute = pathname?.startsWith("/skin-scan/captura");
  const isSkinScanRoute = Boolean(
    pathname?.startsWith("/skin-scan") || pathname?.startsWith("/faceshield")
  );
  const isDiaryRoute = Boolean(pathname?.startsWith("/diario"));
  const isPopClubOwnedRoute = Boolean(
    pathname?.startsWith("/popclub") ||
      pathname?.startsWith("/belacode") ||
      pathname?.startsWith("/skinbela")
  );
  const isCustomerPortalRoute = Boolean(
    pathname?.startsWith("/conta") || pathname?.startsWith("/account")
  );
  const isSellerRoute = pathname?.startsWith("/seller");
  const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/adm");
  const hasPageOwnedHeader = Boolean(
    isHomeRoute ||
      isCatalogRoute ||
      isSkincareRoute ||
      isMakeupRoute ||
      isHairRoute ||
      isPerfumeRoute ||
      isProductRoute ||
      isUniversesRoute ||
      isCartRoute ||
      isCheckoutRoute ||
      isLoginRoute ||
      isSkinScanRoute ||
      isDiaryRoute ||
      isPopClubOwnedRoute ||
      isCustomerPortalRoute
  );
  const hasPageOwnedLightFooter = Boolean(
    hasPageOwnedHeader ||
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

  const hideBottomNav = Boolean(
    !pathname ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/skin-scan/captura") ||
      pathname.startsWith("/skin-scan/foco") ||
      isSellerRoute ||
      isAdminRoute
  );
  const hasConsultoraBelaPop = isConsultoraBelaPopEnabledPath(pathname);

  return (
    <>
      {isSellerRoute || isAdminRoute || hasPageOwnedHeader ? null : <BPHeader />}
      <div className={isSellerRoute || isAdminRoute || hasPageOwnedHeader ? "pt-0" : "pt-[78px] lg:pt-[86px]"}>
        {children}
      </div>
      {isSellerRoute || isAdminRoute || hasPageOwnedLightFooter ? null : <BPFooter />}
      {!hideFloating && !hasConsultoraBelaPop ? <WhatsappWidget /> : null}
      {!hideFloating && hasAccessibilityWidget ? <AccessibilityButton /> : null}
      {!isSellerRoute && !isAdminRoute && !isSkinScanRoute ? <CookieConsent /> : null}
      {!hideBottomNav ? <MobileBottomNav /> : null}
    </>
  );
};
