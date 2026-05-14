"use client";

import { useEffect, useState } from "react";

interface Summary {
  count: string;
  averageValue: string;
  lastIndex: string;
}

interface ReputationResponse {
  agentId: string | null;
  pass: Summary | null;
  fail: Summary | null;
  error?: string;
}

export function ReputationBadge() {
  const [data, setData] = useState<ReputationResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const res = await fetch("/api/reputation");
      if (!res.ok || cancelled) return;
      const body = (await res.json()) as ReputationResponse;
      if (!cancelled) setData(body);
    };
    load().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data || !data.agentId) {
    return (
      <div className="rounded-[16px] border border-line bg-mist/60 p-3 text-[12px] text-text-muted">
        <strong className="block font-mono text-[11px] uppercase tracking-[0.06em]">
          ERC-8004 agent
        </strong>
        Not registered yet — auto-mints on your first commitment.
      </div>
    );
  }

  const passCount = data.pass ? Number(data.pass.count) : 0;
  const failCount = data.fail ? Number(data.fail.count) : 0;
  const total = passCount + failCount;
  const rate = total === 0 ? null : Math.round((passCount / total) * 100);

  return (
    <a
      href={`https://testnet.arcscan.app/address/0x8004B663056A597Dffe9eCcC1965A193B7388713`}
      target="_blank"
      rel="noreferrer"
      className="block rounded-[16px] border border-primary-deep/20 bg-primary/10 p-3 text-[12px] no-underline"
    >
      <strong className="block font-mono text-[11px] uppercase tracking-[0.06em]">
        ERC-8004 agent #{data.agentId}
      </strong>
      <div className="mt-1 flex items-baseline justify-between">
        <span>
          {passCount} completed · {failCount} failed
        </span>
        {rate !== null && (
          <span className="font-mono font-bold text-primary-deep">{rate}% pass</span>
        )}
      </div>
    </a>
  );
}
