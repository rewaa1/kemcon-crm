"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DeletePOButton } from "./delete-po-button";
import { ReceivePOButton } from "./receive-po-button";
import type { PurchaseOrder } from "@/domain/purchase-order";
import { PO_STATUS_VARIANT } from "@/lib/status-variants";

type Props = { order: PurchaseOrder; locale: string };

export function PurchaseOrderDetail({ order, locale }: Props) {
  const t = useTranslations("purchaseOrders");

  const totalValue = order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">{t("details")}</h2>
          <Badge variant={PO_STATUS_VARIANT[order.status]}>{t(`status.${order.status}`)}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">{t("vendor")}</span>
            <p className="font-medium mt-0.5">{order.vendor.nameEn}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t("orderedAt")}</span>
            <p className="font-medium mt-0.5">{format(new Date(order.orderedAt), "dd MMM yyyy")}</p>
          </div>
          {order.expectedAt && (
            <div>
              <span className="text-muted-foreground">{t("expectedAt")}</span>
              <p className="font-medium mt-0.5">{format(new Date(order.expectedAt), "dd MMM yyyy")}</p>
            </div>
          )}
          {order.receivedAt && (
            <div>
              <span className="text-muted-foreground">{t("receivedAt")}</span>
              <p className="font-medium mt-0.5">{format(new Date(order.receivedAt), "dd MMM yyyy")}</p>
            </div>
          )}
          {order.notes && (
            <div className="col-span-2">
              <span className="text-muted-foreground">{t("notes")}</span>
              <p className="mt-0.5">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">{t("lineItems")}</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fabricCode")}</TableHead>
                <TableHead>{t("fabric")}</TableHead>
                <TableHead className="text-end">{t("quantity")}</TableHead>
                <TableHead className="text-end">{t("unitPrice")}</TableHead>
                <TableHead className="text-end">{t("metersPerRoll")}</TableHead>
                <TableHead className="text-end">{t("lineTotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-sm">{line.fabric.codeRef}</TableCell>
                  <TableCell>
                    <div>{line.fabric.nameEn}</div>
                    {line.fabric.nameAr && (
                      <div className="text-sm text-muted-foreground" dir="rtl">{line.fabric.nameAr}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    {line.quantity} {line.fabric.unit === "METERS" ? t("unitMeters") : t("unitRolls")}
                  </TableCell>
                  <TableCell className="text-end">
                    {line.unitPrice.toLocaleString()} {line.currency}
                  </TableCell>
                  <TableCell className="text-end text-muted-foreground">
                    {line.metersPerRoll != null ? `${line.metersPerRoll}m` : "—"}
                  </TableCell>
                  <TableCell className="text-end font-medium">
                    {(line.quantity * line.unitPrice).toLocaleString()} {line.currency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end">
          <p className="text-sm">
            <span className="text-muted-foreground me-2">{t("totalValue")}</span>
            <span className="font-semibold">{totalValue.toLocaleString()} EGP</span>
          </p>
        </div>
      </div>

      {order.status === "PENDING" && (
        <div className="flex justify-end gap-2">
          <ReceivePOButton id={order.id} />
          <DeletePOButton id={order.id} locale={locale} poNumber={order.poNumber} />
        </div>
      )}
    </div>
  );
}
