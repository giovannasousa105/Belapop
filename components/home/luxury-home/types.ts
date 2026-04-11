export type LuxuryIconName =
  | "search"
  | "star"
  | "favorite"
  | "person"
  | "account_circle"
  | "shopping_bag"
  | "menu"
  | "close"
  | "expand_more"
  | "arrow_forward"
  | "verified_user"
  | "lock"
  | "local_shipping"
  | "dashboard"
  | "workspace_premium"
  | "card_giftcard"
  | "auto_awesome"
  | "settings"
  | "help_outline"
  | "logout"
  | "science"
  | "menu_book"
  | "verified"
  | "photo_camera"
  | "mic"
  | "north"
  | "auto_stories";

export type NavLink = {
  href: string;
  label: string;
};

export type SideNavItem = {
  href: string;
  label: string;
  icon: LuxuryIconName;
  active?: boolean;
};

export type RecommendationProduct = {
  brand: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  href: string;
};

export type ChatTag = {
  icon: LuxuryIconName;
  label: string;
};

export type ChatMessage = {
  role: "assistant" | "user";
  body: string;
  emphasis?: string;
  tags?: ChatTag[];
  recommendations?: RecommendationProduct[];
};

export type DiagnosisMetric = {
  label: string;
  value: string;
  progress: number;
  accent?: boolean;
  note?: string;
};

export type EvidenceEntry = {
  title: string;
  source: string;
};

export type FooterLinkGroup = {
  title: string;
  links: Array<{
    href: string;
    label: string;
  }>;
};
