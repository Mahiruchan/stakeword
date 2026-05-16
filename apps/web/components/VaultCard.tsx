import { Pill } from "./Pill";

export interface VaultMetric {
  label: string;
  value: string;
}

export interface VaultCardProps {
  metrics: ReadonlyArray<VaultMetric>;
}

export function VaultCard({ metrics }: VaultCardProps) {
  return (
    <section
      id="vault"
      className="rounded-[28px] bg-card p-[22px] text-ink"
    >
      <header className="mb-[18px] flex items-start justify-between gap-4">
        <h3 className="m-0 text-[24px] leading-[1.1] tracking-[-0.015em]">
          Protocol vault
        </h3>
        <Pill tone="status">USYC</Pill>
      </header>
      <dl className="m-0">
        {metrics.map((m, idx) => (
          <div
            key={m.label}
            className={`flex items-baseline justify-between py-[14px] ${idx === 0 ? "" : "border-t border-line"}`}
          >
            <dt className="text-[13px] font-extrabold text-text-muted">{m.label}</dt>
            <dd className="m-0 text-[26px] tracking-[-0.015em] font-semibold">{m.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
