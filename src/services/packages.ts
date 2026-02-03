import { brew, PackageKind, PackageInfo, PackageSizeResult, PackageListItem } from "../api/brew";

async function fetchJsonWithTimeout(url: string, timeoutMs = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

async function fetchRemotePackageInfo(name: string, kind: PackageKind): Promise<PackageInfo> {
  const url = `https://formulae.brew.sh/api/${kind}/${encodeURIComponent(name)}.json`;
  const data = await fetchJsonWithTimeout(url, 5000);
  // Map remote JSON to our PackageInfo shape (best-effort across formula/cask)
  const version = data.version || data.versions?.stable || null;
  const description = data.desc || data.description || null;
  const homepage = data.homepage || null;
  let maintainers: string[] | null = null;
  if (Array.isArray(data.maintainers)) {
    maintainers = data.maintainers.map((m: any) => (typeof m === "string" ? m : m?.name)).filter(Boolean);
  }
  const tap = data.tap || data.tap_git_head || null;
  return { name, version, description, homepage, maintainers, tap };
}

async function getPackageInfoHybrid(name: string, kind: PackageKind): Promise<PackageInfo> {
  // Try remote only if likely online; fall back silently to local
  const likelyOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  if (likelyOnline) {
    try {
      return await fetchRemotePackageInfo(name, kind);
    } catch (_) {
      // ignore and fallback
    }
  }
  return await brew.getPackageInfo(name);
}

export async function fetchPackageDetails(
  name: string,
  kind: PackageKind
): Promise<{ info: PackageInfo; size: PackageSizeResult }> {
  const [info, size] = await Promise.all([
    getPackageInfoHybrid(name, kind),
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
