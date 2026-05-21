"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { receivePurchaseOrderAction } from "@/app/[locale]/(dashboard)/purchase-orders/actions";

type Props = { id: string };

export function ReceivePOButton({ id }: Props) {
  const t = useTranslations("purchaseOrders");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleReceive() {
    startTransition(async () => {
      const result = await receivePurchaseOrderAction(id);
      if (result.success) {
        toast.success(t("receivedSuccess"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="default" size="sm" onClick={() => setOpen(true)}>
        <PackageCheck className="h-4 w-4 me-2" />
        {t("receive")}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("receive")}</AlertDialogTitle>
            <AlertDialogDescription>{t("receiveConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReceive} disabled={isPending}>
              {isPending ? tc("saving") : t("receive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
