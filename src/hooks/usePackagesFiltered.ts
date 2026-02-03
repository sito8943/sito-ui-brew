import { useMemo } from "react";
import type { PackageListItem } from "../api/brew";
import { useSearch } from "../context/SearchContext";

type SizeMap = Record<string, { bytes?: number | null }>;

export default function usePackagesFiltered(items: PackageListItem[], sizes: SizeMap) {
  const { debouncedQuery, kinds, sizeMinMB, sizeMaxMB } = useSearch();
  return useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const hasKind = kinds.size > 0;
    const minBytes = typeof sizeMinMB === "number" ? sizeMinMB * 1024 * 1024 : null;
    const maxBytes = typeof sizeMaxMB === "number" ? sizeMaxMB * 1024 * 1024 : null;
    return items.filter((i) => {
      if (q && !i.name.toLowerCase().includes(q)) return false;
      if (hasKind && !kinds.has(i.kind)) return false;
      if (minBytes != null || maxBytes != null) {
        const key = `${i.kind}:${i.name}`;
        const bytes = sizes[key]?.bytes ?? null;
        if (bytes == null) return false;
        if (minBytes != null && bytes < minBytes) return false;
        if (maxBytes != null && bytes > maxBytes) return false;
      }
      return true;
    });
  }, [debouncedQuery, kinds, sizeMinMB, sizeMaxMB, items, sizes]);
}

