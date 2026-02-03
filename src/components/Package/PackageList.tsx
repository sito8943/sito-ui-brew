import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faSpinner } from "@fortawesome/free-solid-svg-icons";

// types
import { PackageListItem } from "../../api/brew";

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
  if (loading)
    return (
      <div className="w-full text-center py-4">
        <FontAwesomeIcon icon={faSpinner} spin />
      </div>
    );
  if (error) return <div className="list-error">{error}</div>;
  if (!items.length)
    return <div className="list-empty">No packages found.</div>;

  return (
    <table className="w-full">
      <tr className="border-b border-gray-200">
        <th></th>
        <th className="text-start py-1">Name</th>
        <th className="text-start">Kind</th>
      </tr>
      {items.map((it, i) => (
        <tr
          key={`${it.kind}:${it.name}`}
          className={`w-full ${i % 2 ? "bg-primary/10" : ""}`}
        >
          <td className="py-1 pl-2">
            <div className="flex gap-2">
              <button onClick={() => onSelect(it)} title={it.name}>
                <FontAwesomeIcon icon={faEdit} />
              </button>
              <button
                onClick={() => onUninstall && onUninstall(it)}
                title={`Uninstall ${it.name}`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </td>
          <td className="">{it.name}</td>
          <td className={`${it.kind}`}>{it.kind}</td>
        </tr>
      ))}
    </table>
  );
}

export default PackageList;
