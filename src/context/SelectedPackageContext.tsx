import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PackageListItem } from "../api/brew";

export type SelectedPackageContextValue = {
  selected: PackageListItem | null;
  open: (item: PackageListItem) => void;
  close: () => void;
};

const SelectedPackageContext = createContext<SelectedPackageContextValue | undefined>(
  undefined
);

export function SelectedPackageProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<PackageListItem | null>(null);

  const open = useCallback((item: PackageListItem) => setSelected(item), []);
  const close = useCallback(() => setSelected(null), []);

  const value = useMemo(() => ({ selected, open, close }), [selected, open, close]);

  return (
    <SelectedPackageContext.Provider value={value}>
      {children}
    </SelectedPackageContext.Provider>
  );
}

export function useSelectedPackage() {
  const ctx = useContext(SelectedPackageContext);
  if (!ctx) throw new Error("useSelectedPackage must be used within SelectedPackageProvider");
  return ctx;
}

