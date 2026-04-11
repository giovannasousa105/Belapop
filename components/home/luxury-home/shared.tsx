import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Camera,
  ChevronDown,
  CircleHelp,
  CircleUserRound,
  Crown,
  Gift,
  Heart,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Mic,
  MoveUp,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  TestTubeDiagonal,
  Truck,
  UserRound,
  Verified,
  type LucideIcon,
  X
} from "lucide-react";
import type { ReactNode } from "react";

import { headlineFont } from "@/components/home/luxury-home/theme";
import type { LuxuryIconName } from "@/components/home/luxury-home/types";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const headlineClassName = headlineFont.className;

const iconMap: Record<LuxuryIconName, LucideIcon> = {
  search: Search,
  star: Star,
  favorite: Heart,
  person: UserRound,
  account_circle: CircleUserRound,
  shopping_bag: ShoppingBag,
  menu: Menu,
  close: X,
  expand_more: ChevronDown,
  arrow_forward: ArrowRight,
  verified_user: ShieldCheck,
  lock: LockKeyhole,
  local_shipping: Truck,
  dashboard: LayoutDashboard,
  workspace_premium: Crown,
  card_giftcard: Gift,
  auto_awesome: Sparkles,
  settings: Settings,
  help_outline: CircleHelp,
  logout: LogOut,
  science: TestTubeDiagonal,
  menu_book: BookOpenText,
  verified: Verified,
  photo_camera: Camera,
  mic: Mic,
  north: MoveUp,
  auto_stories: BookOpenText
};

export function IconGlyph({
  name,
  className,
  strokeWidth = 1.7
}: {
  name: LuxuryIconName;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = iconMap[name];

  return <Icon aria-hidden className={cx("h-5 w-5", className)} strokeWidth={strokeWidth} />;
}

export function SectionContainer({
  children,
  className,
  maxWidthClassName = "max-w-[1800px]"
}: {
  children: ReactNode;
  className?: string;
  maxWidthClassName?: string;
}) {
  return (
    <div className={cx("mx-auto w-full px-4 sm:px-5 lg:px-8", maxWidthClassName, className)}>
      {children}
    </div>
  );
}

export function TextLink({
  href,
  className,
  children,
  onClick
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
