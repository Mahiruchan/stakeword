type PillTone = "mono" | "status" | "info";

interface PillProps {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASS: Record<PillTone, string> = {
  mono: "bg-ink text-primary",
  status: "bg-primary/20 text-primary-deep",
  info: "bg-proof/20 text-proof",
};

export function Pill({ tone = "mono", children, className = "" }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-[7px] whitespace-nowrap rounded-full px-[10px] py-[7px] font-mono text-[11px] font-bold ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
