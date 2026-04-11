type PartnerTab =
  | "dashboard"
  | "orders"
  | "products"
  | "inventory"
  | "campaigns"
  | "support"
  | "finance"
  | "reputation"
  | "reports"
  | "alerts"
  | "automations"
  | "analytics"
  | "settings"
  | "help";

const PREFIX_TAB_MAP: Array<{ prefix: string; tab: PartnerTab }> = [
  { prefix: "/seller/orders", tab: "orders" },
  { prefix: "/seller/products", tab: "products" },
  { prefix: "/seller/inventory", tab: "inventory" },
  { prefix: "/seller/campaigns", tab: "campaigns" },
  { prefix: "/seller/support", tab: "support" },
  { prefix: "/seller/notifications", tab: "support" },
  { prefix: "/seller/finance", tab: "finance" },
  { prefix: "/seller/payments", tab: "finance" },
  { prefix: "/seller/reputation", tab: "reputation" },
  { prefix: "/seller/reports", tab: "reports" },
  { prefix: "/seller/alerts", tab: "alerts" },
  { prefix: "/seller/automations", tab: "automations" },
  { prefix: "/seller/analytics", tab: "analytics" },
  { prefix: "/seller/settings", tab: "settings" },
  { prefix: "/seller/profile", tab: "settings" },
  { prefix: "/seller/help", tab: "help" },
  { prefix: "/seller/dashboard", tab: "dashboard" }
];

const normalizePathname = (pathname: string) => {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const toPartnerTabUrl = (tab: PartnerTab) => `/parceiro?tab=${tab}`;

export function resolvePartnerPortalFromSellerPath(pathname: string): string {
  const normalized = normalizePathname(pathname);
  if (normalized === "/seller" || normalized === "/seller/dashboard") {
    return "/parceiro";
  }

  for (const { prefix, tab } of PREFIX_TAB_MAP) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return toPartnerTabUrl(tab);
    }
  }

  return "/parceiro";
}

