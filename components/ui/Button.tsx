import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "accent" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type LinkButtonProps = CommonProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: never;
  };

type ButtonProps = LinkButtonProps | NativeButtonProps;

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs tracking-[0.2em]",
  md: "px-5 py-3 text-sm tracking-[0.18em]",
  lg: "px-6 py-3 text-sm tracking-[0.2em]"
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-bpBlack text-bpOffWhite hover:bg-bpBlackSoft",
  accent:
    "bg-bpPinkCta text-white shadow-[0_14px_32px_rgba(213,30,113,0.24)] hover:bg-[#bf165f]",
  secondary:
    "border border-bpBlack/20 bg-transparent text-bpBlack hover:bg-bpOffWhite hover:border-bpPink/30 hover:text-bpBlackSoft"
};

function getButtonClassName({
  variant = "primary",
  size = "md",
  className = ""
}: Pick<ButtonProps, "variant" | "size" | "className">) {
  return [
    "inline-flex items-center justify-center rounded-bpMd font-semibold uppercase transition",
    "shadow-bpMicro",
    sizeClasses[size],
    variantClasses[variant],
    className
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const classes = getButtonClassName({ variant, size, className });

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...rest } = props;
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
