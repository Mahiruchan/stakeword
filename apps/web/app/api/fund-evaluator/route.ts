import { NextResponse } from "next/server";
import { z } from "zod";
import { currentSession } from "@/lib/session";
import { getEvaluatorWallet } from "@/lib/evaluator";
import { transferUsdc } from "@/lib/circle/wallets";

export const runtime = "nodejs";

// MVP helper: top up the evaluator wallet with USDC so it can pay gas for
// `complete()` / `reject()` calls. Arc charges gas in USDC; ~$0.01 per tx.
//
// In production this is replaced by either (a) protocol-funded gas tank,
// (b) charging users a small overhead, or (c) Circle Paymaster.

const Input = z.object({ amount: z.string().regex(/^\d+(\.\d{1,6})?$/) });

export async function POST(req: Request): Promise<NextResponse> {
  const session = await currentSession();
  if (!session.walletId || !session.walletAddress) {
    return NextResponse.json({ error: "no wallet" }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed" }, { status: 400 });
  }

  const evaluator = await getEvaluatorWallet();
  try {
    const tx = await transferUsdc({
      fromWalletId: session.walletId,
      toAddress: evaluator.address,
      amount: parsed.data.amount,
      label: "fund evaluator gas",
    });
    return NextResponse.json({ ok: true, explorer: tx.explorer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
