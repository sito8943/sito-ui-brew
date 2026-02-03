import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faSpinner,
  faExternalLink,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

// types
import { PackageKind, PackageListItem } from "../../api/brew";
import PackageKindChip from "./PackageKindChip";
import IconButton from "../IconButton";
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
  if (loading)
    return (
      <div className="w-full text-center py-4">
        <FontAwesomeIcon icon={faSpinner} spin />
      </div>
    );
  if (error) return <div className="list-error">{error}</div>;
  if (!items.length)
    return <div className="list-empty">{t("packages.table.empty")}</div>;

  return (
    <table className="w-full">
      <tr className="border-b border-gray-200">
        <th className="text-start py-1 w-64">
          <div className="flex gap-2">
            <div className="min-w-19"></div>
            <span>{t("packages.table.headers.name")}</span>
          </div>
        </th>
        <th className="text-start">{t("packages.table.headers.kind")}</th>
      </tr>
      {items.map((it, i) => (
        <tr
          key={`${it.kind}:${it.name}`}
          className={`w-full ${i % 2 ? "bg-primary/10" : ""}`}
        >
          <td className="py-1 pl-2">
            <div className="flex justify-start items-center gap-2">
              <div className="flex gap-1">
                <IconButton
                  variant="primary"
                  onClick={() => onSelect(it)}
                  title={t("_accessibility:actions.openDetails", { name: it.name })}
                  ariaLabel={t("_accessibility:actions.openDetails", { name: it.name })}
                >
                  <FontAwesomeIcon icon={faCircleInfo} />
                </IconButton>
                <IconButton
                  variant="danger"
                  onClick={() => onUninstall && onUninstall(it)}
                  title={t("_accessibility:actions.uninstall", { name: it.name })}
                  ariaLabel={t("_accessibility:actions.uninstall", { name: it.name })}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </IconButton>
              </div>
              <a
                className="hover:text-bg-primary group flex items-center gap-1"
                href={`https://formulae.brew.sh/${it.kind}/${it.name}`}
                target="_blank"
                rel="noopener"
              >
                {it.name}
                <FontAwesomeIcon
                  icon={faExternalLink}
                  className="-mt-0.5 text-xs group-hover:opacity-100 opacity-0 transition-opacity duration-200"
                />
              </a>
            </div>
          </td>
          <td className="py-1">
            <div className="flex justify-start items-center gap-1">
              <PackageKindChip kind={it.kind as PackageKind} />
            </div>
          </td>
        </tr>
      ))}
    </table>
  );
}

export default PackageList;
