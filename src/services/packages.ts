import { brew, PackageKind, PackageInfo, PackageSizeResult } from "../api/brew";

export async function fetchPackageDetails(
  name: string,
  kind: PackageKind
): Promise<{ info: PackageInfo; size: PackageSizeResult }> {
  const [info, size] = await Promise.all([
    brew.getPackageInfo(name),
    brew.getPackageSize(name, kind),
  ]);
  return { info, size };
}

export async function startUninstall(name: string, kind: PackageKind) {
  await brew.uninstallPackage(name, kind);
}

export function subscribeUninstall(
  handler: (payload: { name: string; kind: PackageKind; message: string; done: boolean; success?: boolean }) => void
) {
  return brew.onUninstallProgress(handler);
}

