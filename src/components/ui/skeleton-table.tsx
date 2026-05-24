import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="border-b bg-muted/50 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${Math.floor(60 + Math.random() * 80)}px` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b last:border-0 px-4 py-3.5 flex items-center gap-4">
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
          <Skeleton className="h-4 flex-1 max-w-[140px]" />
          <Skeleton className="h-5 w-20 rounded-full" />
          {cols > 3 && <Skeleton className="h-4 w-24" />}
          {cols > 4 && <Skeleton className="h-4 w-24" />}
          <Skeleton className="h-4 w-16 ms-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  );
}
