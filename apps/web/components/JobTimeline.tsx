import { Pill } from "./Pill";

export type JobStepState = "done" | "pending";

export interface JobStep {
  state: JobStepState;
  title: string;
  description: string;
  hash: string;
}

export interface JobTimelineProps {
  jobId: number;
  status: string;
  steps: ReadonlyArray<JobStep>;
}

const DOT_CLASS: Record<JobStepState, string> = {
  done: "bg-primary shadow-[0_0_0_6px_rgba(182,255,77,0.13)]",
  pending: "bg-warning shadow-[0_0_0_6px_rgba(255,209,102,0.13)]",
};

export function JobTimeline({ jobId, status, steps }: JobTimelineProps) {
  return (
    <section className="rounded-[28px] border border-paper/12 bg-graphite-soft p-[22px] shadow-[var(--shadow-dark-card)] text-paper">
      <header className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 text-[24px] leading-[1.1] tracking-[-0.015em]">
            ERC-8183 Job #{jobId}
          </h3>
          <p className="mt-[7px] text-text-dim">
            Open → Funded → Submitted → Completed
          </p>
        </div>
        <Pill tone="status">{status}</Pill>
      </header>

      <div className="mt-[18px] grid gap-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-[14px] rounded-[18px] border border-paper/8 bg-paper/[0.06] p-[15px]"
          >
            <span className={`block h-4 w-4 rounded-full ${DOT_CLASS[step.state]}`} />
            <div>
              <h4 className="m-0 font-mono text-[14px] font-semibold">{step.title}</h4>
              <p className="mt-1 text-[13px] text-text-dim">{step.description}</p>
            </div>
            <span className="font-mono text-[12px] font-bold text-proof">{step.hash}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
