import { keccak256, parseUnits, toHex, type Address } from "viem";
import {
  AGENTIC_COMMERCE_CONTRACT,
  USDC_ARC_TESTNET,
} from "./chain/constants";
import { extractJobIdFromTx } from "./chain/client";
import { executeContract } from "./circle/wallets";

const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

export interface CreateJobArgs {
  clientWalletId: string;
  clientAddress: Address;
  providerAddress: Address;
  evaluatorAddress: Address;
  expiredAtUnix: number;
  description: string;
}

export async function onChainCreateJob(args: CreateJobArgs): Promise<{
  jobId: bigint;
  txHash: string;
  explorer: string;
}> {
  const tx = await executeContract({
    walletId: args.clientWalletId,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "createJob(address,address,uint256,string,address)",
    abiParameters: [
      args.providerAddress,
      args.evaluatorAddress,
      args.expiredAtUnix.toString(),
      args.description,
      ZERO_ADDRESS,
    ],
    label: "createJob",
  });
  const jobId = await extractJobIdFromTx(tx.txHash);
  return { jobId, txHash: tx.txHash, explorer: tx.explorer };
}

export async function onChainSetBudget(args: {
  providerWalletId: string;
  jobId: bigint;
  amountUsdcBaseUnits: bigint;
}): Promise<{ txHash: string; explorer: string }> {
  return executeContract({
    walletId: args.providerWalletId,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "setBudget(uint256,uint256,bytes)",
    abiParameters: [args.jobId.toString(), args.amountUsdcBaseUnits.toString(), "0x"],
    label: "setBudget",
  });
}

export async function onChainApproveUsdc(args: {
  clientWalletId: string;
  amountUsdcBaseUnits: bigint;
}): Promise<{ txHash: string; explorer: string }> {
  return executeContract({
    walletId: args.clientWalletId,
    contractAddress: USDC_ARC_TESTNET,
    abiFunctionSignature: "approve(address,uint256)",
    abiParameters: [AGENTIC_COMMERCE_CONTRACT, args.amountUsdcBaseUnits.toString()],
    label: "approve USDC",
  });
}

export async function onChainFund(args: {
  clientWalletId: string;
  jobId: bigint;
}): Promise<{ txHash: string; explorer: string }> {
  return executeContract({
    walletId: args.clientWalletId,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "fund(uint256,bytes)",
    abiParameters: [args.jobId.toString(), "0x"],
    label: "fund",
  });
}

export async function onChainSubmit(args: {
  providerWalletId: string;
  jobId: bigint;
  deliverableText: string;
}): Promise<{ txHash: string; explorer: string; deliverableHash: `0x${string}` }> {
  const deliverableHash = keccak256(toHex(args.deliverableText));
  const tx = await executeContract({
    walletId: args.providerWalletId,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "submit(uint256,bytes32,bytes)",
    abiParameters: [args.jobId.toString(), deliverableHash, "0x"],
    label: "submit",
  });
  return { ...tx, deliverableHash };
}

export async function onChainComplete(args: {
  evaluatorWalletId: string;
  jobId: bigint;
  reasonText: string;
}): Promise<{ txHash: string; explorer: string; reasonHash: `0x${string}` }> {
  const reasonHash = keccak256(toHex(args.reasonText));
  const tx = await executeContract({
    walletId: args.evaluatorWalletId,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "complete(uint256,bytes32,bytes)",
    abiParameters: [args.jobId.toString(), reasonHash, "0x"],
    label: "complete",
  });
  return { ...tx, reasonHash };
}

export async function onChainReject(args: {
  evaluatorWalletId: string;
  jobId: bigint;
  reasonText: string;
}): Promise<{ txHash: string; explorer: string; reasonHash: `0x${string}` }> {
  const reasonHash = keccak256(toHex(args.reasonText));
  const tx = await executeContract({
    walletId: args.evaluatorWalletId,
    contractAddress: AGENTIC_COMMERCE_CONTRACT,
    abiFunctionSignature: "reject(uint256,bytes32,bytes)",
    abiParameters: [args.jobId.toString(), reasonHash, "0x"],
    label: "reject",
  });
  return { ...tx, reasonHash };
}

export function usdcAmountToBaseUnits(human: string): bigint {
  return parseUnits(human, 6);
}
