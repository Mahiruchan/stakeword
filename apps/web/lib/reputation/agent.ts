import { decodeEventLog, keccak256, toHex, type Address, type Hex } from "viem";
import { publicClient } from "../chain/client";
import { executeContract } from "../circle/wallets";
import {
  IDENTITY_REGISTRY,
  REPUTATION_REGISTRY,
  FEEDBACK_TAG_PASS,
  FEEDBACK_TAG_FAIL,
} from "./constants";
import { identityRegistryAbi, reputationRegistryAbi } from "./abi";

const ZERO_BYTES32: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Build an inline data: URI carrying the ERC-8004 agent registration JSON.
 * Keeps everything on-chain (no off-chain hosting needed for the demo).
 */
function buildAgentURI(args: {
  sessionShortId: string;
  walletAddress: Address;
}): string {
  const payload = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: `StakeWord builder ${args.sessionShortId}`,
    description:
      "A StakeWord user committing USDC to their own goals via ERC-8183 self-contracts on Arc testnet.",
    active: true,
    supportedTrust: ["reputation"],
  };
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json, "utf-8").toString("base64");
  return `data:application/json;base64,${base64}`;
}

/**
 * Mints an ERC-8004 Identity NFT for the caller wallet and returns the agentId
 * (= ERC-721 tokenId) by decoding the Transfer event from the receipt.
 */
export async function registerAgent(args: {
  walletId: string;
  walletAddress: Address;
  sessionShortId: string;
}): Promise<{ agentId: bigint; explorer: string }> {
  const agentURI = buildAgentURI({
    sessionShortId: args.sessionShortId,
    walletAddress: args.walletAddress,
  });
  const tx = await executeContract({
    walletId: args.walletId,
    contractAddress: IDENTITY_REGISTRY,
    abiFunctionSignature: "register(string)",
    abiParameters: [agentURI],
    label: "ERC-8004 register",
  });
  const receipt = await publicClient().getTransactionReceipt({ hash: tx.txHash });
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== IDENTITY_REGISTRY.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: identityRegistryAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "Transfer") {
        const { from, tokenId } = decoded.args as {
          from: Address;
          to: Address;
          tokenId: bigint;
        };
        if (from === "0x0000000000000000000000000000000000000000") {
          return { agentId: tokenId, explorer: tx.explorer };
        }
      }
    } catch {
      continue;
    }
  }
  throw new Error("Could not decode mint Transfer event from IdentityRegistry tx logs.");
}

export interface FeedbackArgs {
  walletId: string;
  agentId: bigint;
  passed: boolean;
  /** Free-form reason text — its keccak256 is anchored on chain. */
  reasonText: string;
  /** Optional tier label, surfaces on getSummary tag2 — e.g. stake amount bucket. */
  tier?: string;
}

export async function giveFeedback(args: FeedbackArgs): Promise<{ explorer: string }> {
  const value: number = args.passed ? 100 : 0;
  const tag1 = args.passed ? FEEDBACK_TAG_PASS : FEEDBACK_TAG_FAIL;
  const tag2 = args.tier ?? "";
  const feedbackHash = args.reasonText
    ? keccak256(toHex(args.reasonText))
    : ZERO_BYTES32;
  const tx = await executeContract({
    walletId: args.walletId,
    contractAddress: REPUTATION_REGISTRY,
    abiFunctionSignature:
      "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)",
    abiParameters: [args.agentId.toString(), value.toString(), "0", tag1, tag2, "", "", feedbackHash],
    label: "ERC-8004 giveFeedback",
  });
  return { explorer: tx.explorer };
}

export interface AgentSummary {
  count: bigint;
  averageValue: bigint;
  lastIndex: bigint;
}

/** Aggregated reputation for an agent across all evaluators, restricted to one tag. */
export async function getReputationSummary(args: {
  agentId: bigint;
  clientAddress: Address;
  passed: boolean;
}): Promise<AgentSummary> {
  const tag1 = args.passed ? FEEDBACK_TAG_PASS : FEEDBACK_TAG_FAIL;
  const result = await publicClient().readContract({
    address: REPUTATION_REGISTRY,
    abi: reputationRegistryAbi,
    functionName: "getSummary",
    args: [args.agentId, [args.clientAddress], tag1, ""],
  });
  return {
    count: result.count,
    averageValue: result.averageValue,
    lastIndex: result.lastIndex,
  };
}
