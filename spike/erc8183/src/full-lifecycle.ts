/**
 * Full ERC-8183 job lifecycle on Arc Testnet using Circle Developer-Controlled Wallets.
 *
 * REQUIRES:
 *   CIRCLE_API_KEY        — from https://console.circle.com (Keys → Standard Key)
 *   CIRCLE_ENTITY_SECRET  — registered via https://developers.circle.com/wallets/dev-controlled/register-entity-secret
 *
 * Adapted from the official Arc docs tutorial, updated for SDK v10 (uses walletId, not walletAddress).
 * The flow models StakeWord's core:
 *   - clientWallet  = user (commits & pays)
 *   - providerWallet = user themself (delivers proof)
 *   - evaluator     = clientWallet here, but in StakeWord this becomes the Claude oracle address
 *
 * Run: npm run full-lifecycle
 */
import { createInterface } from "node:readline/promises";
import { setTimeout as delay } from "node:timers/promises";
import { stdin as input, stdout as output } from "node:process";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import {
  decodeEventLog,
  formatUnits,
  keccak256,
  parseUnits,
  toHex,
  type Hex,
} from "viem";

import {
  AGENTIC_COMMERCE_CONTRACT,
  ARC_TESTNET_EXPLORER,
  STATUS_NAMES,
  USDC_TESTNET,
} from "./constants.js";
import { agenticCommerceAbi } from "./abi.js";
import { publicClient } from "./public-client.js";

const PROVIDER_STARTER_BALANCE = "1";
const JOB_BUDGET = parseUnits("5", 6);

const apiKey = process.env.CIRCLE_API_KEY;
const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
if (!apiKey || !entitySecret) {
  console.error("Set CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET in .env before running.");
  process.exit(1);
}

const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey,
  entitySecret,
});

const MEDIUM_FEE = { type: "level", config: { feeLevel: "MEDIUM" } } as const;

async function waitForTransaction(txId: string, label: string): Promise<Hex> {
  process.stdout.write(`  Waiting for ${label}`);
  for (let i = 0; i < 60; i++) {
    await delay(2000);
    const tx = await circleClient.getTransaction({ id: txId });
    const data = tx.data?.transaction;
    if (data?.state === "COMPLETE" && data.txHash) {
      console.log(` ✓\n  Tx: ${ARC_TESTNET_EXPLORER}/tx/${data.txHash}`);
      return data.txHash as Hex;
    }
    if (data?.state === "FAILED") throw new Error(`${label} failed onchain`);
    process.stdout.write(".");
  }
  throw new Error(`${label} timed out after 120s`);
}

async function extractJobId(txHash: Hex): Promise<bigint> {
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: agenticCommerceAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "JobCreated") {
        return (decoded.args as { jobId: bigint }).jobId;
      }
    } catch {
      continue;
    }
  }
  throw new Error("Could not parse JobCreated event from tx logs.");
}

async function main() {
  console.log("── Step 1: Create wallets ──");
  const walletSet = await circleClient.createWalletSet({
    name: "StakeWord spike — ERC-8183",
  });
  const walletsResponse = await circleClient.createWallets({
    blockchains: ["ARC-TESTNET"],
    count: 2,
    walletSetId: walletSet.data?.walletSet?.id ?? "",
    accountType: "SCA",
  });
  const clientWallet = walletsResponse.data?.wallets?.[0]!;
  const providerWallet = walletsResponse.data?.wallets?.[1]!;
  console.log(`  Client:   ${clientWallet.address} (${clientWallet.id})`);
  console.log(`  Provider: ${providerWallet.address} (${providerWallet.id})`);

  console.log("\n── Step 2: Fund the client wallet ──");
  console.log(`  Fund this address with Arc testnet USDC:\n  ${clientWallet.address}`);
  console.log("  Public faucet:  https://faucet.circle.com");
  console.log("  Console faucet: https://console.circle.com/faucet");
  const rl = createInterface({ input, output });
  await rl.question("\nPress Enter once funded… ");
  rl.close();

  console.log("\n── Step 3: Bootstrap provider wallet ──");
  const transferTx = await circleClient.createTransaction({
    walletId: clientWallet.id!,
    tokenAddress: USDC_TESTNET,
    destinationAddress: providerWallet.address!,
    amount: [PROVIDER_STARTER_BALANCE],
    fee: MEDIUM_FEE,
  });
  await waitForTransaction(transferTx.data?.id!, "starter USDC transfer");

  console.log("\n── Step 4: createJob ──");
  const now = await publicClient.getBlock();
  const expiredAt = now.timestamp + 3600n;
  const createJobTx = await circleClient.createContractExecutionTransaction({
    walletId: clientWallet.id!,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "createJob(address,address,uint256,string,address)",
    abiParameters: [
      providerWallet.address!,
      clientWallet.address!,
      expiredAt.toString(),
      "StakeWord spike — self-contracted commitment",
      "0x0000000000000000000000000000000000000000",
    ],
    fee: MEDIUM_FEE,
  });
  const createTxHash = await waitForTransaction(createJobTx.data?.id!, "createJob");
  const jobId = await extractJobId(createTxHash);
  console.log(`  Job ID: ${jobId}`);

  console.log("\n── Step 5: setBudget (provider) ──");
  const setBudgetTx = await circleClient.createContractExecutionTransaction({
    walletId: providerWallet.id!,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "setBudget(uint256,uint256,bytes)",
    abiParameters: [jobId.toString(), JOB_BUDGET.toString(), "0x"],
    fee: MEDIUM_FEE,
  });
  await waitForTransaction(setBudgetTx.data?.id!, "setBudget");

  console.log("\n── Step 6: approve USDC + fund escrow ──");
  const approveTx = await circleClient.createContractExecutionTransaction({
    walletId: clientWallet.id!,
    contractAddress: USDC_TESTNET,
    abiFunctionSignature: "approve(address,uint256)",
    abiParameters: [AGENTIC_COMMERCE_CONTRACT, JOB_BUDGET.toString()],
    fee: MEDIUM_FEE,
  });
  await waitForTransaction(approveTx.data?.id!, "approve");

  const fundTx = await circleClient.createContractExecutionTransaction({
    walletId: clientWallet.id!,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "fund(uint256,bytes)",
    abiParameters: [jobId.toString(), "0x"],
    fee: MEDIUM_FEE,
  });
  await waitForTransaction(fundTx.data?.id!, "fund");

  console.log("\n── Step 7: submit deliverable (provider) ──");
  const deliverableHash = keccak256(toHex("stakeword-spike-deliverable"));
  const submitTx = await circleClient.createContractExecutionTransaction({
    walletId: providerWallet.id!,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "submit(uint256,bytes32,bytes)",
    abiParameters: [jobId.toString(), deliverableHash, "0x"],
    fee: MEDIUM_FEE,
  });
  await waitForTransaction(submitTx.data?.id!, "submit");

  console.log("\n── Step 8: complete (evaluator) ──");
  const reasonHash = keccak256(toHex("deliverable-approved-by-claude"));
  const completeTx = await circleClient.createContractExecutionTransaction({
    walletId: clientWallet.id!,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "complete(uint256,bytes32,bytes)",
    abiParameters: [jobId.toString(), reasonHash, "0x"],
    fee: MEDIUM_FEE,
  });
  await waitForTransaction(completeTx.data?.id!, "complete");

  console.log("\n── Step 9: read final job state ──");
  const job = await publicClient.readContract({
    address: AGENTIC_COMMERCE_CONTRACT,
    abi: agenticCommerceAbi,
    functionName: "getJob",
    args: [jobId],
  });
  console.log(`  Job ID:    ${jobId}`);
  console.log(`  Status:    ${STATUS_NAMES[Number(job.status)]}`);
  console.log(`  Budget:    ${formatUnits(job.budget, 6)} USDC`);
  console.log(`  Hook:      ${job.hook}`);
  console.log(`  Deliverable hash: ${deliverableHash}`);
  console.log(`  Reason hash:      ${reasonHash}`);

  console.log("\nDone. The full lifecycle is settled onchain.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
