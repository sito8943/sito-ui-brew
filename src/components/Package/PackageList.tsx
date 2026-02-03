import usePackageSizes from "../../hooks/usePackageSizes";
import useTableSort from "../../hooks/useTableSort";

// types
import { PackageListItem } from "../../api/brew";
import PackageTableHeader from "./PackageTableHeader";
import PackageTableRow from "./PackageTableRow";
import FilterChipsRow from "./FilterChips";
import Loading from "../Loading";
import { useTranslation } from "react-i18next";

type Props = {
  items: PackageListItem[];
  onSelect: (item: PackageListItem) => void;
  onUninstall?: (item: PackageListItem) => void;
  loading?: boolean;
  error?: string | null;
  sizesMap?: Record<string, { bytes?: number | null; human?: string | null }>;
};

export function PackageList({
  items,
  onSelect,
  onUninstall,
  loading,
  error,
  sizesMap,
}: Props) {
  const { t } = useTranslation();
  const sizes = usePackageSizes(items, sizesMap);
  const { rows, sortKey, sortAsc, handleSort } = useTableSort(items, sizes);

  if (loading)
    return (
      <div className="w-full py-4 flex justify-center">
        <Loading variant="muted" />
      </div>
    );
  if (error) return <div className="list-error">{error}</div>;
  return (
    <table className="w-full">
      <FilterChipsRow />
      <PackageTableHeader
        sortKey={sortKey}
        sortAsc={sortAsc}
        onSort={handleSort}
      />
      {rows.length === 0 && (
        <tr>
          <td colSpan={3} className="py-2 text-sm text-gray-500">
            {t("packages.table.empty")}
          </td>
        </tr>
      )}
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
