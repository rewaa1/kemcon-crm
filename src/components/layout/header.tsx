"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Globe, LogOut, Menu, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SidebarContent } from "./sidebar";

type SidebarBadges = { pendingPOs: number; lowStockCount: number };

export function Header({ badges }: { badges?: SidebarBadges }) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const otherLocale = locale === "en" ? "ar" : "en";
  const switchedPath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Cmd+K search trigger (desktop) */}
      <button
        type="button"
        onClick={() => document.dispatchEvent(new CustomEvent("open-command-menu"))}
        className="hidden md:flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-1.5 hover:bg-accent transition-colors ms-4 flex-1 max-w-xs"
        aria-label="Open command menu"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-start">Search...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono bg-muted rounded px-1 py-0.5">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(switchedPath)}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          {otherLocale === "ar" ? "العربية" : "English"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("logout")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 flex flex-col">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavClick={() => setMobileOpen(false)} badges={badges} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
