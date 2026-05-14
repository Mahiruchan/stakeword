import { setTimeout as delay } from "node:timers/promises";
import type { Address, Hex } from "viem";
import { circle } from "./client";
import { ARC_TESTNET_EXPLORER, USDC_ARC_TESTNET } from "../chain/constants";

export interface CreatedWallet {
  walletId: string;
  address: Address;
}

const MEDIUM_FEE = { type: "level", config: { feeLevel: "MEDIUM" } } as const;

/**
 * Create a single SCA wallet on Arc testnet inside a fresh wallet set.
 * Wallet sets are how Circle groups dev-controlled wallets — every user gets their own.
 */
export async function createUserWallet(label: string): Promise<CreatedWallet> {
  const setRes = await circle().createWalletSet({ name: label });
  const walletSetId = setRes.data?.walletSet?.id;
  if (!walletSetId) throw new Error("createWalletSet returned no id");

  const res = await circle().createWallets({
    blockchains: ["ARC-TESTNET"],
    count: 1,
    walletSetId,
    accountType: "SCA",
  });
  const w = res.data?.wallets?.[0];
  if (!w?.id || !w.address) throw new Error("createWallets returned no wallet");
  return { walletId: w.id, address: w.address as Address };
}

export async function getUsdcBalanceForWallet(walletId: string): Promise<string> {
  const res = await circle().getWalletTokenBalance({ id: walletId });
  const usdc = res.data?.tokenBalances?.find((b) => b.token?.symbol === "USDC");
  return usdc?.amount ?? "0";
}

async function waitForTx(txId: string, label: string): Promise<Hex> {
  for (let i = 0; i < 90; i++) {
    await delay(2000);
    const tx = await circle().getTransaction({ id: txId });
    const data = tx.data?.transaction;
    if (data?.state === "COMPLETE" && data.txHash) {
      return data.txHash as Hex;
    }
    if (data?.state === "FAILED") {
      throw new Error(`${label} failed onchain`);
    }
  }
  throw new Error(`${label} timed out after 180s`);
}

export interface TxResult {
  txHash: Hex;
  explorer: string;
}

function explorerLink(txHash: Hex): string {
  return `${ARC_TESTNET_EXPLORER}/tx/${txHash}`;
}

export async function executeContract(args: {
  walletId: string;
  contractAddress: string;
  abiFunctionSignature: string;
  abiParameters: ReadonlyArray<string>;
  label: string;
}): Promise<TxResult> {
  const res = await circle().createContractExecutionTransaction({
    walletId: args.walletId,
    contractAddress: args.contractAddress,
    abiFunctionSignature: args.abiFunctionSignature,
    abiParameters: [...args.abiParameters],
    fee: MEDIUM_FEE,
  });
  const id = res.data?.id;
  if (!id) throw new Error(`${args.label}: no tx id`);
  const txHash = await waitForTx(id, args.label);
  return { txHash, explorer: explorerLink(txHash) };
}

export async function transferUsdc(args: {
  fromWalletId: string;
  toAddress: Address;
  /** Human-readable USDC amount (e.g. "1.5"). */
  amount: string;
  label: string;
}): Promise<TxResult> {
  const res = await circle().createTransaction({
    walletId: args.fromWalletId,
    tokenAddress: USDC_ARC_TESTNET,
    destinationAddress: args.toAddress,
    amount: [args.amount],
    fee: MEDIUM_FEE,
  });
  const id = res.data?.id;
  if (!id) throw new Error(`${args.label}: no tx id`);
  const txHash = await waitForTx(id, args.label);
  return { txHash, explorer: explorerLink(txHash) };
}
