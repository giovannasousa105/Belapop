import type { AdmPermission, AdmPermissionCheckMode } from "@/types/adm/auth";

export type AdmIconKey =
  | "layout-dashboard"
  | "sparkles"
  | "shield-check"
  | "scroll-text"
  | "truck"
  | "triangle-alert"
  | "wallet"
  | "line-chart"
  | "megaphone"
  | "users"
  | "settings"
  | "activity"
  | "message-square";

export interface AdmNavItem {
  label: string;
  href: string;
  icon?: AdmIconKey;
  children?: AdmNavItem[];
  requiredPermissions?: AdmPermission[];
  permissionMode?: AdmPermissionCheckMode;
  matchers?: RegExp[];
  hidden?: boolean;
}

export interface AdmNavGroup {
  label: string;
  items: AdmNavItem[];
}

export const admSidebarGroups: AdmNavGroup[] = [
  {
    label: "Visao Geral",
    items: [
      {
        label: "Central de Controle",
        href: "/adm",
        icon: "layout-dashboard",
        requiredPermissions: ["view_dashboard"]
      },
      {
        label: "Dashboard Executivo",
        href: "/adm/dashboard-executivo",
        icon: "line-chart",
        requiredPermissions: ["view_dashboard"]
      },
      {
        label: "Qualidade do Catalogo",
        href: "/adm/qualidade-catalogo",
        icon: "shield-check",
        requiredPermissions: ["view_quality"]
      }
    ]
  },
  {
    label: "Curadoria",
    items: [
      {
        label: "Curadoria de Produtos",
        href: "/adm/curadoria/produtos",
        icon: "sparkles",
        requiredPermissions: ["manage_products"]
      },
      {
        label: "Regras de Curadoria",
        href: "/adm/curadoria/regras",
        icon: "scroll-text",
        requiredPermissions: ["manage_products"]
      },
      {
        label: "Score de Qualidade",
        href: "/adm/curadoria/score",
        icon: "line-chart",
        requiredPermissions: ["view_quality"]
      },
      {
        label: "Monitoramento de Qualidade",
        href: "/adm/curadoria/monitoramento",
        icon: "activity",
        requiredPermissions: ["view_quality"]
      },
      {
        label: "Historico de Versoes",
        href: "/adm/curadoria/historico-versoes",
        icon: "activity",
        requiredPermissions: ["view_quality", "view_activity_logs"],
        permissionMode: "any"
      },
      {
        label: "Documentos",
        href: "/adm/curadoria/documentos",
        icon: "scroll-text",
        requiredPermissions: ["manage_documents"]
      },
      {
        label: "Compliance e Confianca",
        href: "/adm/curadoria/compliance",
        icon: "shield-check",
        requiredPermissions: ["manage_documents", "view_quality"],
        permissionMode: "any"
      }
    ]
  },
  {
    label: "Operacao",
    items: [
      {
        label: "Pedidos Criticos",
        href: "/adm/operacao/pedidos-criticos",
        icon: "triangle-alert",
        requiredPermissions: ["manage_logistics"]
      },
      {
        label: "Logistica",
        href: "/adm/operacao/logistica",
        icon: "truck",
        requiredPermissions: ["manage_logistics"],
        children: [
          {
            label: "Incidentes Logisticos",
            href: "/adm/operacao/logistica/incidentes",
            requiredPermissions: ["manage_logistics"]
          }
        ]
      },
      {
        label: "Parceiros",
        href: "/adm/operacao/parceiros",
        icon: "users",
        requiredPermissions: ["manage_sellers"]
      },
      {
        label: "Comunicacao com Sellers",
        href: "/adm/operacao/comunicacao-sellers",
        icon: "message-square",
        requiredPermissions: ["manage_sellers"]
      }
    ]
  },
  {
    label: "Financeiro",
    items: [
      {
        label: "Financeiro",
        href: "/adm/financeiro",
        icon: "wallet",
        requiredPermissions: ["manage_finance"]
      },
      {
        label: "Repasses",
        href: "/adm/financeiro/repasses",
        icon: "wallet",
        requiredPermissions: ["manage_finance"]
      },
      {
        label: "Reembolsos",
        href: "/adm/financeiro/reembolsos",
        icon: "wallet",
        requiredPermissions: ["manage_refunds", "manage_finance"],
        permissionMode: "any"
      },
      {
        label: "Auditoria Financeira",
        href: "/adm/financeiro/auditoria",
        icon: "shield-check",
        requiredPermissions: ["manage_finance"]
      },
      {
        label: "Antifraude / Risco",
        href: "/adm/financeiro/risco",
        icon: "triangle-alert",
        requiredPermissions: ["manage_finance"]
      }
    ]
  },
  {
    label: "Catalogo e Marca",
    items: [
      {
        label: "Conteudo e Vitrines",
        href: "/adm/catalogo-marca/conteudo-vitrines",
        icon: "layout-dashboard",
        requiredPermissions: ["manage_campaigns"]
      },
      {
        label: "Campanhas / Destaques",
        href: "/adm/catalogo-marca/campanhas",
        icon: "megaphone",
        requiredPermissions: ["manage_campaigns"]
      },
      {
        label: "Reviews / Avaliacoes",
        href: "/adm/catalogo-marca/reviews",
        icon: "users",
        requiredPermissions: ["manage_reviews"]
      },
      {
        label: "Inteligencia de Catalogo",
        href: "/adm/catalogo-marca/inteligencia",
        icon: "line-chart",
        requiredPermissions: ["manage_campaigns", "view_quality"],
        permissionMode: "any"
      }
    ]
  },
  {
    label: "Relacionamento",
    items: [
      {
        label: "Clientes",
        href: "/adm/relacionamento/clientes",
        icon: "users",
        requiredPermissions: ["view_customers"]
      }
    ]
  },
  {
    label: "Gestao",
    items: [
      {
        label: "Relatorios",
        href: "/adm/gestao/relatorios",
        icon: "line-chart",
        requiredPermissions: ["view_reports"]
      },
      {
        label: "Usuarios Internos",
        href: "/adm/gestao/usuarios-internos",
        icon: "users",
        requiredPermissions: ["manage_users"]
      },
      {
        label: "Log de Atividades",
        href: "/adm/gestao/log-atividades",
        icon: "activity",
        requiredPermissions: ["view_activity_logs"]
      },
      {
        label: "Configuracoes",
        href: "/adm/gestao/configuracoes",
        icon: "settings",
        requiredPermissions: ["manage_settings"]
      }
    ]
  }
];

export const admHiddenRoutes: AdmNavItem[] = [
  {
    label: "Login do ADM",
    href: "/adm/login",
    hidden: true
  },
  {
    label: "Detalhe de Envio",
    href: "/adm/operacao/logistica/envios",
    requiredPermissions: ["manage_logistics"],
    hidden: true,
    matchers: [/^\/adm\/operacao\/logistica\/envios\/[^/]+$/]
  }
];

const flattenNavItems = (items: AdmNavItem[]): AdmNavItem[] =>
  items.flatMap((item) => [item, ...(item.children ? flattenNavItems(item.children) : [])]);

export const admRouteDefinitions: AdmNavItem[] = [
  ...admSidebarGroups.flatMap((group) => flattenNavItems(group.items)),
  ...admHiddenRoutes
];

export interface AdmRouteMeta {
  title: string;
  href: string;
}

const findDynamicMatch = (pathname: string) =>
  admRouteDefinitions.find((item) => item.matchers?.some((matcher) => matcher.test(pathname))) ?? null;

export const admRouteMetaList: AdmRouteMeta[] = admRouteDefinitions.map((item) => ({
  title: item.label,
  href: item.href
}));

export const findAdmRouteDefinition = (pathname: string): AdmNavItem | null => {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  const dynamicMatch = findDynamicMatch(normalized);
  if (dynamicMatch) return dynamicMatch;

  const exact = admRouteDefinitions.find((route) => route.href === normalized);
  if (exact) return exact;

  const prefix = [...admRouteDefinitions]
    .sort((a, b) => b.href.length - a.href.length)
    .find((route) => normalized.startsWith(route.href + "/"));

  return prefix ?? null;
};

export const findAdmRouteMeta = (pathname: string): AdmRouteMeta | null => {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const route = findAdmRouteDefinition(normalized);
  if (!route) return null;

  if (route.matchers?.length) {
    return {
      title: route.label,
      href: normalized
    };
  }

  return {
    title: route.label,
    href: route.href
  };
};

export const getAdmBreadcrumbs = (pathname: string): AdmRouteMeta[] => {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const crumbs: AdmRouteMeta[] = [{ title: "ADM", href: "/adm" }];

  const ordered = [...admRouteDefinitions]
    .filter((route) => !route.hidden && route.href !== "/adm")
    .sort((a, b) => a.href.length - b.href.length);

  for (const route of ordered) {
    if (normalized === route.href || normalized.startsWith(route.href + "/")) {
      crumbs.push({
        title: route.label,
        href: route.href
      });
    }
  }

  const current = findAdmRouteMeta(normalized);
  if (current && !crumbs.some((crumb) => crumb.href === current.href)) {
    crumbs.push(current);
  }

  return crumbs;
};

export const isNavItemActive = (pathname: string, item: AdmNavItem): boolean => {
  if (pathname === item.href) return true;
  if (item.children?.some((child) => isNavItemActive(pathname, child))) return true;
  if (pathname.startsWith(item.href + "/")) return true;
  return false;
};

export const toAdmLegacyPath = (pathname: string): string => {
  const staticMap: Record<string, string> = {
    "/admin": "/adm",
    "/admin/login": "/adm/login",
    "/admin/dashboard": "/adm/dashboard-executivo",
    "/admin/curadoria": "/adm/curadoria/produtos",
    "/admin/catalogo": "/adm/qualidade-catalogo",
    "/admin/produtos": "/adm/curadoria/produtos",
    "/admin/products": "/adm/curadoria/produtos",
    "/admin/products/pending": "/adm/curadoria/produtos?status=pendente",
    "/admin/sellers": "/adm/operacao/parceiros",
    "/admin/parceiros": "/adm/operacao/parceiros",
    "/admin/orders": "/adm/operacao/pedidos-criticos",
    "/admin/pedidos": "/adm/operacao/pedidos-criticos",
    "/admin/frete-logistica": "/adm/operacao/logistica",
    "/admin/finance": "/adm/financeiro",
    "/admin/auditoria": "/adm/financeiro/auditoria",
    "/admin/campaigns": "/adm/catalogo-marca/campanhas",
    "/admin/customers": "/adm/relacionamento/clientes",
    "/admin/settings": "/adm/gestao/configuracoes",
    "/admin/config": "/adm/gestao/configuracoes",
    "/admin/configuracoes": "/adm/gestao/configuracoes"
  };

  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (staticMap[normalized]) {
    return staticMap[normalized];
  }

  if (normalized.startsWith("/admin/lojas/") || normalized.startsWith("/admin/sellers/")) {
    const sellerId = normalized.split("/").at(-1) ?? "";
    return `/adm/operacao/parceiros?seller=${sellerId}`;
  }

  if (normalized.startsWith("/admin/orders/")) {
    const orderId = normalized.split("/").at(-1) ?? "";
    return `/adm/operacao/pedidos-criticos?order=${orderId}`;
  }

  if (normalized.startsWith("/admin/produtos/") || normalized.startsWith("/admin/products/")) {
    const productId = normalized.split("/").at(-1) ?? "";
    return `/adm/curadoria/produtos?product=${productId}`;
  }

  return "/adm";
};
