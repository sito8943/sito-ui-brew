import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faExternalLink, faTrash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import type { PackageKind, PackageListItem } from "../../api/brew";
import { useSelectedPackage } from "../../context/SelectedPackageContext";
import { useEffect, useState } from "react";
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
  const { promptUninstall, selected, intent } = useSelectedPackage();
  const [openingDetails, setOpeningDetails] = useState(false);
  const [openingUninstall, setOpeningUninstall] = useState(false);

  useEffect(() => {
    if (selected?.name === item.name) {
      // Drawer has been requested for this item; stop any row-level loading
      setOpeningDetails(false);
      if (intent === "uninstall") setOpeningUninstall(false);
    }
  }, [selected, intent, item.name]);
  return (
    <tr key={`${item.kind}:${item.name}`} className={`w-full ${index % 2 ? "bg-primary/10" : ""}`}>
      <td className="py-1 pl-2">
        <div className="flex justify-start items-center gap-2">
          <div className="flex gap-1">
            <IconButton
              variant="primary"
              onClick={() => { setOpeningDetails(true); onSelect(item); }}
              disabled={openingDetails}
              title={t("_accessibility:actions.openDetails", { name: item.name })}
              ariaLabel={t("_accessibility:actions.openDetails", { name: item.name })}
            >
              {openingDetails ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faCircleInfo} />
              )}
            </IconButton>
            <IconButton
              variant="danger"
              onClick={() => {
                setOpeningUninstall(true);
                if (promptUninstall) promptUninstall(item);
                else if (onUninstall) onUninstall(item);
              }}
              disabled={openingUninstall}
              title={t("_accessibility:actions.uninstall", { name: item.name })}
              ariaLabel={t("_accessibility:actions.uninstall", { name: item.name })}
            >
              {openingUninstall ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faTrash} />
              )}
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
