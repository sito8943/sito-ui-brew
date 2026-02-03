import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faExternalLink, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import type { PackageKind, PackageListItem } from "../../api/brew";
import IconButton from "../IconButton";
import PackageKindChip from "./PackageKindChip";

type Props = {
  item: PackageListItem;
  index: number;
  onSelect: (item: PackageListItem) => void;
  onUninstall?: (item: PackageListItem) => void;
  sizeHuman?: string | null;
};

export default function PackageTableRow({ item, index, onSelect, onUninstall, sizeHuman }: Props) {
  const { t } = useTranslation();
  return (
    <tr key={`${item.kind}:${item.name}`} className={`w-full ${index % 2 ? "bg-primary/10" : ""}`}>
      <td className="py-1 pl-2">
        <div className="flex justify-start items-center gap-2">
          <div className="flex gap-1">
            <IconButton
              variant="primary"
              onClick={() => onSelect(item)}
              title={t("_accessibility:actions.openDetails", { name: item.name })}
              ariaLabel={t("_accessibility:actions.openDetails", { name: item.name })}
            >
              <FontAwesomeIcon icon={faCircleInfo} />
            </IconButton>
            <IconButton
              variant="danger"
              onClick={() => onUninstall && onUninstall(item)}
              title={t("_accessibility:actions.uninstall", { name: item.name })}
              ariaLabel={t("_accessibility:actions.uninstall", { name: item.name })}
            >
              <FontAwesomeIcon icon={faTrash} />
            </IconButton>
          </div>
          <a
            className="hover:text-bg-primary group flex items-center gap-1"
            href={`https://formulae.brew.sh/${item.kind}/${item.name}`}
            target="_blank"
            rel="noopener"
          >
            {item.name}
            <FontAwesomeIcon icon={faExternalLink} className="-mt-0.5 text-xs group-hover:opacity-100 opacity-0 transition-opacity duration-200" />
          </a>
        </div>
      </td>
      <td className="py-1">
        <div className="flex justify-start items-center gap-1">
          <PackageKindChip kind={item.kind as PackageKind} />
        </div>
      </td>
      <td className="py-1 pr-2 text-sm text-right tabular-nums">{sizeHuman ?? "—"}</td>
    </tr>
  );
}

