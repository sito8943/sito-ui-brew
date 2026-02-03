import { PackageInfo, PackageKind, PackageSizeResult } from "../../api/brew";
import { fetchPackageDetails, startUninstall, subscribeUninstall } from "../../services/packages";

export type PackageDrawerState = {
  open: boolean;
  name: string;
  kind: PackageKind;
  loading: boolean;
  error: string | null;
  info: PackageInfo | null;
  size: PackageSizeResult | null;
  confirming: boolean;
  uninstalling: boolean;
  progress: string[];
};

type Listener = (state: PackageDrawerState) => void;

export class PackageDrawerController {
  private state: PackageDrawerState = {
    open: false,
    name: "",
    kind: "formula",
    loading: false,
    error: null,
    info: null,
    size: null,
    confirming: false,
    uninstalling: false,
    progress: [],
  };
  private listeners = new Set<Listener>();
  private unlisten: null | (() => void) = null;

  getState() {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // immediately push current state
    listener(this.state);
    return () => { this.listeners.delete(listener); };
  }

  private emit() {
    for (const l of this.listeners) l(this.state);
  }

  async attach(name: string, kind: PackageKind) {
    if (!name) return;
    this.state = {
      ...this.state,
      open: true,
      name,
      kind,
      loading: true,
      error: null,
      info: null,
      size: null,
      progress: [],
    };
    this.emit();

    // subscribe to uninstall progress for this package
    const unlistenPromise = subscribeUninstall((p) => {
      if (p.name !== name) return;
      this.state = { ...this.state, progress: [...this.state.progress, p.message] };
      this.emit();
      if (p.done) {
        this.state = { ...this.state, uninstalling: false };
        this.emit();
        if (p.success) {
          window.dispatchEvent(new CustomEvent("package-uninstalled", { detail: { name: p.name } }));
          this.close();
        }
      }
    });
    // resolve and set unlisten
    unlistenPromise.then((unlisten) => {
      this.unlisten = unlisten;
    });

    try {
      const { info, size } = await fetchPackageDetails(name, kind);
      this.state = { ...this.state, info, size, loading: false };
      this.emit();
    } catch (e) {
      this.state = { ...this.state, error: String(e), loading: false };
      this.emit();
    }
  }

  requestUninstall() {
    if (!this.state.open) return;
    this.state = { ...this.state, confirming: true };
    this.emit();
  }

  cancelConfirm() {
    if (!this.state.open) return;
    this.state = { ...this.state, confirming: false };
    this.emit();
  }

  async confirmUninstall() {
    if (!this.state.open) return;
    this.state = { ...this.state, confirming: false, uninstalling: true, progress: [] };
    this.emit();
    try {
      await startUninstall(this.state.name, this.state.kind);
    } catch (e) {
      this.state = {
        ...this.state,
        uninstalling: false,
        progress: [...this.state.progress, `Failed to start uninstall: ${String(e)}`],
      };
      this.emit();
    }
  }

  close() {
    if (this.unlisten) {
      try { this.unlisten(); } catch {}
      this.unlisten = null;
    }
    this.state = {
      open: false,
      name: "",
      kind: "formula",
      loading: false,
      error: null,
      info: null,
      size: null,
      confirming: false,
      uninstalling: false,
      progress: [],
    };
    this.emit();
  }
}
