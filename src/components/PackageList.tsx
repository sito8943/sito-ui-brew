import { PackageListItem } from "../api/brew";

type Props = {
  items: PackageListItem[];
  onSelect: (item: PackageListItem) => void;
  loading?: boolean;
  error?: string | null;
};

export function PackageList({ items, onSelect, loading, error }: Props) {
  if (loading) return <div className="list-status">Loading packages…</div>;
  if (error) return <div className="list-error">{error}</div>;
  if (!items.length) return <div className="list-empty">No packages found.</div>;

  return (
    <div className="pkg-list" role="list">
      {items.map((it) => (
        <button
          key={`${it.kind}:${it.name}`}
          className="pkg-row"
          role="listitem"
          onClick={() => onSelect(it)}
          title={it.name}
        >
          <span className="pkg-name">{it.name}</span>
          <span className={`pkg-kind ${it.kind}`}>{it.kind}</span>
        </button>
      ))}
    </div>
  );
}

export default PackageList;

