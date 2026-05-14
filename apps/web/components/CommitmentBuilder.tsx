import { ButtonLink } from "./Button";
import { Field } from "./Field";
import { Pill } from "./Pill";

export interface CommitmentBuilderProps {
  chainLabel: string;
  goal: string;
  provider: string;
  evaluator: string;
  stakeUsdc: string;
  fundHref: string;
}

export function CommitmentBuilder({
  chainLabel,
  goal,
  provider,
  evaluator,
  stakeUsdc,
  fundHref,
}: CommitmentBuilderProps) {
  return (
    <aside
      id="builder"
      aria-label="Commitment builder preview"
      className="relative rounded-[30px] border border-ink/10 bg-card p-[22px] shadow-[var(--shadow-card)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[-14px] -z-10 rounded-[42px] bg-[linear-gradient(135deg,rgba(182,255,77,0.45),rgba(82,215,255,0.22),transparent_72%)] blur-[10px]"
      />

      <header className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[24px] leading-[1.1] tracking-[-0.015em]">
            Commitment builder
          </h2>
          <p className="mt-[7px] font-semibold text-text-muted">
            Claude turns fuzzy goals into verifiable job terms.
          </p>
        </div>
        <Pill tone="mono">{chainLabel}</Pill>
      </header>

      <Field label="Goal" value={goal} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Provider" value={provider} />
        <Field label="Evaluator" value={evaluator} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[22px] bg-graphite p-[18px] text-paper">
        <div>
          <small className="font-bold text-text-dim">USDC stake</small>
          <strong className="mt-1 block text-[34px] tracking-[-0.025em]">
            {stakeUsdc}
          </strong>
        </div>
        <ButtonLink href={fundHref} className="min-h-[46px] !px-[18px]">
          Fund job
        </ButtonLink>
      </div>
    </aside>
  );
}
