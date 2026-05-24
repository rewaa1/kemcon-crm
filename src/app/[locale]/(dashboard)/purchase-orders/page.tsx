import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PurchaseOrderRepository } from "@/infrastructure/repositories/purchase-order.repository";
import { getPurchaseOrders } from "@/application/purchase-orders/queries/get-purchase-orders";
import { PurchaseOrdersTable } from "@/components/purchase-orders/purchase-orders-table";

const repo = new PurchaseOrderRepository();

export default async function PurchaseOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ dueToday?: string }>;
}) {
  const [{ locale }, sp, orders, t] = await Promise.all([
    params,
    searchParams,
    getPurchaseOrders(repo),
    getTranslations("purchaseOrders"),
  ]);

  const initialDueToday = sp.dueToday === "true";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Button asChild>
            <Link href={`/${locale}/purchase-orders/new`}>
              <Plus className="h-4 w-4 me-2" />
              {t("new")}
            </Link>
          </Button>
        }
      />
      <PurchaseOrdersTable orders={orders} locale={locale} initialDueToday={initialDueToday} />
    </div>
  );
}
