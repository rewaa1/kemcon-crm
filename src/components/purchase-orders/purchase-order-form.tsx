"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { purchaseOrderSchema, type PurchaseOrderFormValues } from "@/application/purchase-orders/schemas";
import { createPurchaseOrderAction } from "@/app/[locale]/(dashboard)/purchase-orders/actions";
import type { VendorSummary } from "@/domain/vendor";
import type { FabricSummary } from "@/domain/fabric";

type Props = {
  vendors: VendorSummary[];
  fabrics: FabricSummary[];
  locale: string;
};

function LineRow({
  index,
  control,
  fabrics,
  onRemove,
}: {
  index: number;
  control: any;
  fabrics: FabricSummary[];
  onRemove: () => void;
}) {
  const t = useTranslations("purchaseOrders");
  const fabricId = useWatch({ control, name: `lines.${index}.fabricId` });
  const fabric = fabrics.find((f) => f.id === fabricId);
  const isRolls = fabric?.unit === "ROLLS";

  return (
    <TableRow>
      <TableCell className="align-top pt-3">
        <FormField
          control={control}
          name={`lines.${index}.fabricId`}
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder={t("selectFabric")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fabrics.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="font-mono me-2 text-muted-foreground">{f.codeRef}</span>
                      {f.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="align-top pt-3">
        <FormField
          control={control}
          name={`lines.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" min="0" step="0.001" className="w-28" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="align-top pt-3">
        <FormField
          control={control}
          name={`lines.${index}.unitPrice`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" min="0" step="0.01" className="w-28" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="align-top pt-3">
        {isRolls && (
          <FormField
            control={control}
            name={`lines.${index}.metersPerRoll`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" min="0" step="0.001" className="w-28" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </TableCell>
      <TableCell className="align-top pt-3">
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function PurchaseOrderForm({ vendors, fabrics, locale }: Props) {
  const t = useTranslations("purchaseOrders");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema) as Resolver<PurchaseOrderFormValues>,
    defaultValues: {
      poNumber: "",
      vendorId: "",
      expectedAt: "",
      notes: "",
      lines: [{ fabricId: "", quantity: 0, unitPrice: 0, currency: "EGP" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

  function onSubmit(values: PurchaseOrderFormValues) {
    startTransition(async () => {
      const result = await createPurchaseOrderAction(values);
      if (result.success && result.data) {
        toast.success(t("createdSuccess"));
        router.push(`/${locale}/purchase-orders/${result.data.id}`);
      } else if (!result.success) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">{t("orderDetails")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="poNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("poNumber")}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. PO-2026-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendor")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectVendor")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.nameEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expectedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expectedAt")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("notes")}</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder={t("notesPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">{t("lineItems")}</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fabric")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
                  <TableHead>{t("unitPrice")} (EGP)</TableHead>
                  <TableHead>{t("metersPerRoll")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <LineRow
                    key={field.id}
                    index={index}
                    control={form.control}
                    fabrics={fabrics}
                    onRemove={() => remove(index)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          {form.formState.errors.lines?.root && (
            <p className="text-sm text-destructive">{form.formState.errors.lines.root.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ fabricId: "", quantity: 0, unitPrice: 0, currency: "EGP" })}
          >
            <Plus className="h-4 w-4 me-2" />
            {t("addLine")}
          </Button>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/purchase-orders`)}
          >
            {tc("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? tc("saving") : t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
