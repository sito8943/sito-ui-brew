import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

type Variant = "default" | "muted" | "primary" | "danger";

type Props = {
  className?: string;
  variant?: Variant;
  children?: React.ReactNode;
};

export default function Loading({ className = "", variant = "default", children }: Props) {
  const variantClass: Record<Variant, string> = {
    default: "text-text",
    muted: "text-gray-500",
    primary: "text-bg-primary",
    danger: "text-error",
  };

  return (
    <div className={`flex items-center gap-2 ${variantClass[variant]} ${className}`}>
      <FontAwesomeIcon icon={faSpinner} spin />
      {children ? <span className="text-sm">{children}</span> : null}
    </div>
  );
}

