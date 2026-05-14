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
  // Don't expose walletId to the client — it's a server-side identifier the
  // browser never needs to know. walletAddress is enough for display + faucet.
  return NextResponse.json({
    sessionId: session.id,
    walletAddress: session.walletAddress,
    usdcBalance: usdc,
    evaluatorAddress: evaluator.address,
  });
}
