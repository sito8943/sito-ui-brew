import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { array } from "some-javascript-utils";

export type SortKey = "name" | "kind" | "size";
export type SizeMap = Record<string, { bytes?: number | null; human?: string | null }>;

export default function useTableSort<T extends { name: string; kind: string }>(
  items: T[],
  sizes: SizeMap
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSort = (searchParams.get("sort") as SortKey | null) || "name";
  const initialDir = searchParams.get("dir") === "desc" ? false : true;

  const [sortKey, setSortKey] = useState<SortKey>(initialSort);
  const [sortAsc, setSortAsc] = useState<boolean>(initialDir);

  const rows = useMemo(() => {
    const copy = items.slice();
    if (sortKey === "name" || sortKey === "kind") {
      return array.sortBy(copy, sortKey, sortAsc, null);
    }
    return array.sortBy(copy, undefined, sortAsc, (it: T) => {
      const key = `${it.kind}:${it.name}`;
      const bytes = sizes[key]?.bytes;
      const fallback = sortAsc ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      return typeof bytes === "number" ? bytes : fallback;
    });
  }, [items, sortKey, sortAsc, sizes]);

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortAsc((v) => !v);
    else {
      setSortKey(k);
      setSortAsc(true);
    }
  }

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("sort", sortKey);
    next.set("dir", sortAsc ? "asc" : "desc");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, sortAsc]);

  return { rows, sortKey, sortAsc, handleSort } as const;
}

