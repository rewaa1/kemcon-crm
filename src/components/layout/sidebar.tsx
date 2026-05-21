"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Truck,
  Building2,
  BarChart3,
  ShoppingCart,
} from "lucide-react";

export function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const links = [
    { href: `/${locale}`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/projects`, label: t("projects"), icon: FolderKanban },
    { href: `/${locale}/inventory`, label: t("inventory"), icon: Package },
    { href: `/${locale}/purchase-orders`, label: t("purchaseOrders"), icon: ShoppingCart },
    { href: `/${locale}/vendors`, label: t("vendors"), icon: Truck },
    { href: `/${locale}/hotels`, label: t("hotels"), icon: Building2 },
    { href: `/${locale}/reports`, label: t("reports"), icon: BarChart3 },
  ];

  return (
    <>
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <span className="font-bold text-lg tracking-tight">Kemcon CRM</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 border-e bg-card flex-col shrink-0">
      <SidebarContent />
    </aside>
  );
}
