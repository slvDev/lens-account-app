"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  wide?: boolean;
  loading?: boolean;
  children: ReactNode;
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  wide = false,
  loading = false,
  children,
  className = "",
  disabled,
  href,
  ...props
}: ButtonProps) {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  // Variant styles
  const variantStyles = {
    primary: "bg-button-primary-bg text-button-primary-text border border-button-primary-bg hover:bg-primary-dark focus:ring-text-primary",
    secondary: "bg-button-secondary-bg text-button-secondary-text border border-button-secondary-border hover:bg-gray-50 focus:ring-text-primary",
  };

  // Size styles
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-base",
  };

  // Wide (full width) style
  const wideStyle = wide ? "w-full" : "";

  // Combine all styles
  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${wideStyle} ${className}`.trim();

  // Loading spinner SVG (matches ref.html design)
  const spinner = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <path
        d="M15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );

  // If href is provided, render as link
  if (href) {
    return (
      <a
        href={href}
        className={buttonClasses}
        data-variant={variant}
        data-size={size}
        data-wide={wide}
        style={{ minWidth: size === "lg" ? "11rem" : undefined }}
      >
        {loading && spinner}
        {children}
      </a>
    );
  }

  // Otherwise render as button
  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      data-variant={variant}
      data-size={size}
      data-wide={wide}
      style={{ minWidth: size === "lg" ? "11rem" : undefined }}
      {...props}
    >
      {loading && spinner}
      {children}
    </button>
  );
}
