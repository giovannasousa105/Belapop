"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { WhatsappWidget } from "@/components/WhatsappWidget";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { CookieConsent } from "@/components/CookieConsent";
import { BPFooter } from "@/components/layout/BPFooter";
import { BPHeader } from "@/components/layout/BPHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ShellManagedHeaderProvider } from "@/components/luxury/BelaPopValidatedHeader";
import { isConsultoraBelaPopEnabledPath } from "@/lib/assistant/surfaces";

const matchesRouteSegment = (pathname: string | null, segment: string) =>
  Boolean(pathname === segment || pathname?.startsWith(`${segment}/`));

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
  const isImmersiveSkinScanRoute = Boolean(
    pathname?.startsWith("/skin-scan/") || pathname?.startsWith("/faceshield")
  );
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
    matchesRouteSegment(pathname, "/conta") || matchesRouteSegment(pathname, "/account")
  );
  const isSellerRoute = pathname?.startsWith("/seller");
  const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/adm");
  const hasInternalHeaderSpacing = Boolean(
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
      isSkinScanRoute ||
      isDiaryRoute ||
      isPopClubOwnedRoute ||
      isCustomerPortalRoute
  );
  const hasPublicHeader = Boolean(
    pathname && !isSellerRoute && !isAdminRoute && !isCustomerPortalRoute && !isImmersiveSkinScanRoute
  );
  const hasPageOwnedLightFooter = Boolean(
    hasInternalHeaderSpacing ||
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
    <ShellManagedHeaderProvider enabled={hasPublicHeader}>
      {hasPublicHeader ? <BPHeader /> : null}
      <div id="main-content" className={hasPublicHeader ? "pt-[100px] lg:pt-[124px]" : "pt-0"}>
        {children}
      </div>
      {isSellerRoute || isAdminRoute || hasPageOwnedLightFooter ? null : <BPFooter />}
      {!hideFloating && !hasConsultoraBelaPop ? <WhatsappWidget /> : null}
      {!hideFloating && hasAccessibilityWidget ? <AccessibilityButton /> : null}
      {!isSellerRoute && !isAdminRoute ? <CookieConsent /> : null}
      {!hideBottomNav ? <MobileBottomNav /> : null}
    </ShellManagedHeaderProvider>
  );
};
