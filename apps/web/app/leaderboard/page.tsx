import { Container } from "@/components/Container";
import { Nav } from "@/components/Nav";
import { Pill } from "@/components/Pill";
import { Stat } from "@/components/Stat";
import { ARC_TESTNET_EXPLORER } from "@/lib/chain/constants";
import { getDb } from "@/lib/db/client";
import { commitments } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface BoardRow {
  address: string;
  completed: number;
  failed: number;
  inflight: number;
  totalStakeBaseUnits: string;
  lastActivityMs: number;
}

interface Aggregate {
  totalStakeBaseUnits: bigint;
  pooledBaseUnits: bigint;
  completedCount: number;
  failedCount: number;
  inflightCount: number;
  uniqueAddresses: number;
}

function fmtUsd(baseUnits: bigint | string): string {
  const n = Number(baseUnits) / 1_000_000;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function shorten(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function rate(row: BoardRow): number | null {
  const settled = row.completed + row.failed;
  return settled === 0 ? null : Math.round((row.completed / settled) * 100);
}

export default async function LeaderboardPage() {
  const db = getDb();
  const rows = db
    .select()
    .from(commitments)
    .orderBy(desc(commitments.updatedAt))
    .all();

  const byAddress = new Map<string, BoardRow>();
  const agg: Aggregate = {
    totalStakeBaseUnits: 0n,
    pooledBaseUnits: 0n,
    completedCount: 0,
    failedCount: 0,
    inflightCount: 0,
    uniqueAddresses: 0,
  };
  for (const c of rows) {
    if (!c.clientAddress) continue;
    const stake = BigInt(c.stakeUsdcBaseUnits);
    agg.totalStakeBaseUnits += stake;
    const isCompleted = c.status === "completed";
    const isFailed = c.status === "rejected" || c.status === "expired";
    const isInflight =
      c.status === "open" || c.status === "funded" || c.status === "submitted";
    if (isInflight) agg.pooledBaseUnits += stake;
    if (isCompleted) agg.completedCount += 1;
    if (isFailed) agg.failedCount += 1;
    if (isInflight) agg.inflightCount += 1;

    const addr = c.clientAddress.toLowerCase();
    const lastMs = c.updatedAt instanceof Date ? c.updatedAt.getTime() : Date.now();
    const existing = byAddress.get(addr);
    if (!existing) {
      byAddress.set(addr, {
        address: addr,
        completed: isCompleted ? 1 : 0,
        failed: isFailed ? 1 : 0,
        inflight: isInflight ? 1 : 0,
        totalStakeBaseUnits: stake.toString(),
        lastActivityMs: lastMs,
      });
    } else {
      existing.completed += isCompleted ? 1 : 0;
      existing.failed += isFailed ? 1 : 0;
      existing.inflight += isInflight ? 1 : 0;
      existing.totalStakeBaseUnits = (
        BigInt(existing.totalStakeBaseUnits) + stake
      ).toString();
      if (lastMs > existing.lastActivityMs) existing.lastActivityMs = lastMs;
    }
  }
  agg.uniqueAddresses = byAddress.size;
  const leaderboard = [...byAddress.values()]
    .sort((a, b) => {
      const ra = rate(a) ?? 0;
      const rb = rate(b) ?? 0;
      if (ra !== rb) return rb - ra;
      return b.completed - a.completed;
    })
    .slice(0, 50);

  const completionRate =
    agg.completedCount + agg.failedCount === 0
      ? null
      : Math.round((agg.completedCount / (agg.completedCount + agg.failedCount)) * 100);

  return (
    <main className="min-h-screen bg-paper">
      <Nav />
      <Container className="pb-20 pt-10">
        <header className="mb-8 max-w-[720px]">
          <h1 className="m-0 font-display text-[44px] leading-[1.02] tracking-[-0.025em]">
            Leaderboard
          </h1>
          <p className="mt-3 text-text-muted">
            Every commitment on StakeWord is an ERC-8183 job on Arc testnet — and every
            settled job posts ERC-8004 reputation feedback. This board is the live
            aggregate.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={String(agg.uniqueAddresses)} label="Stakers" />
          <Stat value={fmtUsd(agg.pooledBaseUnits)} label="In-flight stake" />
          <Stat value={String(agg.completedCount)} label="Completed" />
          <Stat
            value={completionRate === null ? "—" : `${completionRate}%`}
            label="Completion rate"
          />
        </section>

        <section className="rounded-[24px] border border-line bg-card overflow-hidden">
          <header className="grid grid-cols-[1.4fr_repeat(4,1fr)] gap-3 border-b border-line bg-mist/40 px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-text-muted">
            <span>Wallet</span>
            <span className="text-right">Completed</span>
            <span className="text-right">Failed</span>
            <span className="text-right">In-flight</span>
            <span className="text-right">Pass rate</span>
          </header>
          {leaderboard.length === 0 ? (
            <p className="px-5 py-10 text-center text-text-muted">
              No commitments yet. Be the first to stake.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {leaderboard.map((row) => (
                <li
                  key={row.address}
                  className="grid grid-cols-[1.4fr_repeat(4,1fr)] items-center gap-3 px-5 py-3 text-[14px]"
                >
                  <a
                    href={`${ARC_TESTNET_EXPLORER}/address/${row.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[13px] font-bold underline-offset-4 hover:underline"
                  >
                    {shorten(row.address)}
                  </a>
                  <span className="text-right font-mono">{row.completed}</span>
                  <span className="text-right font-mono">{row.failed}</span>
                  <span className="text-right font-mono">{row.inflight}</span>
                  <span className="text-right">
                    {rate(row) === null ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <Pill tone={rate(row)! >= 50 ? "status" : "mono"}>
                        {rate(row)}%
                      </Pill>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-6 text-[12px] text-text-muted">
          Each address is an ERC-8004 agent. Click through to its on-chain history.
          Public, permanent, no one can re-write a missed deadline.
        </footer>
      </Container>
    </main>
  );
}
