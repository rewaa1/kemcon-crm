"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import type { PurchaseOrderSummary, PurchaseOrderStatus } from "@/domain/purchase-order";

type Props = { orders: PurchaseOrderSummary[]; locale: string };

const STATUS_VARIANT: Record<PurchaseOrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  RECEIVED: "default",
  PARTIAL: "outline",
  CANCELLED: "destructive",
};

export function PurchaseOrdersTable({ orders, locale }: Props) {
  const t = useTranslations("purchaseOrders");
  const tc = useTranslations("common");

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={t("noOrders")}
        description={t("noOrdersDesc")}
        action={
          <Button asChild>
            <Link href={`/${locale}/purchase-orders/new`}>{t("new")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[110px]">{t("poNumber")}</TableHead>
            <TableHead className="min-w-[140px]">{t("vendor")}</TableHead>
            <TableHead>{tc("status")}</TableHead>
            <TableHead className="text-center">{t("lines")}</TableHead>
            <TableHead className="min-w-[110px]">{t("orderedAt")}</TableHead>
            <TableHead className="min-w-[110px]">{t("expectedAt")}</TableHead>
            <TableHead className="text-end">{tc("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-muted/50">
              <TableCell className="font-mono font-medium">{order.poNumber}</TableCell>
              <TableCell>
                <div>{order.vendor.nameEn}</div>
                {order.vendor.nameAr && (
                  <div className="text-sm text-muted-foreground" dir="rtl">{order.vendor.nameAr}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[order.status]}>
                  {t(`status.${order.status}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{order._count.lines}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(order.orderedAt), "dd MMM yyyy")}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {order.expectedAt ? format(new Date(order.expectedAt), "dd MMM yyyy") : "—"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${locale}/purchase-orders/${order.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
