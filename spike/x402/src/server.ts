/**
 * x402 spike — server side.
 *
 * Returns 402 Payment Required on /coach with a $0.01 USDC price tag.
 * Wraps Express with the official @x402/express middleware and uses the public
 * x402.org facilitator on Base Sepolia. For Arc the swap is one network id.
 *
 * For StakeWord this becomes "pay per AI coach session" or "pay per validation".
 *
 * Run: npm run server
 */
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const NETWORK = (process.env.NETWORK ?? "eip155:84532") as `${string}:${string}`;
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://facilitator.x402.org";
const PAY_TO = process.env.PAY_TO ?? "0x0000000000000000000000000000000000000000";
const PORT = Number(process.env.PORT ?? 4040);

const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitator).register(
  NETWORK,
  new ExactEvmScheme(),
);

const app = express();
app.use(express.json());

// syncFacilitatorOnStart defaults to true and will fetch /supported from
// FACILITATOR_URL on startup. For offline dev, point FACILITATOR_URL at the
// mock facilitator (`npm run mock-facilitator`).
app.use(
  paymentMiddleware(
    {
      "POST /coach": {
        accepts: {
          scheme: "exact",
          price: "$0.01",
          network: NETWORK,
          payTo: PAY_TO,
        },
        description: "One StakeWord AI coach session (Claude proactive nudge or proof validation).",
      },
    },
    resourceServer,
  ),
);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, network: NETWORK, facilitator: FACILITATOR_URL });
});

app.post("/coach", (req, res) => {
  const goal = (req.body as { goal?: string })?.goal ?? "unspecified";
  res.json({
    coachMessage: `Locked in. Today's nudge for "${goal}": ship one tiny commit, log it, and you're 80% there.`,
    pricePaid: "$0.01 USDC",
    settled: true,
  });
});

app.listen(PORT, () => {
  console.log(`x402 coach server listening on http://localhost:${PORT}`);
  console.log(`  Network:      ${NETWORK}`);
  console.log(`  Facilitator:  ${FACILITATOR_URL}`);
  console.log(`  Pay to:       ${PAY_TO}`);
  console.log(`  Try:          curl http://localhost:${PORT}/healthz`);
  console.log(`  Paywalled:    POST http://localhost:${PORT}/coach  (returns 402 without payment)`);
});
