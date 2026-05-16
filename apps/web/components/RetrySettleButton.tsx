"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  commitmentId: string;
}

interface Result {
  ok: boolean;
  verdict?: string;
  error?: string;
  onChain?: { settleTx: string };
}

export function RetrySettleButton({ commitmentId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const onClick = async (): Promise<void> => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/commitments/${commitmentId}/retry-settle`, {
        method: "POST",
      });
      const body = (await res.json()) as Result;
      setResult(body);
      if (body.ok) router.refresh();
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : "network error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[22px] border border-warning/40 bg-warning/10 p-5">
      <h3 className="m-0 font-display text-[20px] tracking-[-0.015em]">
        Submission landed — settlement is pending
      </h3>
      <p className="mt-1 text-[13px] text-text-muted">
        Your proof hash is on-chain but the evaluator hasn't settled yet. This usually
        means the evaluator wallet ran out of gas. Top it up on the dashboard and retry.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="mt-3 inline-flex min-h-[42px] items-center justify-center rounded-full bg-ink px-4 text-[13px] font-bold text-paper hover:bg-graphite-soft disabled:opacity-60"
      >
        {busy ? "Re-settling…" : "Retry settlement on-chain"}
      </button>
      {result && (
        <div className="mt-3 text-[12px]">
          {result.ok ? (
            <a
              className="font-mono text-primary-deep underline-offset-4 hover:underline"
              href={result.onChain?.settleTx}
              target="_blank"
              rel="noreferrer"
            >
              ✓ settle tx → ({result.verdict})
            </a>
          ) : (
            <span className="text-danger">{result.error}</span>
          )}
        </div>
      )}
    </section>
  );
}
