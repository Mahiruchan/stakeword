import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { currentSession } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { commitments, proofs } from "@/lib/db/schema";
import { getEvaluatorWallet } from "@/lib/evaluator";
import { onChainComplete, onChainReject, onChainSubmit } from "@/lib/actions";
import { verifyTextEvidence, verifyImageEvidence } from "@/lib/llm/verify";
import { giveFeedback } from "@/lib/reputation/agent";

export const runtime = "nodejs";

function stakeTier(baseUnits: string): string {
  const usdc = Number(baseUnits) / 1_000_000;
  if (usdc < 1) return "tiny";
  if (usdc < 10) return "small";
  if (usdc < 50) return "medium";
  return "large";
}

const Input = z.discriminatedUnion("contentType", [
  z.object({
    contentType: z.literal("text"),
    content: z.string().min(1).max(10000),
  }),
  z.object({
    contentType: z.literal("url"),
    content: z.string().url(),
  }),
  z.object({
    contentType: z.literal("image-base64"),
    content: z.string().min(50),
    mediaType: z.enum(["image/png", "image/jpeg", "image/webp"]),
    caption: z.string().max(500).optional(),
  }),
]);

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, ctx: RouteCtx): Promise<NextResponse> {
  const session = await currentSession();
  const { id } = await ctx.params;
  const db = getDb();
  const commitment = db
    .select()
    .from(commitments)
    .where(and(eq(commitments.id, id), eq(commitments.sessionId, session.id)))
    .get();
  if (!commitment) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (commitment.status !== "funded") {
    return NextResponse.json(
      { error: `cannot submit proof on a ${commitment.status} commitment` },
      { status: 409 },
    );
  }
  if (commitment.jobId == null || !commitment.providerWalletId) {
    return NextResponse.json({ error: "commitment missing on-chain mapping" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // 1) Ask Claude/Kimi to evaluate
  const verdict =
    input.contentType === "image-base64"
      ? await verifyImageEvidence({
          criteria: commitment.criteria,
          imageBase64: input.content,
          mediaType: input.mediaType,
          caption: input.caption ?? "(no caption)",
        })
      : await verifyTextEvidence({
          criteria: commitment.criteria,
          evidence:
            input.contentType === "url"
              ? `URL evidence: ${input.content}`
              : input.content,
        });

  const proofId = nanoid();
  db.insert(proofs)
    .values({
      id: proofId,
      commitmentId: id,
      content: input.content,
      contentType: input.contentType,
      verdict: verdict.verdict,
      reasoning: verdict.reasoning,
    })
    .run();

  if (verdict.verdict === "needs-more") {
    return NextResponse.json({
      proofId,
      verdict: verdict.verdict,
      reasoning: verdict.reasoning,
      onChain: null,
    });
  }

  // 2) On-chain: provider submits deliverable hash, then evaluator completes/rejects
  const deliverableText = `proof:${proofId}:${verdict.verdict}`;
  const evaluator = await getEvaluatorWallet();

  try {
    const submitTx = await onChainSubmit({
      providerWalletId: commitment.providerWalletId,
      jobId: BigInt(commitment.jobId),
      deliverableText,
    });
    db.update(commitments)
      .set({
        status: "submitted",
        deliverableHash: submitTx.deliverableHash,
        updatedAt: new Date(),
      })
      .where(eq(commitments.id, id))
      .run();

    const reasonText = verdict.reasoning.slice(0, 200);
    const settle =
      verdict.verdict === "pass"
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
        status: verdict.verdict === "pass" ? "completed" : "rejected",
        reasonHash: settle.reasonHash,
        updatedAt: new Date(),
      })
      .where(eq(commitments.id, id))
      .run();

    // Anchor reputation on ERC-8004 (best-effort — failure here doesn't unsettle the job)
    let reputationExplorer: string | null = null;
    if (session.erc8004AgentId) {
      try {
        const fb = await giveFeedback({
          walletId: evaluator.walletId,
          agentId: BigInt(session.erc8004AgentId),
          passed: verdict.verdict === "pass",
          reasonText: verdict.reasoning,
          tier: stakeTier(commitment.stakeUsdcBaseUnits),
        });
        reputationExplorer = fb.explorer;
      } catch {
        reputationExplorer = null;
      }
    }

    return NextResponse.json({
      proofId,
      verdict: verdict.verdict,
      reasoning: verdict.reasoning,
      onChain: {
        submitTx: submitTx.explorer,
        settleTx: settle.explorer,
        reputationTx: reputationExplorer,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      {
        proofId,
        verdict: verdict.verdict,
        reasoning: verdict.reasoning,
        onChainError: message,
      },
      { status: 500 },
    );
  }
}
