import { brew, PackageKind, PackageInfo, PackageSizeResult, PackageListItem } from "../api/brew";

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

export async function fetchPackageSize(name: string, kind: PackageKind): Promise<PackageSizeResult> {
  return await brew.getPackageSize(name, kind);
}

export async function fetchSizesMap(items: PackageListItem[]): Promise<Record<string, PackageSizeResult>> {
  const results = await Promise.all(
    items.map((it) =>
      fetchPackageSize(it.name, it.kind).then((res) => ({ key: `${it.kind}:${it.name}`, res })).catch(() => ({ key: `${it.kind}:${it.name}`, res: { name: it.name, kind: it.kind, bytes: null, human: null } as PackageSizeResult }))
    )
  );
  const map: Record<string, PackageSizeResult> = {};
  for (const { key, res } of results) map[key] = res;
  return map;
}
