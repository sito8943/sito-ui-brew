import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { listPackages, PackageListItem } from "./api/brew";
import PackageList from "./components/PackageList";
import PackageDetails from "./components/PackageDetails";

function App() {
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
    <div className="shell">
      <header className="header">
        <div className="title">Homebrew</div>
        <div className="search">
          <input
            value={filter}
            onChange={(e) => setFilter(e.currentTarget.value)}
            placeholder="Search installed packages"
          />
        </div>
      </header>
      <div className="content">
        <div className="panel">
          <PackageList
            items={filtered}
            loading={loading}
            error={error}
            onSelect={setSelected}
          />
        </div>
      </div>

      <PackageDetails
        item={selected}
        onClose={() => setSelected(null)}
        onUninstalled={handleUninstalled}
      />
    </div>
  );
}

export default App;
