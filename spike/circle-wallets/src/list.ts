/**
 * List wallets in WALLET_SET_ID with USDC balances.
 */
import { circle } from "./client.js";

async function main() {
  const walletSetId = process.env.WALLET_SET_ID;
  if (!walletSetId) {
    console.error("Set WALLET_SET_ID in .env after `wallets:create`.");
    process.exit(1);
  }

  const walletsRes = await circle.listWallets({ walletSetId });
  const wallets = walletsRes.data?.wallets ?? [];
  console.log(`Wallets in set ${walletSetId}: ${wallets.length}`);
  for (const w of wallets) {
    if (!w.id) continue;
    const balRes = await circle.getWalletTokenBalance({ id: w.id });
    const usdc = balRes.data?.tokenBalances?.find((b) => b.token?.symbol === "USDC");
    console.log(`  ${w.address}  id=${w.id}  USDC=${usdc?.amount ?? "0"}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
