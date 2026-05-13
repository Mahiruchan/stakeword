/**
 * Create a wallet set (if not provided) + 2 SCA wallets on Arc testnet,
 * print addresses + IDs. Use one as the user-side wallet, one as the Claude
 * evaluator wallet in StakeWord.
 */
import { circle } from "./client.js";

async function main() {
  let walletSetId = process.env.WALLET_SET_ID;

  if (!walletSetId) {
    console.log("Creating new wallet set…");
    const setRes = await circle.createWalletSet({
      name: `StakeWord set ${new Date().toISOString().slice(0, 16)}`,
    });
    walletSetId = setRes.data?.walletSet?.id;
    console.log(`  walletSetId: ${walletSetId}`);
  } else {
    console.log(`Reusing wallet set: ${walletSetId}`);
  }

  if (!walletSetId) throw new Error("Failed to obtain walletSetId.");

  console.log("Creating 2 SCA wallets on ARC-TESTNET…");
  const walletsRes = await circle.createWallets({
    blockchains: ["ARC-TESTNET"],
    count: 2,
    walletSetId,
    accountType: "SCA",
  });

  const wallets = walletsRes.data?.wallets ?? [];
  for (const w of wallets) {
    console.log(`  ${w.address}  (id=${w.id})`);
  }

  console.log("\nDone. Persist these IDs in your app DB (Supabase / Postgres):");
  console.log(JSON.stringify({ walletSetId, walletIds: wallets.map((w) => w.id) }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
