import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

type SortKey = "name" | "kind" | "size";

type Props = {
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
};

export default function PackageTableHeader({ sortKey, sortAsc, onSort }: Props) {
  const { t } = useTranslation();
  const Icon = (active: boolean) => (
    <FontAwesomeIcon
      icon={active ? (sortAsc ? faChevronUp : faChevronDown) : faChevronUp}
      className={`text-xs transition-opacity ${active ? "opacity-100" : "opacity-10 group-hover:opacity-70"}`}
    />
  );

  return (
    <tr className="border-b border-gray-200">
      <th className="text-start py-1 w-64">
        <div className="flex gap-2 items-center">
          <div className="min-w-19" />
          <button className="flex items-center gap-1 group" onClick={() => onSort("name")}>
            <span>{t("packages.table.headers.name")}</span>
            {Icon(sortKey === "name")}
          </button>
        </div>
      </th>
      <th className="text-start">
        <button className="flex items-center gap-1 group" onClick={() => onSort("kind")}>
          <span>{t("packages.table.headers.kind")}</span>
          {Icon(sortKey === "kind")}
        </button>
      </th>
      <th className="text-start w-28">
        <button className="flex items-center gap-1 group" onClick={() => onSort("size")}>
          <span>{t("packages.table.headers.size")}</span>
          {Icon(sortKey === "size")}
        </button>
      </th>
    </tr>
  );
}

