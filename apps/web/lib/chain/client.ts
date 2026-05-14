import {
  createPublicClient,
  decodeEventLog,
  defineChain,
  formatUnits,
  http,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { env } from "../env";
import {
  AGENTIC_COMMERCE_CONTRACT,
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_EXPLORER,
  JOB_STATUS,
  USDC_ARC_TESTNET,
  USDC_DECIMALS,
  type JobStatusName,
} from "./constants";
import { agenticCommerceAbi, erc20Abi } from "./abi";

let cachedClient: PublicClient | undefined;

export function publicClient(): PublicClient {
  if (cachedClient) return cachedClient;
  const url = env().ARC_RPC_URL;
  const arc = defineChain({
    id: ARC_TESTNET_CHAIN_ID,
    name: "Arc Testnet",
    network: "arc-testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: USDC_DECIMALS },
    rpcUrls: {
      default: { http: [url] },
      public: { http: [url] },
    },
    blockExplorers: { default: { name: "Arcscan", url: ARC_TESTNET_EXPLORER } },
    testnet: true,
  });
  cachedClient = createPublicClient({ chain: arc, transport: http(url) });
  return cachedClient;
}

export interface ChainJob {
  id: bigint;
  client: Address;
  provider: Address;
  evaluator: Address;
  description: string;
  budget: bigint;
  expiredAt: bigint;
  status: JobStatusName;
  hook: Address;
}

export async function getJob(jobId: bigint): Promise<ChainJob> {
  const raw = await publicClient().readContract({
    address: AGENTIC_COMMERCE_CONTRACT,
    abi: agenticCommerceAbi,
    functionName: "getJob",
    args: [jobId],
  });
  return {
    id: raw.id,
    client: raw.client,
    provider: raw.provider,
    evaluator: raw.evaluator,
    description: raw.description,
    budget: raw.budget,
    expiredAt: raw.expiredAt,
    status: JOB_STATUS[Number(raw.status)],
    hook: raw.hook,
  };
}

export async function getUsdcBalance(address: Address): Promise<bigint> {
  return publicClient().readContract({
    address: USDC_ARC_TESTNET,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
}

export function formatUsdc(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS);
}

export async function extractJobIdFromTx(txHash: Hex): Promise<bigint> {
  const receipt = await publicClient().getTransactionReceipt({ hash: txHash });
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
  throw new Error("JobCreated event not found in transaction logs.");
}
