interface EyebrowProps {
  children: React.ReactNode;
}

export function Eyebrow({ children }: EyebrowProps) {
  return (
    <span className="inline-flex items-center gap-[10px] rounded-full border border-line bg-card/70 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_6px_rgba(182,255,77,0.25)]"
      />
      {children}
    </span>
  );
}
