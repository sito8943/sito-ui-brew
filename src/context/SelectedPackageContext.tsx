import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PackageListItem } from "../api/brew";

type Intent = "details" | "uninstall" | null;

export type SelectedPackageContextValue = {
  selected: PackageListItem | null;
  intent: Intent;
  open: (item: PackageListItem) => void;
  promptUninstall: (item: PackageListItem) => void;
  close: () => void;
};

const SelectedPackageContext = createContext<SelectedPackageContextValue | undefined>(
  undefined
);

export function SelectedPackageProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<PackageListItem | null>(null);
  const [intent, setIntent] = useState<Intent>(null);

  const open = useCallback((item: PackageListItem) => {
    setSelected(item);
    setIntent("details");
  }, []);
  const promptUninstall = useCallback((item: PackageListItem) => {
    setSelected(item);
    setIntent("uninstall");
  }, []);
  const close = useCallback(() => {
    setSelected(null);
    setIntent(null);
  }, []);

  const value = useMemo(
    () => ({ selected, intent, open, promptUninstall, close }),
    [selected, intent, open, promptUninstall, close]
  );

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
