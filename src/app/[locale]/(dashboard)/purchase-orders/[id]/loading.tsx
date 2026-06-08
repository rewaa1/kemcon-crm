import { Skeleton } from "@/components/ui/skeleton";

export default function PurchaseOrderDetailLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-9 w-48" />
      </div>

      {/* Header info card */}
      <div className="rounded-lg border p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Line items table */}
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
