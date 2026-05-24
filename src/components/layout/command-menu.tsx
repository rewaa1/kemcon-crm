"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FolderKanban,
  Building2,
  ShoppingCart,
  Package,
  Layers,
  Truck,
  BarChart3,
  LayoutDashboard,
  Plus,
} from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onCustom() {
      setOpen((o) => !o);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("open-command-menu", onCustom);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("open-command-menu", onCustom);
    };
  }, []);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(`/${locale}${path}`);
    },
    [locale, router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={tc("commandPlaceholder")} />
      <CommandList>
        <CommandEmpty>{tc("noResults")}</CommandEmpty>

        <CommandGroup heading={t("groupOperations")}>
          <CommandItem onSelect={() => go("/projects")}>
            <FolderKanban className="h-4 w-4 me-2" />
            {t("projects")}
          </CommandItem>
          <CommandItem onSelect={() => go("/projects/new")}>
            <Plus className="h-4 w-4 me-2" />
            {tc("newProject")}
          </CommandItem>
          <CommandItem onSelect={() => go("/hotels")}>
            <Building2 className="h-4 w-4 me-2" />
            {t("hotels")}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("groupCatalog")}>
          <CommandItem onSelect={() => go("/inventory")}>
            <Package className="h-4 w-4 me-2" />
            {t("inventory")}
          </CommandItem>
          <CommandItem onSelect={() => go("/fabrics")}>
            <Layers className="h-4 w-4 me-2" />
            {t("fabrics")}
          </CommandItem>
          <CommandItem onSelect={() => go("/purchase-orders")}>
            <ShoppingCart className="h-4 w-4 me-2" />
            {t("purchaseOrders")}
          </CommandItem>
          <CommandItem onSelect={() => go("/purchase-orders/new")}>
            <Plus className="h-4 w-4 me-2" />
            {tc("newPurchaseOrder")}
          </CommandItem>
          <CommandItem onSelect={() => go("/vendors")}>
            <Truck className="h-4 w-4 me-2" />
            {t("vendors")}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("groupAnalytics")}>
          <CommandItem onSelect={() => go("")}>
            <LayoutDashboard className="h-4 w-4 me-2" />
            {t("dashboard")}
          </CommandItem>
          <CommandItem onSelect={() => go("/reports")}>
            <BarChart3 className="h-4 w-4 me-2" />
            {t("reports")}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
