export type BelapopRenderMode = "preview" | "live";

export type BelapopRouteKey =
  | "home"
  | "scan"
  | "scan-capture"
  | "diagnostico"
  | "concierge"
  | "cart"
  | "checkout"
  | "login"
  | "order"
  | "tracking"
  | "feedback"
  | "member"
  | "rewards"
  | "skinbela";

const previewRoutes: Record<BelapopRouteKey, string> = {
  home: "/preview/home",
  scan: "/preview/scan",
  "scan-capture": "/preview/scan-2",
  diagnostico: "/preview/diagnostico",
  concierge: "/preview/concierge",
  cart: "/preview/carrinho",
  checkout: "/preview/checkout",
  login: "/preview/login",
  order: "/preview/pedido",
  tracking: "/preview/rastreio",
  feedback: "/preview/feedback",
  member: "/preview/membro",
  rewards: "/preview/recompensas",
  skinbela: "/preview/skinbela"
};

const liveRoutes: Record<BelapopRouteKey, string> = {
  home: "/",
  scan: "/skin-scan",
  "scan-capture": "/skin-scan/captura",
  diagnostico: "/skin-scan/diagnostico",
  concierge: "/skinbela/concierge",
  cart: "/carrinho",
  checkout: "/checkout",
  login: "/login",
  order: "/pedido/sucesso",
  tracking: "/rastreio",
  feedback: "/feedback",
  member: "/conta",
  rewards: "/conta/recompensas",
  skinbela: "/skinbela"
};

export function getBelapopHref(mode: BelapopRenderMode, key: BelapopRouteKey) {
  return mode === "live" ? liveRoutes[key] : previewRoutes[key];
}

export function getBelapopProductHref(mode: BelapopRenderMode, slug = "orquidea-imperial") {
  return mode === "live" ? `/produto/${slug}` : "/preview/produto";
}
