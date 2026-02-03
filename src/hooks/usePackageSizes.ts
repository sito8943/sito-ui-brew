import { useEffect, useState } from "react";
import type { PackageListItem } from "../api/brew";
import { fetchSizesMap } from "../services/packages";

export type SizeEntry = { bytes?: number | null; human?: string | null };

export default function usePackageSizes(
  items: PackageListItem[],
  external?: Record<string, SizeEntry>
) {
  const [sizes, setSizes] = useState<Record<string, SizeEntry>>(external ?? {});

  useEffect(() => {
    if (external) {
      setSizes(external);
      return;
    }
    if (!items.length) {
      setSizes({});
      return;
    }
    let active = true;
    fetchSizesMap(items).then((map) => {
      if (!active) return;
      const reduced: Record<string, SizeEntry> = {};
      Object.entries(map).forEach(([k, v]) => {
        reduced[k] = { bytes: v.bytes, human: v.human };
      });
      setSizes(reduced);
    });
    return () => {
      active = false;
    };
  }, [items, external]);

  return sizes;
}

