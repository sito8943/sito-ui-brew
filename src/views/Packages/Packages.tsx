import { useState, useEffect, useMemo } from "react";

// api
import { listPackages, PackageListItem } from "../../api/brew";

// components
import { PackageDetails, PackageList } from "../../components";

function Packages() {
  const [items, setItems] = useState<PackageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PackageListItem | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    listPackages()
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

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [filter, items]);

  function handleUninstalled(name: string) {
    setItems((prev) => prev.filter((i) => i.name !== name));
    setSelected(null);
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="border-1 border-gray-200 p-4 rounded-md">
        <PackageList
          items={filtered}
          loading={loading}
          error={error}
          onSelect={setSelected}
        />
      </div>

      <PackageDetails
        item={selected}
        onClose={() => setSelected(null)}
        onUninstalled={handleUninstalled}
      />
    </div>
  );
}

export default Packages;
