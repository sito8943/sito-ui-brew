import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useSearch } from "../../context/SearchContext";
import IconButton from "../IconButton";

export default function FilterChipsRow() {
  const { query, kinds, sizeMinMB, sizeMaxMB, clearAll } = useSearch();
  const hasAny = !!query || kinds.size > 0 || typeof sizeMinMB === "number" || typeof sizeMaxMB === "number";
  if (!hasAny) return null;
  return (
    <tr>
      <td colSpan={3} className="py-1">
        <div className="flex flex-wrap items-center gap-2">
          <QueryChip />
          <KindsChip />
          <SizeMinChip />
          <SizeMaxChip />
          <ClearAllButton onClearAll={clearAll} />
        </div>
      </td>
    </tr>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-2 py-0.5 text-xs bg-white/70">
      {label}
      <IconButton aria-label="Clear filter" onClick={onClear} variant="secondary" className="!w-5 !h-5">
        <FontAwesomeIcon icon={faXmark} className="text-xs" />
      </IconButton>
    </span>
  );
}

function QueryChip() {
  const { t } = useTranslation();
  const { query, clearFilter } = useSearch();
  if (!query) return null;
  return <Chip label={`${t("packages.filters.query")}: ${query}`} onClear={() => clearFilter("query")} />;
}

function KindsChip() {
  const { t } = useTranslation();
  const { kinds, clearFilter } = useSearch();
  if (!kinds.size) return null;
  return (
    <Chip label={`${t("packages.filters.kind")}: ${Array.from(kinds).join(",")}`} onClear={() => clearFilter("kinds")} />
  );
}

function SizeMinChip() {
  const { t } = useTranslation();
  const { sizeMinMB, clearFilter } = useSearch();
  if (typeof sizeMinMB !== "number") return null;
  return <Chip label={t("packages.filters.sizeMin", { value: sizeMinMB })} onClear={() => clearFilter("sizeMin")} />;
}

function SizeMaxChip() {
  const { t } = useTranslation();
  const { sizeMaxMB, clearFilter } = useSearch();
  if (typeof sizeMaxMB !== "number") return null;
  return <Chip label={t("packages.filters.sizeMax", { value: sizeMaxMB })} onClear={() => clearFilter("sizeMax")} />;
}

function ClearAllButton({ onClearAll }: { onClearAll: () => void }) {
  const { t } = useTranslation();
  return (
    <button className="text-xs underline text-gray-600 hover:text-gray-900" onClick={onClearAll}>
      {t("packages.filters.clearAll")}
    </button>
  );
}
