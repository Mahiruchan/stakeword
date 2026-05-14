"use client";

import { useState } from "react";

interface Props {
  amount?: string;
}

interface Result {
  ok: boolean;
  explorer?: string;
  error?: string;
}

export function FundEvaluatorButton({ amount = "0.5" }: Props) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const onClick = async (): Promise<void> => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/fund-evaluator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const body = (await res.json()) as { ok?: boolean; explorer?: string; error?: string };
      setResult({
        ok: !!body.ok,
        explorer: body.explorer,
        error: body.error,
      });
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : "network error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="w-full rounded-full border border-line bg-card px-3 py-2 text-[12px] font-bold transition hover:bg-paper disabled:opacity-60"
      >
        {busy ? "Sending…" : `Send ${amount} USDC for evaluator gas`}
      </button>
      {result?.ok && result.explorer && (
        <a
          href={result.explorer}
          target="_blank"
          rel="noreferrer"
          className="block font-mono text-[11px] text-primary-deep underline-offset-4 hover:underline"
        >
          ✓ tx →
        </a>
      )}
      {result && !result.ok && (
        <span className="block text-[11px] text-danger">{result.error}</span>
      )}
    </div>
  );
}
