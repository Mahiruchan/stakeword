/**
 * x402 spike — client side.
 *
 * Uses @x402/fetch to auto-handle the 402 dance: when the server says 402,
 * the client signs an EIP-3009 TransferWithAuthorization and retries.
 *
 * For the demo this hits the local server started by `npm run server`.
 * For Arc/StakeWord production, swap the privateKey for a Circle wallet signer.
 *
 * Run: npm run client
 */
import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

const NETWORK = (process.env.NETWORK ?? "eip155:84532") as `${string}:${string}`;
const PORT = Number(process.env.PORT ?? 4040);
const SERVER_URL = `http://localhost:${PORT}/coach`;

const pk = process.env.CLIENT_PRIVATE_KEY as Hex | undefined;
if (!pk || pk === "0x0000000000000000000000000000000000000000000000000000000000000001") {
  console.error("Set CLIENT_PRIVATE_KEY in .env to a faucet-funded test key first.");
  console.error("Public Base Sepolia faucets:");
  console.error("  https://faucet.circle.com  (USDC + ETH)");
  console.error("  https://www.alchemy.com/faucets/base-sepolia");
  process.exit(1);
}

const account = privateKeyToAccount(pk);

const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [
    {
      network: NETWORK,
      client: new ExactEvmScheme(account),
    },
  ],
});

async function main() {
  console.log(`Client address: ${account.address}`);
  console.log(`Hitting ${SERVER_URL}…\n`);

  const res = await fetchWithPayment(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal: "ship StakeWord MVP" }),
  });

  const paymentResponseHeader = res.headers.get("PAYMENT-RESPONSE");
  const body = await res.json();

  console.log(`Status: ${res.status}`);
  console.log("Body:", body);
  if (paymentResponseHeader) {
    console.log("\nPayment response header:", paymentResponseHeader);
    try {
      const decoded = decodePaymentResponseHeader(paymentResponseHeader);
      console.log("Decoded:", decoded);
    } catch {
      // ignore decode errors
    }
  }
}

main().catch((err) => {
  console.error("Client failed:", err);
  process.exit(1);
});
