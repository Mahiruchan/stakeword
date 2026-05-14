interface StatProps {
  value: string;
  label: string;
}

export function Stat({ value, label }: StatProps) {
  return (
    <div className="rounded-[20px] border border-line bg-card/70 p-4">
      <strong className="block text-[26px] tracking-[-0.015em]">{value}</strong>
      <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-text-muted">
        {label}
      </span>
    </div>
  );
}
