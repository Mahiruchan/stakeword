import { Pill } from "./Pill";

export interface X402MeterProps {
  pricePerCall: string;
  callsToday: number;
  /** 0-1 fraction shown on the bar */
  fill: number;
}

export function X402Meter({ pricePerCall, callsToday, fill }: X402MeterProps) {
  const pct = Math.min(100, Math.max(0, Math.round(fill * 100)));
  return (
    <section className="rounded-[28px] bg-card p-[22px] text-ink">
      <header className="mb-[14px] flex items-start justify-between gap-4">
        <h3 className="m-0 text-[24px] leading-[1.1] tracking-[-0.015em]">
          x402 coach meter
        </h3>
        <Pill tone="mono">{pricePerCall}</Pill>
      </header>
      <p className="m-0 font-semibold leading-[1.5] text-text-muted">
        Claude nudges, proof checks, and summary reports create metered AI payment
        activity.
      </p>
      <div
        aria-hidden
        className="mt-[18px] h-3 overflow-hidden rounded-full bg-ink/10"
      >
        <div
          className="h-full rounded-[inherit] bg-[linear-gradient(90deg,var(--color-proof),var(--color-primary))]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-[14px] flex items-baseline justify-between border-t border-line py-[14px]">
        <span className="text-[13px] font-extrabold text-text-muted">Calls today</span>
        <strong className="text-[26px] tracking-[-0.015em]">{callsToday}</strong>
      </div>
    </section>
  );
}
