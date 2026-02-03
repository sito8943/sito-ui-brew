import { useEffect, useMemo, useState } from "react";
import Drawer from "../Drawer";
import {
  brew,
  PackageInfo,
  PackageKind,
  PackageSizeResult,
  UninstallEventPayload,
} from "../../api/brew";
import PackageKindChip from "./PackageKindChip";
import InfoItem from "../InfoItem";
import { useSelectedPackage } from "../../context/SelectedPackageContext";

export default function PackageDrawer() {
  const { selected: item, close } = useSelectedPackage();
  const [info, setInfo] = useState<PackageInfo | null>(null);
  const [size, setSize] = useState<PackageSizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const open = !!item;
  const name = item?.name ?? "";
  const kind = (item?.kind ?? "formula") as PackageKind;

  useEffect(() => {
    let active = true;
    if (!item) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    setSize(null);
    Promise.all([
      brew.getPackageInfo(item.name),
      brew.getPackageSize(item.name, item.kind),
    ])
      .then(([i, s]) => {
        if (!active) return;
        setInfo(i);
        setSize(s);
      })
      .catch((e) => {
        if (!active) return;
        setError(String(e));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [item]);

  useEffect(() => {
    const unlistenPromise = brew.onUninstallProgress(
      (p: UninstallEventPayload) => {
        if (!item || p.name !== item.name) return;
        setProgress((prev) => [...prev, p.message]);
        if (p.done) {
          setUninstalling(false);
          if (p.success) {
            // notify list views and close the drawer
            window.dispatchEvent(
              new CustomEvent("package-uninstalled", {
                detail: { name: p.name },
              })
            );
            close();
          }
        }
      }
    );
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [item, close]);

  const canUninstall = useMemo(
    () => !!item && !uninstalling,
    [item, uninstalling]
  );

  async function handleUninstall() {
    if (!item) return;
    setConfirming(false);
    setUninstalling(true);
    setProgress([]);
    try {
      await brew.uninstallPackage(item.name, item.kind);
    } catch (e) {
      setUninstalling(false);
      setProgress((prev) => [
        ...prev,
        `Failed to start uninstall: ${String(e)}`,
      ]);
    }
  }

  const title = (
    <div className="min-w-0">
      <div className="truncate">
        <PackageKindChip kind={kind} link={false} />
      </div>
      <div className="text-base font-semibold truncate">{name}</div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={close}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <button
            className="text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1 rounded-md disabled:opacity-50"
            disabled={!canUninstall}
            onClick={() => setConfirming(true)}
          >
            {uninstalling ? "Uninstalling…" : "Uninstall"}
          </button>
        </div>
      }
    >
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && info && (
        <div className="space-y-4">
          {info.description && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {info.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoItem label="Version" value={info.version ?? "—"} />
            <InfoItem label="Tap" value={info.tap ?? "—"} />
            <InfoItem label="Maintainers">
              <span className="truncate max-w-[240px]">
                {info.maintainers?.join(", ") ?? "—"}
              </span>
            </InfoItem>
            <InfoItem label="Homepage" className="sm:col-span-2">
              {info.homepage ? (
                <a
                  className="hover:text-bg-primary underline truncate max-w-[240px]"
                  href={info.homepage}
                  target="_blank"
                  rel="noopener"
                >
                  {info.homepage}
                </a>
              ) : (
                "—"
              )}
            </InfoItem>
            <InfoItem
              label="Size"
              value={size?.human ?? "—"}
              className="sm:col-span-2"
            />
          </div>

          {progress.length > 0 && (
            <div className="border border-gray-200 rounded-md p-2 max-h-48 overflow-y-auto">
              {progress.map((line, idx) => (
                <div key={idx} className="text-xs text-gray-700 leading-5">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setConfirming(false)}
          />
          <div className="absolute inset-x-4 top-24 rounded-md border border-gray-200 bg-white shadow-lg p-4 max-w-md mx-auto">
            <div className="text-base font-semibold mb-1">
              Confirm uninstall
            </div>
            <div className="text-sm mb-3">
              Remove {name} ({kind}) from this system?
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded-md border border-gray-200"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleUninstall}
              >
                Uninstall
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
