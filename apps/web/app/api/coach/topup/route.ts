import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { currentSession } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { coachBalance } from "@/lib/db/schema";
import { getEvaluatorWallet } from "@/lib/evaluator";
import { transferUsdc } from "@/lib/circle/wallets";
import { usdcAmountToBaseUnits } from "@/lib/actions";

export const runtime = "nodejs";

const Input = z.object({ amount: z.string().regex(/^\d+(\.\d{1,6})?$/) });

/**
 * Top up the coach prepaid balance. One real USDC transfer (user → evaluator)
 * stands in for what would otherwise be a Circle Gateway batched settlement
 * across many x402 calls.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const session = await currentSession();
  if (!session.walletId || !session.walletAddress) {
    return NextResponse.json({ error: "no wallet" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed" }, { status: 400 });
  }

  const evaluator = await getEvaluatorWallet();
  const tx = await transferUsdc({
    fromWalletId: session.walletId,
    toAddress: evaluator.address,
    amount: parsed.data.amount,
    label: "coach topup",
  });

  const credit = usdcAmountToBaseUnits(parsed.data.amount);
  const db = getDb();
  const existing = db
    .select()
    .from(coachBalance)
    .where(eq(coachBalance.sessionId, session.id))
    .get();
  if (existing) {
    const newBalance = BigInt(existing.balanceBaseUnits) + credit;
    db.update(coachBalance)
      .set({ balanceBaseUnits: newBalance.toString(), updatedAt: new Date() })
      .where(eq(coachBalance.sessionId, session.id))
      .run();
  } else {
    db.insert(coachBalance)
      .values({
        sessionId: session.id,
        balanceBaseUnits: credit.toString(),
        totalSpentBaseUnits: "0",
        callsCount: 0,
      })
      .run();
  }
  return NextResponse.json({ ok: true, txExplorer: tx.explorer, credited: parsed.data.amount });
}
