import React, { forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = {
  variant?: Variant;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantClass: Record<Variant, string> = {
  primary: "bg-bg-primary text-white hover:opacity-90 border border-transparent",
  secondary: "bg-base text-text border border-border hover:bg-base-dark/400",
  danger: "text-red-600 border border-red-200 hover:bg-red-200",
  ghost: "bg-transparent border border-gray-200 hover:bg-gray-300",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", className = "", children, ...rest },
  ref
) {
  const base = "px-3 py-1 rounded-md disabled:opacity-50 transition duration-200";
  return (
    <button ref={ref} className={`${base} ${variantClass[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
});

export default Button;

