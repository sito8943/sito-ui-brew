import { useEffect, useMemo, useState } from "react";
import {
  PackageInfo,
  PackageKind,
  PackageListItem,
  PackageSizeResult,
  getPackageInfo,
  getPackageSize,
  onUninstallProgress,
  uninstallPackage,
  UninstallEventPayload,
} from "../api/brew";

type Props = {
  item: PackageListItem | null;
  onClose: () => void;
  onUninstalled: (name: string) => void;
};

export function PackageDetails({ item, onClose, onUninstalled }: Props) {
  const [info, setInfo] = useState<PackageInfo | null>(null);
  const [size, setSize] = useState<PackageSizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const visible = !!item;
  const name = item?.name ?? "";
  const kind = (item?.kind ?? "formula") as PackageKind;

  useEffect(() => {
    let active = true;
    if (!item) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    setSize(null);
    Promise.all([getPackageInfo(item.name), getPackageSize(item.name, item.kind)])
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
    const unlistenPromise = onUninstallProgress((p: UninstallEventPayload) => {
      if (!item || p.name !== item.name) return;
      setProgress((prev) => [...prev, p.message]);
      if (p.done) {
        setUninstalling(false);
        if (p.success) {
          onUninstalled(item.name);
        }
      }
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [item, onUninstalled]);

  const canUninstall = useMemo(() => !!item && !uninstalling, [item, uninstalling]);

  async function handleUninstall()
  {
    if (!item) return;
    setConfirming(false);
    setUninstalling(true);
    setProgress([]);
    try {
      await uninstallPackage(item.name, item.kind);
    } catch (e) {
      setUninstalling(false);
      setProgress((prev) => [...prev, `Failed to start uninstall: ${String(e)}`]);
    }
  }

  return (
    <div className={`drawer ${visible ? "open" : ""}`} aria-hidden={!visible}>
      <div className="drawer-header">
        <div className="drawer-title">
          <div className="pkg-title">{name}</div>
          <div className="pkg-subtitle">{kind}</div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="drawer-body">
        {loading && <div className="panel-status">Loading…</div>}
        {error && <div className="panel-error">{error}</div>}
        {!loading && !error && info && (
          <div className="details">
            {info.description && <p className="desc">{info.description}</p>}
            <div className="grid">
              <div className="kv"><span className="k">Version</span><span className="v">{info.version ?? "—"}</span></div>
              <div className="kv"><span className="k">Homepage</span><span className="v">{info.homepage ? <a href={info.homepage} target="_blank">{info.homepage}</a> : "—"}</span></div>
              <div className="kv"><span className="k">Tap</span><span className="v">{info.tap ?? "—"}</span></div>
              <div className="kv"><span className="k">Maintainers</span><span className="v">{info.maintainers?.join(", ") ?? "—"}</span></div>
              <div className="kv"><span className="k">Size</span><span className="v">{size?.human ?? "—"}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="drawer-footer">
        <button
          className="btn danger"
          disabled={!canUninstall}
          onClick={() => setConfirming(true)}
        >
          {uninstalling ? "Uninstalling…" : "Uninstall"}
        </button>
      </div>

      {confirming && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-title">Confirm uninstall</div>
            <div className="modal-body">
              Remove {name} ({kind}) from this system?
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button className="btn danger" onClick={handleUninstall}>
                Uninstall
              </button>
            </div>
          </div>
        </div>
      )}

      {progress.length > 0 && (
        <div className="progress">
          {progress.map((line, idx) => (
            <div key={idx} className="progress-line">{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PackageDetails;
