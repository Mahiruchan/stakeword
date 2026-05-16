import type { Address } from "viem";

export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_EXPLORER = "https://testnet.arcscan.app";

export const AGENTIC_COMMERCE_CONTRACT: Address =
  "0x0747EEf0706327138c69792bF28Cd525089e4583";

export const USDC_ARC_TESTNET: Address =
  "0x3600000000000000000000000000000000000000";

export const USDC_DECIMALS = 6;

export const JOB_STATUS = [
  "Open",
  "Funded",
  "Submitted",
  "Completed",
  "Rejected",
  "Expired",
] as const;

export type JobStatusName = (typeof JOB_STATUS)[number];
