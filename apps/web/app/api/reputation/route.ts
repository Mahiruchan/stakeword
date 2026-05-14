import { NextResponse } from "next/server";
import type { Address } from "viem";
import { currentSession } from "@/lib/session";
import { getEvaluatorWallet } from "@/lib/evaluator";
import { getReputationSummary } from "@/lib/reputation/agent";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const session = await currentSession();
  if (!session.erc8004AgentId) {
    return NextResponse.json({ agentId: null, pass: null, fail: null });
  }
  const evaluator = await getEvaluatorWallet();
  const agentId = BigInt(session.erc8004AgentId);

  try {
    const [pass, fail] = await Promise.all([
      getReputationSummary({
        agentId,
        clientAddress: evaluator.address as Address,
        passed: true,
      }),
      getReputationSummary({
        agentId,
        clientAddress: evaluator.address as Address,
        passed: false,
      }),
    ]);
    return NextResponse.json({
      agentId: session.erc8004AgentId,
      pass: {
        count: pass.count.toString(),
        averageValue: pass.averageValue.toString(),
        lastIndex: pass.lastIndex.toString(),
      },
      fail: {
        count: fail.count.toString(),
        averageValue: fail.averageValue.toString(),
        lastIndex: fail.lastIndex.toString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        agentId: session.erc8004AgentId,
        error: err instanceof Error ? err.message : "read failed",
      },
      { status: 500 },
    );
  }
}
