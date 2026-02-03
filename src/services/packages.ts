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

// Simple in-memory cache with TTL for sizes
type CachedSize = { ts: number; value: PackageSizeResult };
const SIZE_CACHE = new Map<string, CachedSize>();
const SIZE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(name: string, kind: PackageKind) {
  return `${kind}:${name}`;
}

function getCachedSize(name: string, kind: PackageKind): PackageSizeResult | undefined {
  const key = cacheKey(name, kind);
  const entry = SIZE_CACHE.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > SIZE_TTL_MS) {
    SIZE_CACHE.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCachedSize(name: string, kind: PackageKind, value: PackageSizeResult) {
  SIZE_CACHE.set(cacheKey(name, kind), { ts: Date.now(), value });
}

export async function fetchPackageSizeCached(name: string, kind: PackageKind): Promise<PackageSizeResult> {
  const cached = getCachedSize(name, kind);
  if (cached) return cached;
  const res = await fetchPackageSize(name, kind);
  setCachedSize(name, kind, res);
  return res;
}

export async function fetchSizesMap(items: PackageListItem[]): Promise<Record<string, PackageSizeResult>> {
  const map: Record<string, PackageSizeResult> = {};
  const missing: Array<Promise<void>> = [];
  for (const it of items) {
    const key = cacheKey(it.name, it.kind);
    const cached = getCachedSize(it.name, it.kind);
    if (cached) {
      map[key] = cached;
    } else {
      missing.push(
        fetchPackageSize(it.name, it.kind)
          .then((res) => {
            setCachedSize(it.name, it.kind, res);
            map[key] = res;
          })
          .catch(() => {
            map[key] = { name: it.name, kind: it.kind, bytes: null, human: null } as PackageSizeResult;
          })
      );
    }
  }
  if (missing.length) await Promise.all(missing);
  return map;
}
