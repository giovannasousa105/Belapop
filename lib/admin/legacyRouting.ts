const EXACT_ROUTE_MAP: Record<string, string> = {
  "/admin/pedidos": "/admin/orders",
  "/admin/parceiros": "/admin/sellers",
  "/admin/lojas": "/admin/sellers",
  "/admin/produtos": "/admin/products",
  "/admin/produtos/pendentes": "/admin/products/pending",
  "/admin/catalogo": "/admin/curadoria",
  "/admin/configuracoes": "/admin/settings",
  "/admin/config": "/admin/settings"
};

const PREFIX_ROUTE_MAP: Array<{ from: string; to: string }> = [
  { from: "/admin/lojas/", to: "/admin/sellers/" },
  { from: "/admin/produtos/", to: "/admin/products/" }
];

const normalizePathname = (pathname: string) => {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

export function resolveCanonicalAdminPath(pathname: string): string | null {
  const normalized = normalizePathname(pathname);

  if (EXACT_ROUTE_MAP[normalized]) {
    return EXACT_ROUTE_MAP[normalized];
  }

  for (const mapping of PREFIX_ROUTE_MAP) {
    if (normalized.startsWith(mapping.from)) {
      const suffix = normalized.slice(mapping.from.length);
      if (!suffix) return mapping.to.slice(0, -1);
      if (suffix.startsWith("pendentes")) {
        return "/admin/products/pending";
      }
      return `${mapping.to}${suffix}`;
    }
  }

  return null;
}
