import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type PackageKind = "formula" | "cask";

export type PackageListItem = {
  name: string;
  kind: PackageKind;
};

export type PackageInfo = {
  name: string;
  version?: string | null;
  description?: string | null;
  homepage?: string | null;
  maintainers?: string[] | null;
  tap?: string | null;
};

export type PackageSizeResult = {
  name: string;
  kind: PackageKind;
  bytes?: number | null;
  human?: string | null;
};

export async function listPackages(): Promise<PackageListItem[]> {
  return await invoke<PackageListItem[]>("list_packages");
}

export async function getPackageInfo(name: string): Promise<PackageInfo> {
  return await invoke<PackageInfo>("get_package_info", { name });
}

export async function getPackageSize(
  name: string,
  kind: PackageKind
): Promise<PackageSizeResult> {
  return await invoke<PackageSizeResult>("get_package_size", { name, kind });
}

export async function uninstallPackage(
  name: string,
  kind: PackageKind
): Promise<void> {
  await invoke("uninstall_package", {
    req: { name, kind, confirm: true },
  });
}

export type UninstallEventPayload = {
  name: string;
  kind: PackageKind;
  message: string;
  done: boolean;
  success?: boolean;
};

export function onUninstallProgress(
  handler: (payload: UninstallEventPayload) => void
) {
  return listen<UninstallEventPayload>("uninstall-progress", (e) => {
    handler(e.payload);
  });
}

