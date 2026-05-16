import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { commitments } from "@/lib/db/schema";

export const runtime = "nodejs";

interface Row {
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

export async function GET(): Promise<NextResponse> {
  const db = getDb();
  const rows = db
    .select()
    .from(commitments)
    .orderBy(desc(commitments.updatedAt))
    .all();

  const byAddress = new Map<string, Row>();
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

    const status = c.status;
    const isCompleted = status === "completed";
    const isFailed = status === "rejected" || status === "expired";
    const isInflight =
      status === "open" || status === "funded" || status === "submitted";
    if (isInflight) agg.pooledBaseUnits += stake;
    if (isCompleted) agg.completedCount += 1;
    if (isFailed) agg.failedCount += 1;
    if (isInflight) agg.inflightCount += 1;

    const addr = c.clientAddress.toLowerCase();
    const existing = byAddress.get(addr);
    const lastMs = c.updatedAt instanceof Date ? c.updatedAt.getTime() : Date.now();
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
      const rateA = ratio(a.completed, a.completed + a.failed);
      const rateB = ratio(b.completed, b.completed + b.failed);
      if (rateA !== rateB) return rateB - rateA;
      return b.completed - a.completed;
    })
    .slice(0, 50);

  // Trivia stat ignored but kept for future surfacing.
  void sql;

  return NextResponse.json({
    aggregate: {
      totalStakeBaseUnits: agg.totalStakeBaseUnits.toString(),
      pooledBaseUnits: agg.pooledBaseUnits.toString(),
      completedCount: agg.completedCount,
      failedCount: agg.failedCount,
      inflightCount: agg.inflightCount,
      uniqueAddresses: agg.uniqueAddresses,
    },
    leaderboard,
  });
}

function ratio(num: number, denom: number): number {
  return denom === 0 ? 0 : num / denom;
}
