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

export function NewCommitmentForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
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
      const body = (await res.json()) as { id?: string; error?: string; details?: string };
      if (!res.ok || !body.id) {
        setError(body.details ?? body.error ?? "Failed to create commitment");
        setSubmitting(false);
        return;
      }
      router.push(`/app/c/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
      setSubmitting(false);
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
        This calls <code>createJob → setBudget → approve → fund</code> in order. It may
        take ~30s while each transaction confirms on Arc.
      </p>
    </form>
  );
}
