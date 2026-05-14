import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { currentSession } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { commitments, proofs } from "@/lib/db/schema";
import { getEvaluatorWallet } from "@/lib/evaluator";
import { onChainComplete, onChainReject } from "@/lib/actions";
import { giveFeedback } from "@/lib/reputation/agent";

export const runtime = "nodejs";

function stakeTier(baseUnits: string): string {
  const usdc = Number(baseUnits) / 1_000_000;
  if (usdc < 1) return "tiny";
  if (usdc < 10) return "small";
  if (usdc < 50) return "medium";
  return "large";
}

interface RouteCtx {
  params: Promise<{ id: string }>;
}

/**
 * Re-runs the evaluator settlement (`complete` or `reject`) for a commitment
 * that's stuck in `submitted`. This happens when the proof endpoint's submit()
 * tx succeeded but the subsequent complete()/reject() failed (e.g. evaluator
 * wallet ran out of USDC gas).
 *
 * Uses the *latest* proof's verdict as the source of truth.
 */
export async function POST(_req: Request, ctx: RouteCtx): Promise<NextResponse> {
  const session = await currentSession();
  const { id } = await ctx.params;
  const db = getDb();
  const commitment = db
    .select()
    .from(commitments)
    .where(and(eq(commitments.id, id), eq(commitments.sessionId, session.id)))
    .get();
  if (!commitment) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (commitment.status !== "submitted") {
    return NextResponse.json(
      { error: `commitment is ${commitment.status}, nothing to retry` },
      { status: 409 },
    );
  }
  if (commitment.jobId == null) {
    return NextResponse.json({ error: "commitment missing on-chain mapping" }, { status: 500 });
  }

  const latestProof = db
    .select()
    .from(proofs)
    .where(eq(proofs.commitmentId, id))
    .orderBy(desc(proofs.createdAt))
    .limit(1)
    .get();
  if (!latestProof || !latestProof.verdict) {
    return NextResponse.json({ error: "no proof verdict to act on" }, { status: 409 });
  }
  if (latestProof.verdict === "needs-more") {
    return NextResponse.json(
      { error: "latest proof was needs-more — submit stronger evidence" },
      { status: 409 },
    );
  }

  const evaluator = await getEvaluatorWallet();
  const reasonText = (latestProof.reasoning ?? "").slice(0, 200);

  try {
    const settle =
      latestProof.verdict === "pass"
        ? await onChainComplete({
            evaluatorWalletId: evaluator.walletId,
            jobId: BigInt(commitment.jobId),
            reasonText,
          })
        : await onChainReject({
            evaluatorWalletId: evaluator.walletId,
            jobId: BigInt(commitment.jobId),
            reasonText,
          });

    db.update(commitments)
      .set({
        status: latestProof.verdict === "pass" ? "completed" : "rejected",
        reasonHash: settle.reasonHash,
        updatedAt: new Date(),
      })
      .where(eq(commitments.id, id))
      .run();

    let reputationExplorer: string | null = null;
    if (session.erc8004AgentId) {
      try {
        const fb = await giveFeedback({
          walletId: evaluator.walletId,
          agentId: BigInt(session.erc8004AgentId),
          passed: latestProof.verdict === "pass",
          reasonText: latestProof.reasoning ?? "",
          tier: stakeTier(commitment.stakeUsdcBaseUnits),
        });
        reputationExplorer = fb.explorer;
      } catch {
        reputationExplorer = null;
      }
    }

    return NextResponse.json({
      ok: true,
      verdict: latestProof.verdict,
      onChain: { settleTx: settle.explorer, reputationTx: reputationExplorer },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
