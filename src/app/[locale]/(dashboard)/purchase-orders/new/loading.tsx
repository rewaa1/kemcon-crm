import { Skeleton } from "@/components/ui/skeleton";

export default function NewPurchaseOrderLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Header fields */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
