import Link from "next/link";

type ButtonVariant = "primary" | "secondary";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

interface ButtonLinkProps extends ButtonBaseProps {
  href: string;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-ink shadow-[var(--shadow-button-primary)] hover:bg-primary-hover",
  secondary:
    "border border-line bg-card/70 text-ink hover:bg-card",
};

const BASE =
  "inline-flex min-h-[52px] items-center justify-center rounded-full px-[22px] text-[15px] font-extrabold transition";

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
}: ButtonLinkProps) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT_CLASS[variant]} ${className}`}>
      {children}
    </Link>
  );
}
