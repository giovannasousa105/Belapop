"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  LayoutDashboard,
  LineChart,
  Megaphone,
  MessageSquare,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Truck,
  Users,
  Wallet,
  X
} from "lucide-react";

import type { AdmChromeVariant } from "@/lib/adm/dashboardTheme";
import type { AdmIconKey, AdmNavGroup } from "@/lib/adm/navigation";
import { isNavItemActive } from "@/lib/adm/navigation";
import type { AuthenticatedAdmUser } from "@/types/adm/auth";

type AdmSidebarProps = {
  groups: AdmNavGroup[];
  mobileOpen: boolean;
  onCloseMobile: () => void;
  user: AuthenticatedAdmUser;
  roleLabel: string;
  variant: AdmChromeVariant;
};

const iconClassName = "h-[18px] w-[18px] shrink-0";

const iconMap: Record<AdmIconKey, ReactNode> = {
  "layout-dashboard": <LayoutDashboard className={iconClassName} />,
  sparkles: <Sparkles className={iconClassName} />,
  "shield-check": <ShieldCheck className={iconClassName} />,
  "scroll-text": <ScrollText className={iconClassName} />,
  truck: <Truck className={iconClassName} />,
  "triangle-alert": <TriangleAlert className={iconClassName} />,
  wallet: <Wallet className={iconClassName} />,
  "line-chart": <LineChart className={iconClassName} />,
  megaphone: <Megaphone className={iconClassName} />,
  users: <Users className={iconClassName} />,
  settings: <Settings className={iconClassName} />,
  activity: <Activity className={iconClassName} />,
  "message-square": <MessageSquare className={iconClassName} />
};

export function AdmSidebar({
  groups,
  mobileOpen,
  onCloseMobile,
  user,
  roleLabel,
  variant
}: AdmSidebarProps) {
  const pathname = usePathname();
  const isWorkspaceVariant = variant === "workspace";

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          onClick={onCloseMobile}
          className={`fixed inset-0 z-40 backdrop-blur-[2px] lg:hidden ${
            isWorkspaceVariant ? "bg-slate-950/30" : "bg-[#1f211d]/40"
          }`}
          aria-label="Fechar menu do ADM"
        />
      ) : null}

      <aside
        className={`adm-scrollbar fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto border-r border-[var(--adm-border)] bg-[var(--adm-sidebar)] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--adm-border)] px-5 py-5 lg:px-6">
          <div>
            <p
              className={`text-[var(--adm-text)] ${
                isWorkspaceVariant
                  ? "text-[1.0625rem] font-semibold tracking-[-0.02em]"
                  : "font-editorial text-[1.65rem] tracking-[-0.04em]"
              }`}
            >
              BelaPop
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[var(--adm-text-soft)]">
              {isWorkspaceVariant ? "Enterprise Control" : "Curator Admin"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className={`inline-flex h-11 w-11 items-center justify-center border border-[var(--adm-border)] bg-white text-[var(--adm-text)] lg:hidden ${
              isWorkspaceVariant ? "rounded-xl shadow-[var(--adm-shadow-micro)]" : "rounded-full"
            }`}
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-8 px-4 py-5 lg:px-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p
                className={`px-3 font-semibold uppercase text-[var(--adm-text-soft)] ${
                  isWorkspaceVariant ? "text-[11px] tracking-[0.16em]" : "text-[10px] tracking-[0.24em]"
                }`}
              >
                {group.label}
              </p>
              <div className="mt-3 space-y-1.5">
                {group.items.map((item) => {
                  const active = isNavItemActive(pathname, item);

                  return (
                    <div key={item.href} className="space-y-1">
                      <Link
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`group flex min-h-[50px] items-center gap-3 px-3.5 py-3 text-sm transition-all ${
                          active
                            ? isWorkspaceVariant
                              ? "rounded-2xl border border-[var(--adm-border-strong)] bg-white font-semibold text-[var(--adm-text)] shadow-[var(--adm-shadow-micro)]"
                              : "rounded-2xl bg-white font-semibold text-[var(--adm-text)] shadow-[var(--adm-shadow-micro)]"
                            : isWorkspaceVariant
                              ? "rounded-2xl text-[var(--adm-text-muted)] hover:bg-white hover:text-[var(--adm-text)]"
                              : "rounded-2xl text-[var(--adm-text-muted)] hover:bg-white/70 hover:text-[var(--adm-text)]"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center transition-colors ${
                            active
                              ? isWorkspaceVariant
                                ? "rounded-xl bg-[var(--adm-surface-soft)] text-[var(--adm-primary)]"
                                : "rounded-full bg-[var(--adm-surface-soft)] text-[var(--adm-text)]"
                              : isWorkspaceVariant
                                ? "rounded-xl bg-[var(--adm-surface-muted)] text-[var(--adm-text-soft)] group-hover:bg-[var(--adm-surface-soft)] group-hover:text-[var(--adm-primary)]"
                                : "rounded-full bg-white/60 text-[var(--adm-text-soft)] group-hover:bg-[var(--adm-surface-soft)] group-hover:text-[var(--adm-text)]"
                          }`}
                        >
                          {item.icon ? iconMap[item.icon] : null}
                        </span>
                        <span className="min-w-0 flex-1 leading-tight">{item.label}</span>
                      </Link>

                      {item.children ? (
                        <div className="ml-12 space-y-1">
                          {item.children.map((subItem) => {
                            const subActive = isNavItemActive(pathname, subItem);
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={onCloseMobile}
                                className={`block rounded-xl px-3 py-2 text-xs uppercase transition ${
                                  subActive
                                    ? isWorkspaceVariant
                                      ? "bg-[var(--adm-surface-soft)] font-medium tracking-[0.12em] text-[var(--adm-primary)]"
                                      : "bg-[var(--adm-surface-soft)] tracking-[0.16em] text-[var(--adm-text)]"
                                    : isWorkspaceVariant
                                      ? "tracking-[0.12em] text-[var(--adm-text-soft)] hover:bg-white hover:text-[var(--adm-text)]"
                                      : "tracking-[0.16em] text-[var(--adm-text-soft)] hover:bg-white/70 hover:text-[var(--adm-text)]"
                                }`}
                              >
                                {subItem.label}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--adm-border)] px-5 py-5">
          <div
            className={`px-4 py-4 shadow-[var(--adm-shadow-micro)] ${
              isWorkspaceVariant
                ? "rounded-2xl border border-[var(--adm-border)] bg-white"
                : "rounded-[20px] bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center bg-[var(--adm-surface-soft)] text-sm font-semibold uppercase ${
                  isWorkspaceVariant
                    ? "rounded-xl text-[var(--adm-primary)]"
                    : "rounded-full text-[var(--adm-text)]"
                }`}
              >
                {user.name.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--adm-text)]">{user.name}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
