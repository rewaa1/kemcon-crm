import { Skeleton } from "@/components/ui/skeleton";

export default function HotelDetailLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-40 mt-2" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
