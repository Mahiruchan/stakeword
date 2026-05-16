import { eq } from "drizzle-orm";
import type { Address } from "viem";
import { getDb } from "./db/client";
import { systemState } from "./db/schema";
import { createUserWallet } from "./circle/wallets";
import { env } from "./env";

const EVALUATOR_KEY = "evaluator_wallet";

interface EvaluatorWallet {
  walletId: string;
  address: Address;
}

/**
 * The platform-owned wallet that plays the ERC-8183 `evaluator` role across all
 * commitments. Boots once and persists; subsequent calls are read-only.
 *
 * Env overrides (EVALUATOR_WALLET_ID + EVALUATOR_WALLET_ADDRESS) win if set.
 */
export async function getEvaluatorWallet(): Promise<EvaluatorWallet> {
  const e = env();
  if (e.EVALUATOR_WALLET_ID && e.EVALUATOR_WALLET_ADDRESS) {
    return {
      walletId: e.EVALUATOR_WALLET_ID,
      address: e.EVALUATOR_WALLET_ADDRESS as Address,
    };
  }

  const db = getDb();
  const row = db
    .select()
    .from(systemState)
    .where(eq(systemState.key, EVALUATOR_KEY))
    .get();
  if (row) {
    const parsed = JSON.parse(row.value) as EvaluatorWallet;
    return parsed;
  }

  const fresh = await createUserWallet("StakeWord evaluator (Claude oracle)");
  const value: EvaluatorWallet = { walletId: fresh.walletId, address: fresh.address };
  db.insert(systemState).values({ key: EVALUATOR_KEY, value: JSON.stringify(value) }).run();
  return value;
}
