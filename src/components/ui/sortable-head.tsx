"use client";

import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortState, SortDir } from "@/lib/use-table-sort";

type Props<K extends string> = {
  sortKey: K;
  sort: SortState<K>;
  onToggle: (key: K) => void;
  children: React.ReactNode;
  className?: string;
};

export function SortableHead<K extends string>({
  sortKey,
  sort,
  onToggle,
  children,
  className,
}: Props<K>) {
  const active = sort?.key === sortKey;
  const dir: SortDir | null = active ? sort!.dir : null;

  return (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap group", className)}
      onClick={() => onToggle(sortKey)}
    >
      <span className="flex items-center gap-1">
        {children}
        {active && dir === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 text-foreground" />
        ) : active && dir === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-40" />
        )}
      </span>
    </TableHead>
  );
}
