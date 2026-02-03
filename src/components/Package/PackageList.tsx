// icons used inside header/row components
import { array } from "some-javascript-utils";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchSizesMap } from "../../services/packages";

// types
import { PackageListItem } from "../../api/brew";
import PackageTableHeader from "./PackageTableHeader";
import PackageTableRow from "./PackageTableRow";
import Loading from "../Loading";
import { useTranslation } from "react-i18next";

type Props = {
  items: PackageListItem[];
  onSelect: (item: PackageListItem) => void;
  onUninstall?: (item: PackageListItem) => void;
  loading?: boolean;
  error?: string | null;
};

export function PackageList({
  items,
  onSelect,
  onUninstall,
  loading,
  error,
}: Props) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSort =
    (searchParams.get("sort") as "name" | "kind" | "size" | null) || "name";
  const initialDir = searchParams.get("dir") === "desc" ? false : true;
  const [sizes, setSizes] = useState<
    Record<string, { bytes?: number | null; human?: string | null }>
  >({});
  const [sortKey, setSortKey] = useState<"name" | "kind" | "size">(initialSort);
  const [sortAsc, setSortAsc] = useState<boolean>(initialDir);
  useEffect(() => {
    if (!items.length) {
      setSizes({});
      return;
    }
    let active = true;
    fetchSizesMap(items).then((map) => {
      if (!active) return;
      const reduced: Record<
        string,
        { bytes?: number | null; human?: string | null }
      > = {};
      Object.entries(map).forEach(([k, v]) => {
        reduced[k] = { bytes: v.bytes, human: v.human };
      });
      setSizes(reduced);
    });
    return () => {
      active = false;
    };
  }, [items]);
  const rows = useMemo(() => {
    const copy = items.slice();
    if (sortKey === "name" || sortKey === "kind") {
      return array.sortBy(copy, sortKey, sortAsc, null);
    }
    return array.sortBy(copy, undefined, sortAsc, (it) => {
      const key = `${it.kind}:${it.name}`;
      const bytes = sizes[key]?.bytes;
      const fallback = sortAsc
        ? Number.POSITIVE_INFINITY
        : Number.NEGATIVE_INFINITY;
      return typeof bytes === "number" ? bytes : fallback;
    });
  }, [items, sortKey, sortAsc, sizes]);

  function handleSort(key: "name" | "kind" | "size") {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  // sync sort to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("sort", sortKey);
    next.set("dir", sortAsc ? "asc" : "desc");
    setSearchParams(next, { replace: true });
  }, [sortKey, sortAsc]);

  if (loading)
    return (
      <div className="w-full py-4 flex justify-center">
        <Loading variant="muted" />
      </div>
    );
  if (error) return <div className="list-error">{error}</div>;
  if (!items.length)
    return <div className="list-empty">{t("packages.table.empty")}</div>;
  return (
    <table className="w-full">
      <PackageTableHeader
        sortKey={sortKey}
        sortAsc={sortAsc}
        onSort={handleSort}
      />
      {rows.map((it, i) => (
        <PackageTableRow
          key={`${it.kind}:${it.name}`}
          item={it}
          index={i}
          onSelect={onSelect}
          onUninstall={onUninstall}
          sizeHuman={sizes[`${it.kind}:${it.name}`]?.human ?? null}
        />
      ))}
    </table>
  );
}

export default PackageList;
