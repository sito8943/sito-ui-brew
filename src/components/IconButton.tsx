import React, { forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  variant?: Variant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  {
    children,
    onClick,
    title,
    ariaLabel,
    className = "",
    disabled,
    variant = "primary",
    ...rest
  },
  ref
) {
  const base =
    "transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full";

  const variantClass: Record<Variant, string> = {
    primary: "text-bg-primary hover:text-hover-primary hover:bg-bg-primary/10",
    secondary:
      "text-text-muted hover:text-text hover:bg-base-dark/20",
    danger: "text-red-500 hover:bg-bg-error/10",
  };

  return (
    <button
      ref={ref}
      className={`${base} ${variantClass[variant]} ${className}`}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
});

export default IconButton;
