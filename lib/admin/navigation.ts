export type AdminNavItem = {
  label: string;
  href: string;
  match?: string[];
};

export type AdminNavGroup = {
  section: string;
  items: AdminNavItem[];
};

export const adminNav: AdminNavGroup[] = [
  {
    section: "Visao",
    items: [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "Pedidos", href: "/admin/orders", match: ["/admin/pedidos"] },
      { label: "Financeiro", href: "/admin/finance" }
    ]
  },
  {
    section: "Operacao",
    items: [
      { label: "Frete e logistica", href: "/admin/frete-logistica" },
      { label: "Atendimento", href: "/admin/atendimento" },
      { label: "Suporte", href: "/admin/support" }
    ]
  },
  {
    section: "Marketplace",
    items: [
      {
        label: "Lojas",
        href: "/admin/sellers",
        match: ["/admin/lojas", "/admin/parceiros"]
      },
      { label: "Produtos", href: "/admin/products", match: ["/admin/produtos"] },
      {
        label: "Catalogo",
        href: "/admin/curadoria",
        match: ["/admin/catalogo", "/admin/curadoria", "/admin/products/pending", "/admin/produtos/pendentes"]
      },
      { label: "Marketing", href: "/admin/marketing" },
      { label: "Campanhas", href: "/admin/campaigns" }
    ]
  },
  {
    section: "Sistema",
    items: [
      { label: "Usuarios e RBAC", href: "/admin/rbac" },
      { label: "Auditoria", href: "/admin/auditoria" },
      {
        label: "Configuracoes",
        href: "/admin/settings",
        match: ["/admin/configuracoes", "/admin/config"]
      }
    ]
  },
  {
    section: "Conteudo",
    items: [
      { label: "Diario", href: "/admin/diario" },
      {
        label: "SkinBela Evidence",
        href: "/admin/skinbela-evidence",
        match: ["/admin/evidencias-clinicas", "/admin/skingpt", "/admin/skingpt-evidence"]
      }
    ]
  }
];

export const isAdminNavItemActive = (pathname: string, item: AdminNavItem) => {
  const candidates = [item.href, ...(item.match ?? [])];
  return candidates.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};
