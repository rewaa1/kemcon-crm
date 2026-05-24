"use client";

import { useState, useMemo } from "react";

export type SortDir = "asc" | "desc";
export type SortState<K extends string> = { key: K; dir: SortDir } | null;

export function useTableSort<T, K extends string>(
  data: T[],
  getSortValue: (row: T, key: K) => string | number | Date | null | undefined,
  initialSort?: SortState<K>
) {
  const [sort, setSort] = useState<SortState<K>>(initialSort ?? null);

  function toggle(key: K) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  const sorted = useMemo(() => {
    if (!sort) return data;
    return [...data].sort((a, b) => {
      const av = getSortValue(a, sort.key) ?? "";
      const bv = getSortValue(b, sort.key) ?? "";
      let cmp = 0;
      if (av instanceof Date && bv instanceof Date) {
        cmp = av.getTime() - bv.getTime();
      } else if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [data, sort, getSortValue]);

  return { sorted, sort, toggle, setSort };
}
