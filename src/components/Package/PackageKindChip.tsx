import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink } from "@fortawesome/free-solid-svg-icons";
import type { PackageKind } from "../../api/brew";

type Props = {
  kind: PackageKind;
  link?: boolean;
  href?: string;
  className?: string;
};

export default function PackageKindChip({ kind, link = true, href, className = "" }: Props) {
  const base = `inline-flex items-center rounded-4xl px-3 py-0.5 text-xs ${kind}`;
  const content = (
    <>
      {kind}
      {link && (
        <FontAwesomeIcon
          icon={faExternalLink}
          className="ml-1 -mt-0.5 text-[0.7rem] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      )}
    </>
  );

  if (link) {
    const url = href ?? `https://formulae.brew.sh/${kind}/`;
    return (
      <a
        className={`group ${base} hover:bg-primary ${className}`}
        href={url}
        target="_blank"
        rel="noopener"
      >
        {content}
      </a>
    );
  }

  return <span className={`${base} ${className}`}>{content}</span>;
}

