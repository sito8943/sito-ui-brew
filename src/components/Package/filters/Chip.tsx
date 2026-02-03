import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import IconButton from "../../IconButton";

export default function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-2 py-0.5 text-xs bg-white/70">
      {label}
      <IconButton aria-label="Clear filter" onClick={onClear} variant="secondary" className="!w-5 !h-5">
        <FontAwesomeIcon icon={faXmark} className="text-xs" />
      </IconButton>
    </span>
  );
}

