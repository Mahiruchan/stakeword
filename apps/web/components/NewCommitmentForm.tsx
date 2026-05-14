"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  goal: string;
  criteria: string;
  stakeUsdc: string;
  daysFromNow: number;
}

const DEFAULTS: FormState = {
  goal: "Ship the StakeWord MVP by 5/25",
  criteria:
    "Public live URL on Arc testnet showing a real ERC-8183 job lifecycle end-to-end, demonstrated in a screen recording.",
  stakeUsdc: "5",
  daysFromNow: 5,
};

type StepState = "idle" | "pending" | "done";

interface ChainStep {
  key: string;
  label: string;
  state: StepState;
  txHash?: string;
  explorer?: string;
}

const INITIAL_STEPS: ReadonlyArray<ChainStep> = [
  { key: "createjob", label: "createJob — anchor commitment as ERC-8183 job", state: "idle" },
  { key: "setbudget", label: "setBudget — provider declares stake amount", state: "idle" },
  { key: "approve", label: "approve USDC — let escrow pull funds", state: "idle" },
  { key: "fund", label: "fund — lock USDC into the job escrow", state: "idle" },
  { key: "agent", label: "ERC-8004 register — mint agent identity (first commitment only)", state: "idle" },
];

interface StreamEvent {
  step: string;
  data?: { id?: string; jobId?: number; txHash?: string; explorer?: string; message?: string };
}

export function NewCommitmentForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<ReadonlyArray<ChainStep>>(INITIAL_STEPS);
  const [commitmentId, setCommitmentId] = useState<string | null>(null);

  const onChange = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const updateStep = (key: string, patch: Partial<ChainStep>): void => {
    setSteps((cur) => cur.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setSteps(INITIAL_STEPS);
    setCommitmentId(null);

    const expiresAt = Math.floor(Date.now() / 1000) + state.daysFromNow * 86400;

    try {
      const res = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: state.goal,
          criteria: state.criteria,
          stakeUsdc: state.stakeUsdc,
          expiresAt,
        }),
      });
      if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const errorBody = (await res.json()) as { error?: string; details?: string };
        setError(errorBody.details ?? errorBody.error ?? "Failed to create commitment");
        setSubmitting(false);
        return;
      }
      if (!res.body) {
        setError("No stream from server");
        setSubmitting(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalId: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let event: StreamEvent;
          try {
            event = JSON.parse(line) as StreamEvent;
          } catch {
            continue;
          }
          handleEvent(event);
          if (event.step === "complete" && event.data?.id) {
            finalId = event.data.id;
          }
          if (event.step === "error") {
            setError(event.data?.message ?? "Unknown server error");
            setSubmitting(false);
            return;
          }
        }
      }

      if (finalId) {
        // hold for a beat so the user sees the final tick
        setTimeout(() => router.push(`/app/c/${finalId}`), 700);
      } else {
        setSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
      setSubmitting(false);
    }
  };

  const handleEvent = (event: StreamEvent): void => {
    if (event.step === "validated" && event.data?.id) {
      setCommitmentId(event.data.id);
      return;
    }
    const [key, phase] = event.step.split(":");
    if (!key || !phase) return;
    if (phase === "pending") {
      updateStep(key, { state: "pending" });
    } else if (phase === "done") {
      updateStep(key, {
        state: "done",
        txHash: event.data?.txHash,
        explorer: event.data?.explorer,
      });
    } else if (phase === "skipped") {
      // ERC-8004 agent register is skipped on subsequent commitments
      updateStep(key, { state: "done", explorer: undefined });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
          Goal
        </label>
        <input
          required
          maxLength={500}
          value={state.goal}
          onChange={(e) => onChange("goal", e.target.value)}
          className="w-full rounded-[18px] border border-line bg-card px-4 py-3 text-[18px] font-semibold tracking-[-0.01em] focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
          Criteria (specific, verifiable)
        </label>
        <textarea
          required
          rows={4}
          maxLength={1000}
          value={state.criteria}
          onChange={(e) => onChange("criteria", e.target.value)}
          className="w-full rounded-[18px] border border-line bg-card p-4 text-[16px] font-medium focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-[12px] text-text-muted">
          Claude reads this when evaluating your evidence. Be specific.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
            Stake (USDC)
          </label>
          <input
            required
            inputMode="decimal"
            pattern="\d+(\.\d{1,6})?"
            value={state.stakeUsdc}
            onChange={(e) => onChange("stakeUsdc", e.target.value)}
            className="w-full rounded-[18px] border border-line bg-card px-4 py-3 text-[24px] font-bold focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
            Deadline (days from now)
          </label>
          <input
            required
            type="number"
            min={1}
            max={60}
            value={state.daysFromNow}
            onChange={(e) => onChange("daysFromNow", Number(e.target.value))}
            className="w-full rounded-[18px] border border-line bg-card px-4 py-3 text-[24px] font-bold focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-[18px] border border-danger/40 bg-danger/10 p-4 text-[14px] text-danger">
          {error}
        </div>
      )}

      {submitting && <OnChainProgress steps={steps} commitmentId={commitmentId} />}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-primary px-6 text-[15px] font-extrabold text-ink shadow-[var(--shadow-button-primary)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Locking on Arc…" : "Stake + create on-chain"}
        </button>
        <a
          href="/app"
          className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-line bg-card px-6 text-[15px] font-bold text-ink"
        >
          Cancel
        </a>
      </div>

      <p className="text-[12px] text-text-muted">
        This calls <code>createJob → setBudget → approve → fund</code> in order. Each tx
        confirms in ~3-5s on Arc.
      </p>
    </form>
  );
}

interface OnChainProgressProps {
  steps: ReadonlyArray<ChainStep>;
  commitmentId: string | null;
}

function OnChainProgress({ steps, commitmentId }: OnChainProgressProps) {
  return (
    <div className="rounded-[22px] border border-line bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="m-0 text-[16px] font-bold tracking-[-0.01em]">On-chain progress</h3>
        {commitmentId && (
          <span className="font-mono text-[11px] text-text-muted">
            id {commitmentId.slice(0, 8)}…
          </span>
        )}
      </div>
      <ol className="space-y-2">
        {steps.map((s) => (
          <li
            key={s.key}
            className="grid grid-cols-[24px_1fr_auto] items-center gap-3 rounded-[12px] bg-mist/60 px-3 py-2"
          >
            <StepDot state={s.state} />
            <div>
              <span className="block font-mono text-[13px] font-semibold">{s.label}</span>
            </div>
            {s.state === "done" && s.explorer ? (
              <a
                href={s.explorer}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] underline-offset-4 hover:underline"
              >
                tx →
              </a>
            ) : (
              <span className="font-mono text-[11px] text-text-muted">
                {s.state === "pending" ? "…" : s.state === "done" ? "ok" : ""}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepDot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-ink">
        <span className="text-[10px] font-extrabold">✓</span>
      </span>
    );
  }
  if (state === "pending") {
    return (
      <span className="h-5 w-5 animate-pulse rounded-full bg-warning shadow-[0_0_0_4px_rgba(255,209,102,0.18)]" />
    );
  }
  return <span className="h-5 w-5 rounded-full border border-line bg-card" />;
}
