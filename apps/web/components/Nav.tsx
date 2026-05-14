import Link from "next/link";
import { Container } from "./Container";

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

const LINKS: ReadonlyArray<NavLink> = [
  { href: "/app", label: "App" },
  { href: "/app/new", label: "New" },
  {
    href: "https://github.com/CUinspace233/stakeword/blob/main/DESIGN.md",
    label: "Design",
    external: true,
  },
];

export function Nav() {
  return (
    <Container>
      <nav
        aria-label="Primary navigation"
        className="flex items-center justify-between py-[26px]"
      >
        <Link
          href="/"
          className="flex items-center gap-3 text-[18px] font-extrabold tracking-[-0.04em]"
        >
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-ink font-mono text-base text-primary shadow-[0_0_0_4px_rgba(182,255,77,0.2)]">
            SW
          </span>
          <span>StakeWord</span>
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-[14px] py-[10px] text-sm font-bold text-text-muted transition hover:bg-paper hover:text-ink"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-[14px] py-[10px] text-sm font-bold text-text-muted transition hover:bg-paper hover:text-ink"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      </nav>
    </Container>
  );
}
