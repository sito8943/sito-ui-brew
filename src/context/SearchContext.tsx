import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import type { PackageKind } from "../api/brew";

export type SearchFilters = {
  query: string;
  debouncedQuery: string;
  kinds: Set<PackageKind>;
  sizeMinMB?: number | null;
  sizeMaxMB?: number | null;
  setQuery: (q: string) => void;
  toggleKind: (k: PackageKind) => void;
  setSizeMinMB: (v: number | null) => void;
  setSizeMaxMB: (v: number | null) => void;
  clearFilter: (key: "query" | "kinds" | "sizeMin" | "sizeMax") => void;
  clearAll: () => void;
  refresh: () => void;
  refreshTick: number;
};

const SearchContext = createContext<SearchFilters | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [kinds, setKinds] = useState<Set<PackageKind>>(new Set());
  const [sizeMinMB, setSizeMinMBState] = useState<number | null>(null);
  const [sizeMaxMB, setSizeMaxMBState] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const setSizeMinMB = useCallback((v: number | null) => setSizeMinMBState(v), []);
  const setSizeMaxMB = useCallback((v: number | null) => setSizeMaxMBState(v), []);

  const toggleKind = useCallback((k: PackageKind) => {
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  const clearFilter = useCallback((key: "query" | "kinds" | "sizeMin" | "sizeMax") => {
    if (key === "query") setQuery("");
    else if (key === "kinds") setKinds(new Set());
    else if (key === "sizeMin") setSizeMinMBState(null);
    else if (key === "sizeMax") setSizeMaxMBState(null);
  }, []);

  const clearAll = useCallback(() => {
    setQuery("");
    setKinds(new Set());
    setSizeMinMBState(null);
    setSizeMaxMBState(null);
  }, []);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  const value = useMemo<SearchFilters>(
    () => ({
      query,
      debouncedQuery,
      kinds,
      sizeMinMB,
      sizeMaxMB,
      setQuery,
      toggleKind,
      setSizeMinMB,
      setSizeMaxMB,
      clearFilter,
      clearAll,
      refresh,
      refreshTick,
    }),
    [query, debouncedQuery, kinds, sizeMinMB, sizeMaxMB, setQuery, toggleKind, setSizeMinMB, setSizeMaxMB, clearFilter, clearAll, refresh, refreshTick]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}

