import type { Address } from "viem";

export const ARC_TESTNET_RPC = "https://rpc.testnet.arc-node.thecanteenapp.com/v1/SWRM_TOKEN_HERE";
export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_EXPLORER = "https://testnet.arcscan.app";

export const AGENTIC_COMMERCE_CONTRACT: Address =
  "0x0747EEf0706327138c69792bF28Cd525089e4583";

export const USDC_TESTNET: Address =
  "0x3600000000000000000000000000000000000000";

export const USYC_TESTNET: Address =
  "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C";

export const USYC_TELLER: Address =
  "0x9fdF14c5B14173D74C08Af27AebFf39240dC105A";

export const USYC_ENTITLEMENTS: Address =
  "0xcc205224862c7641930c87679e98999d23c26113";

export const STATUS_NAMES = [
  "Open",
  "Funded",
  "Submitted",
  "Completed",
  "Rejected",
  "Expired",
] as const;

export type JobStatus = (typeof STATUS_NAMES)[number];
