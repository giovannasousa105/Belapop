const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname.startsWith(prefix));

export const isConsultoraBelaPopEnabledPath = (pathname: string | null | undefined) => {
  if (!pathname) return false;

  if (pathname.startsWith("/skin-scan")) {
    return false;
  }

  if (
    startsWithAny(pathname, [
      "/admin",
      "/adm",
      "/seller",
      "/parceiro",
      "/account",
      "/conta",
      "/auth",
      "/api",
      "/mfa"
    ])
  ) {
    return false;
  }

  if (startsWithAny(pathname, ["/popclub", "/belacode", "/skinbela"])) {
    return false;
  }

  return (
    pathname === "/" ||
    pathname === "/catalogo" ||
    pathname === "/skincare" ||
    pathname === "/maquiagem" ||
    pathname === "/cabelos" ||
    pathname === "/perfumes" ||
    pathname === "/carrinho" ||
    pathname === "/rituais" ||
    pathname === "/universos" ||
    pathname === "/products" ||
    startsWithAny(pathname, ["/produto/", "/skin-scan", "/diario", "/universos/"])
  );
};

export const getConsultoraMobileDockOffset = (pathname: string | null | undefined) => {
  if (!pathname) return "bottom-4";
  if (pathname.startsWith("/skin-scan")) return "bottom-[1.5rem]";
  if (pathname.startsWith("/produto/")) return "bottom-[5.5rem]";
  if (pathname.startsWith("/universos/")) return "bottom-[5.5rem]";
  if (pathname.startsWith("/checkout")) return "bottom-[1.25rem]";
  return "bottom-4";
};
