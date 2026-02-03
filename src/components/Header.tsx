import { useState } from "react";
import { useSearch } from "../context/SearchContext";
import IconButton from "./IconButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faRotateRight,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

function Header() {
  const {
    query,
    setQuery,
    kinds,
    toggleKind,
    sizeMinMB,
    sizeMaxMB,
    setSizeMinMB,
    setSizeMaxMB,
    refresh,
  } = useSearch();
  const [showFilters, setShowFilters] = useState(false);
  return (
    <header className="flex flex-col gap-2 p-4 backdrop-blur-md sticky top-0 z-10 bg-primary/20 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <h1 className="text-xl">Homebrew</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/80 rounded-md border border-gray-200 px-2 py-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-gray-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Search installed packages"
              className="bg-transparent outline-none text-sm min-w-[220px]"
            />
          </div>
          <IconButton
            variant="secondary"
            title="Filters"
            ariaLabel="Filters"
            onClick={() => setShowFilters((v) => !v)}
          >
            <FontAwesomeIcon icon={faFilter} />
          </IconButton>
          <IconButton
            variant="secondary"
            title="Refresh"
            ariaLabel="Refresh"
            onClick={refresh}
          >
            <FontAwesomeIcon icon={faRotateRight} />
          </IconButton>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-4 bg-white/60 border border-gray-200 rounded-md p-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Kinds</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={kinds.has("formula")}
                  onChange={() => toggleKind("formula")}
                />
                formula
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={kinds.has("cask")}
                  onChange={() => toggleKind("cask")}
                />
                cask
              </label>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Min size</label>
            <div className="flex items-center gap-2 bg-white/80 rounded-md border border-gray-200 px-2 py-1 w-[180px]">
              <input
                type="number"
                value={sizeMinMB ?? ""}
                onChange={(e) => setSizeMinMB(e.currentTarget.value ? Number(e.currentTarget.value) : null)}
                placeholder="0"
                className="bg-transparent outline-none text-sm w-full text-right"
              />
              <span className="text-xs text-gray-500">MB</span>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Max size</label>
            <div className="flex items-center gap-2 bg-white/80 rounded-md border border-gray-200 px-2 py-1 w-[180px]">
              <input
                type="number"
                value={sizeMaxMB ?? ""}
                onChange={(e) => setSizeMaxMB(e.currentTarget.value ? Number(e.currentTarget.value) : null)}
                placeholder="1000"
                className="bg-transparent outline-none text-sm w-full text-right"
              />
              <span className="text-xs text-gray-500">MB</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
