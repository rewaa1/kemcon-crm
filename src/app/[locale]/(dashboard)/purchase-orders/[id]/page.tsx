import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseOrderRepository } from "@/infrastructure/repositories/purchase-order.repository";
import { getPurchaseOrderById } from "@/application/purchase-orders/queries/get-purchase-order-by-id";
import { PurchaseOrderNotFoundError } from "@/domain/errors";
import { PurchaseOrderDetail } from "@/components/purchase-orders/purchase-order-detail";

const repo = new PurchaseOrderRepository();

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  let order;
  try {
    order = await getPurchaseOrderById(repo, id);
  } catch (e) {
    if (e instanceof PurchaseOrderNotFoundError) notFound();
    throw e;
  }

  const t = await getTranslations("purchaseOrders");

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ms-2 mb-2">
          <Link href={`/${locale}/purchase-orders`}>
            <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
            {t("backToList")}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{order.poNumber}</h1>
      </div>
      <PurchaseOrderDetail order={order} locale={locale} />
    </div>
  );
}
