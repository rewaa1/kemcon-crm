"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { HotelFormDialog } from "./hotel-form-dialog";
import type { Hotel } from "@/domain/hotel";

type Props = { hotel: Hotel };

export function HotelDetailHeader({ hotel }: Props) {
  const t = useTranslations("hotels");
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{hotel.nameEn}</h1>
          <p className="text-muted-foreground mt-1" dir="rtl">{hotel.nameAr}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Pencil className="h-4 w-4 me-2" />
          {t("edit")}
        </Button>
      </div>

      <HotelFormDialog
        open={open}
        onOpenChange={setOpen}
        hotel={{ id: hotel.id, nameEn: hotel.nameEn, nameAr: hotel.nameAr }}
      />
    </>
  );
}
