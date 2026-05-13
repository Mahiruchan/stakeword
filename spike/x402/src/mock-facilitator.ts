/**
 * Mock x402 facilitator — implements just enough of the facilitator HTTP API
 * for `@x402/express` to think payments are valid.
 *
 * Real x402.org / Coinbase facilitators actually settle on-chain. This one
 * trusts every signed payload (or even unsigned, since we don't verify).
 *
 * Use ONLY for offline development. Real money never moves.
 *
 * Run: npm run mock-facilitator
 */
import express from "express";

const PORT = Number(process.env.MOCK_FACILITATOR_PORT ?? 5050);
const NETWORK = process.env.NETWORK ?? "eip155:84532";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/supported", (_req, res) => {
  res.json({
    kinds: [
      { x402Version: 2, scheme: "exact", network: NETWORK },
    ],
    extensions: [],
    signers: {},
  });
});

app.post("/verify", (req, res) => {
  const payer =
    (req.body?.paymentPayload?.payload?.authorization?.from as string | undefined) ??
    "0x000000000000000000000000000000000000beef";
  console.log(`[mock-facilitator] /verify  payer=${payer}`);
  res.json({ isValid: true, payer });
});

app.post("/settle", (req, res) => {
  const payer =
    (req.body?.paymentPayload?.payload?.authorization?.from as string | undefined) ??
    "0x000000000000000000000000000000000000beef";
  const transaction = "0x" + "ab".repeat(32);
  console.log(`[mock-facilitator] /settle  payer=${payer}  tx=${transaction}`);
  res.json({
    success: true,
    transaction,
    network: NETWORK,
    amount: "10000",
    payer,
  });
});

app.listen(PORT, () => {
  console.log(`Mock facilitator on http://localhost:${PORT}`);
  console.log(`  Network: ${NETWORK}`);
  console.log(`  Endpoints: GET /supported, POST /verify, POST /settle`);
  console.log(`  Point the coach server at it: FACILITATOR_URL=http://localhost:${PORT}`);
});
