import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { currentSession } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { commitments } from "@/lib/db/schema";
import { getEvaluatorWallet } from "@/lib/evaluator";
import {
  onChainCreateJob,
  onChainSetBudget,
  onChainApproveUsdc,
  onChainFund,
  usdcAmountToBaseUnits,
} from "@/lib/actions";

export const runtime = "nodejs";

const CreateInput = z.object({
  goal: z.string().min(3).max(500),
  criteria: z.string().min(3).max(1000),
  stakeUsdc: z.string().regex(/^\d+(\.\d{1,6})?$/),
  /** Unix seconds for the deadline. */
  expiresAt: z.number().int().positive(),
});

export async function POST(req: Request): Promise<NextResponse> {
  const session = await currentSession();
  if (!session.walletId || !session.walletAddress) {
    return NextResponse.json({ error: "session has no wallet" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const evaluator = await getEvaluatorWallet();
  const db = getDb();
  const id = nanoid();
  const stakeBase = usdcAmountToBaseUnits(input.stakeUsdc);

  db.insert(commitments)
    .values({
      id,
      sessionId: session.id,
      goal: input.goal,
      criteria: input.criteria,
      stakeUsdcBaseUnits: stakeBase.toString(),
      status: "draft",
      expiresAt: input.expiresAt,
      clientWalletId: session.walletId,
      clientAddress: session.walletAddress,
      // MVP: provider is the same wallet as client (self-contract).
      providerWalletId: session.walletId,
      providerAddress: session.walletAddress,
    })
    .run();

  // Push it on-chain. Each step is best-effort; if a later step fails we leave
  // the DB row with whatever progress we made so a retry can resume.
  try {
    const created = await onChainCreateJob({
      clientWalletId: session.walletId,
      clientAddress: session.walletAddress as `0x${string}`,
      providerAddress: session.walletAddress as `0x${string}`,
      evaluatorAddress: evaluator.address,
      expiredAtUnix: input.expiresAt,
      description: `${input.goal}\n\nCriteria: ${input.criteria}`,
    });
    db.update(commitments)
      .set({
        jobId: Number(created.jobId),
        status: "open",
        updatedAt: new Date(),
      })
      .where(eq(commitments.id, id))
      .run();

    await onChainSetBudget({
      providerWalletId: session.walletId,
      jobId: created.jobId,
      amountUsdcBaseUnits: stakeBase,
    });
    await onChainApproveUsdc({
      clientWalletId: session.walletId,
      amountUsdcBaseUnits: stakeBase,
    });
    await onChainFund({
      clientWalletId: session.walletId,
      jobId: created.jobId,
    });

    db.update(commitments)
      .set({ status: "funded", updatedAt: new Date() })
      .where(eq(commitments.id, id))
      .run();

    return NextResponse.json({ id, jobId: Number(created.jobId), status: "funded" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { id, error: "on-chain step failed", details: message },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  const session = await currentSession();
  const db = getDb();
  const rows = db
    .select()
    .from(commitments)
    .where(eq(commitments.sessionId, session.id))
    .orderBy(desc(commitments.createdAt))
    .all();
  return NextResponse.json({ commitments: rows });
}
