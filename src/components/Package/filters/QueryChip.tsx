import { useTranslation } from "react-i18next";
import { useSearch } from "../../../context/SearchContext";
import Chip from "./Chip";

export default function QueryChip() {
  const { t } = useTranslation();
  const { query, clearFilter } = useSearch();
  if (!query) return null;
  return <Chip label={`${t("packages.filters.query")}: ${query}`} onClear={() => clearFilter("query")} />;
}

