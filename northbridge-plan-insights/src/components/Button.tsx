import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function Button({ variant = "secondary", size = "md", icon, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={["nb-button", `nb-button--${variant}`, `nb-button--${size}`, className].filter(Boolean).join(" ")} {...rest}>
      {icon && <span className="nb-button__icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
}

/** Looks like a Button, behaves like a link (navigates). */
export function ButtonLink({ variant = "secondary", size = "md", className, children, ...rest }: ButtonLinkProps) {
  return (
    <a className={["nb-button", `nb-button--${variant}`, `nb-button--${size}`, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </a>
  );
}
