import { Container } from "./Container";

const NAV_LINKS = [
  { href: "#flow", label: "Flow" },
  { href: "#vault", label: "Vault" },
  { href: "#proof", label: "Proof" },
] as const;

export function Nav() {
  return (
    <Container>
      <nav
        aria-label="Primary navigation"
        className="flex items-center justify-between py-[26px]"
      >
        <div className="flex items-center gap-3 text-[18px] font-extrabold tracking-[-0.04em]">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-ink font-mono text-base text-primary shadow-[0_0_0_4px_rgba(182,255,77,0.2)]">
            SW
          </span>
          <span>StakeWord</span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-[14px] py-[10px] text-sm font-bold text-text-muted transition hover:bg-paper hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </Container>
  );
}
