import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { getEvaluatorWallet } from "@/lib/evaluator";
import { getUsdcBalanceForWallet } from "@/lib/circle/wallets";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const session = await currentSession();
  const evaluator = await getEvaluatorWallet();
  let usdc = "0";
  if (session.walletId) {
    try {
      usdc = await getUsdcBalanceForWallet(session.walletId);
    } catch {
      usdc = "0";
    }
  }
  return NextResponse.json({
    sessionId: session.id,
    walletAddress: session.walletAddress,
    walletId: session.walletId,
    usdcBalance: usdc,
    evaluatorAddress: evaluator.address,
  });
}
