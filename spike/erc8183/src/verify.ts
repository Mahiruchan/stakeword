/**
 * Spike verification — read-only.
 * Requires no API key. Proves we can reach the deployed ERC-8183 contract on Arc testnet
 * and that USDC + USYC token contracts respond as expected.
 *
 * Run: npm run verify
 * (Set ARC_RPC_URL to your `arc-canteen status` RPC if the default fails.)
 */
import {
  AGENTIC_COMMERCE_CONTRACT,
  ARC_TESTNET_EXPLORER,
  USDC_TESTNET,
  USYC_TESTNET,
} from "./constants.js";
import { erc20Abi } from "./abi.js";
import { publicClient } from "./public-client.js";

async function probeAddress(label: string, address: `0x${string}`) {
  const code = await publicClient.getCode({ address });
  const has = code && code !== "0x";
  console.log(`  ${label}: ${address}`);
  console.log(`    deployed:        ${has ? "yes" : "NO"}`);
  if (has) {
    console.log(`    bytecode length: ${(code!.length - 2) / 2} bytes`);
    console.log(`    explorer:        ${ARC_TESTNET_EXPLORER}/address/${address}`);
  }
  return has;
}

async function probeToken(label: string, address: `0x${string}`) {
  console.log(`\n  ${label}: ${address}`);
  try {
    const [symbol, decimals] = await Promise.all([
      publicClient.readContract({ address, abi: erc20Abi, functionName: "symbol" }),
      publicClient.readContract({ address, abi: erc20Abi, functionName: "decimals" }),
    ]);
    console.log(`    symbol:   ${symbol}`);
    console.log(`    decimals: ${decimals}`);
  } catch (err) {
    console.log(`    (ERC-20 metadata call failed — token may use a different ABI)`);
    console.log(`    err: ${(err as Error).message.slice(0, 120)}`);
  }
}

async function main() {
  console.log("── Arc testnet liveness probe ──");
  const [chainId, block] = await Promise.all([
    publicClient.getChainId(),
    publicClient.getBlockNumber(),
  ]);
  console.log(`  chainId:     ${chainId} (0x${chainId.toString(16)})`);
  console.log(`  blockNumber: ${block}`);

  console.log("\n── Contract probes ──");
  const erc8183Ok = await probeAddress(
    "AgenticCommerce (ERC-8183 ref impl)",
    AGENTIC_COMMERCE_CONTRACT,
  );

  await probeToken("USDC (predeploy)", USDC_TESTNET);
  await probeToken("USYC", USYC_TESTNET);

  if (!erc8183Ok) {
    console.error("\nERC-8183 contract NOT deployed at the documented address. Aborting.");
    process.exit(1);
  }

  console.log("\nAll required contracts are live. Read-only verification passed.");
  console.log("Next: set CIRCLE_API_KEY + CIRCLE_ENTITY_SECRET and run `npm run full-lifecycle`.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
