"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { fabricSchema, type FabricFormValues } from "@/application/fabrics/schemas";
import { createFabricAction, updateFabricAction } from "@/app/[locale]/(dashboard)/fabrics/actions";
import { createClient } from "@/lib/supabase/client";
import type { FabricSummary } from "@/domain/fabric";

type VendorOption = { id: string; nameEn: string; nameAr: string | null };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabric?: FabricSummary;
  vendors: VendorOption[];
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET = "fabric-images";

export function FabricFormDialog({ open, onOpenChange, fabric, vendors }: Props) {
  const t = useTranslations("fabrics");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!fabric;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(fabric?.imageUrl ?? null);
  const [imageRemoved, setImageRemoved] = useState(false);

  const form = useForm<FabricFormValues>({
    resolver: zodResolver(fabricSchema),
    defaultValues: {
      codeRef: fabric?.codeRef ?? "",
      nameEn: fabric?.nameEn ?? "",
      nameAr: fabric?.nameAr ?? "",
      description: "",
      unit: fabric?.unit ?? "METERS",
      vendorIds: fabric?.vendors.map((v) => v.vendorId) ?? [],
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("imageTooBig"));
      return;
    }
    setSelectedFile(file);
    setImageRemoved(false);
    setPreviewSrc(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setSelectedFile(null);
    setPreviewSrc(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose(open: boolean) {
    onOpenChange(open);
    if (!open) {
      setSelectedFile(null);
      setPreviewSrc(fabric?.imageUrl ?? null);
      setImageRemoved(false);
      form.reset();
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  function onSubmit(values: FabricFormValues) {
    startTransition(async () => {
      let imageUrl: string | null | undefined;

      if (imageRemoved) {
        imageUrl = null;
      } else if (selectedFile) {
        const url = await uploadImage(selectedFile);
        if (!url) {
          toast.error(t("imageUploadFailed"));
          return;
        }
        imageUrl = url;
      } else {
        imageUrl = isEdit ? (fabric.imageUrl ?? undefined) : undefined;
      }

      const result = isEdit
        ? await updateFabricAction(fabric.id, { ...values, imageUrl })
        : await createFabricAction({ ...values, imageUrl: imageUrl ?? undefined });

      if (result.success) {
        toast.success(isEdit ? t("updatedSuccess") : t("createdSuccess"));
        handleClose(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("new")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Image upload */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-20 h-20 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                {previewSrc ? (
                  <Image src={previewSrc} alt="" width={80} height={80} className="w-full h-full object-cover" unoptimized={previewSrc.startsWith("blob:")} />
                ) : (
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <p className="text-sm font-medium">{t("image")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 me-1.5" />
                    {previewSrc ? t("changeImage") : t("uploadImage")}
                  </Button>
                  {previewSrc && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3.5 w-3.5 me-1.5" />
                      {t("removeImage")}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP · max 5 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codeRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("codeRef")}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. FAB-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("unit")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="METERS">{t("unitMeters")}</SelectItem>
                        <SelectItem value="ROLLS">{t("unitRolls")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nameEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Velvet Curtain" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("nameAr")}</FormLabel>
                    <FormControl>
                      <Input dir="rtl" placeholder="مثال: ستارة مخمل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder={t("descriptionPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {vendors.length > 0 && (
              <FormField
                control={form.control}
                name="vendorIds"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("vendors")}</FormLabel>
                    <div className="max-h-36 overflow-y-auto rounded-md border p-3 space-y-2">
                      {vendors.map((vendor) => (
                        <FormField
                          key={vendor.id}
                          control={form.control}
                          name="vendorIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(vendor.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? [];
                                    field.onChange(
                                      checked
                                        ? [...current, vendor.id]
                                        : current.filter((id) => id !== vendor.id)
                                    );
                                  }}
                                />
                              </FormControl>
                              <span className="text-sm">{vendor.nameEn}</span>
                              {vendor.nameAr && (
                                <span className="text-sm text-muted-foreground" dir="rtl">
                                  ({vendor.nameAr})
                                </span>
                              )}
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? tc("saving") : tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
