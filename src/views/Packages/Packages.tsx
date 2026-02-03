import { useState, useEffect, useMemo } from "react";

// api
import { brew, PackageListItem } from "../../api/brew";

// components
import { PackageList } from "../../components";
import { useSelectedPackage } from "../../context/SelectedPackageContext";

function Packages() {
  const [items, setItems] = useState<PackageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { open: openPackage } = useSelectedPackage();
  const [filter] = useState("");

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
  }, []);

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
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [filter, items]);

  // When uninstall succeeds, a global event updates the list (see useEffect below)

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="border-1 border-gray-200 p-4 rounded-md h-[calc(100vh-166px)] overflow-y-auto">
        <PackageList
          items={filtered}
          loading={loading}
          error={error}
          onSelect={openPackage}
        />
      </div>
      {/* Uninstall handling remains here if needed later */}
    </div>
  );
}

export default Packages;
