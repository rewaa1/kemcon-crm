"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Layers,
  Truck,
  Building2,
  BarChart3,
  ShoppingCart,
} from "lucide-react";

type SidebarBadges = { pendingPOs: number; lowStockCount: number };
type NavLink = { href: string; label: string; icon: React.ElementType; badge?: number };
type NavGroup = { label: string; links: NavLink[] };

export function SidebarContent({
  onNavClick,
  badges,
}: {
  onNavClick?: () => void;
  badges?: SidebarBadges;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      label: "",
      links: [
        { href: `/${locale}`, label: t("dashboard"), icon: LayoutDashboard },
      ],
    },
    {
      label: t("groupOperations"),
      links: [
        { href: `/${locale}/projects`, label: t("projects"), icon: FolderKanban },
        { href: `/${locale}/hotels`, label: t("hotels"), icon: Building2 },
      ],
    },
    {
      label: t("groupCatalog"),
      links: [
        {
          href: `/${locale}/inventory`,
          label: t("inventory"),
          icon: Package,
          badge: badges?.lowStockCount && badges.lowStockCount > 0 ? badges.lowStockCount : undefined,
        },
        { href: `/${locale}/fabrics`, label: t("fabrics"), icon: Layers },
        {
          href: `/${locale}/purchase-orders`,
          label: t("purchaseOrders"),
          icon: ShoppingCart,
          badge: badges?.pendingPOs && badges.pendingPOs > 0 ? badges.pendingPOs : undefined,
        },
        { href: `/${locale}/vendors`, label: t("vendors"), icon: Truck },
      ],
    },
    {
      label: t("groupAnalytics"),
      links: [
        { href: `/${locale}/reports`, label: t("reports"), icon: BarChart3 },
      ],
    },
  ];

  function isActive(href: string) {
    return href === `/${locale}` ? pathname === href : pathname.startsWith(href);
  }

  return (
    <>
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <span className="font-bold text-lg tracking-tight">Kemcon CRM</span>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            {group.label && (
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.links.map(({ href, label, icon: Icon, badge }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive(href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge !== undefined && (
                    <span className="ms-auto min-w-[20px] text-center text-[11px] font-semibold leading-5 px-1.5 rounded-full bg-destructive text-destructive-foreground">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

export function Sidebar({ badges }: { badges?: SidebarBadges }) {
  return (
    <aside className="hidden md:flex w-64 border-e bg-card flex-col shrink-0">
      <SidebarContent badges={badges} />
    </aside>
  );
}
