import { useState, useEffect, useMemo } from "react";

// api
import { brew, PackageListItem } from "../../api/brew";
import { useSearch } from "../../context/SearchContext";
import { fetchSizesMap } from "../../services/packages";

// components
import { PackageList } from "../../components";
import { useSelectedPackage } from "../../context/SelectedPackageContext";

function Packages() {
  const [items, setItems] = useState<PackageListItem[]>([]);
  const [sizes, setSizes] = useState<Record<string, { bytes?: number | null; human?: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { open: openPackage } = useSelectedPackage();
  const { debouncedQuery, kinds, sizeMinMB, sizeMaxMB, refreshTick } = useSearch();

  useEffect(() => {
    let active = true;
    setLoading(true);
    brew.listPackages()
      .then((res) => {
        if (!active) return;
        // Basic sort by name
        setItems(res.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((e) => {
        if (!active) return;
        setError(String(e));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [refreshTick]);

  // fetch sizes after list loads
  useEffect(() => {
    let active = true;
    if (!items.length) {
      setSizes({});
      return;
    }
    fetchSizesMap(items).then((map) => {
      if (!active) return;
      const reduced: Record<string, { bytes?: number | null; human?: string | null }> = {};
      Object.entries(map).forEach(([k, v]) => {
        reduced[k] = { bytes: v.bytes, human: v.human };
      });
      setSizes(reduced);
    });
    return () => {
      active = false;
    };
  }, [items]);

  // Remove uninstalled item when notified by drawer
  useEffect(() => {
    function onUninstalled(e: Event) {
      const ce = e as CustomEvent<{ name: string }>;
      const pkgName = ce.detail?.name;
      if (!pkgName) return;
      setItems((prev) => prev.filter((i) => i.name !== pkgName));
    }
    window.addEventListener("package-uninstalled", onUninstalled as EventListener);
    return () => window.removeEventListener("package-uninstalled", onUninstalled as EventListener);
  }, []);

  const filtered = useMemo(() => {
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
        if (bytes == null) return false; // exclude unknown when filtering by size
        if (minBytes != null && bytes < minBytes) return false;
        if (maxBytes != null && bytes > maxBytes) return false;
      }
      return true;
    });
  }, [debouncedQuery, kinds, sizeMinMB, sizeMaxMB, items, sizes]);

  // When uninstall succeeds, a global event updates the list (see useEffect below)

  return (
    <div className="flex flex-col h-full px-4 py-2 gap-4">
      <div className="border-1 border-gray-200 p-4 rounded-md h-[calc(100vh-128px)] overflow-y-auto">
        <PackageList
          items={filtered}
          loading={loading}
          error={error}
          onSelect={openPackage}
          sizesMap={sizes}
        />
      </div>
      {/* Uninstall handling remains here if needed later */}
    </div>
  );
}

export default Packages;
