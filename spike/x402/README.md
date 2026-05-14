# Spike 2 · x402 paywalled AI coach endpoint

Proves that StakeWord can charge per-call USDC for AI coach sessions using the
**x402 protocol** with official Coinbase/x402-foundation packages
(`@x402/express`, `@x402/fetch`).

Why this matters for StakeWord:

- The PLAN's "AI coach proactively pushes / validates" feature becomes a
  metered service — every nudge / validation costs $0.01 USDC paid by the user
  out of their Gateway balance.
- Each paywalled call generates **real transaction data** that goes straight
  into the hackathon Traction scorecard (30% of judging).
- The "Most Circle tools wired up" superlative @jacks0n won explicitly mentions
  x402 Nanopayments — this puts StakeWord into that conversation.

## What this spike proves

| Phase | Script | Requires |
|---|---|---|
| Types compile against `@x402/express` + `@x402/fetch` | `npm run typecheck` | nothing |
| Server boots, route table registered, healthz returns 200 | `npm run server` then `curl http://localhost:4040/healthz` | mock facilitator running |
| Server returns 402 with correct PAYMENT-REQUIRED header | `curl -i -X POST http://localhost:4040/coach` | mock facilitator running |
| End-to-end client signs + retries | `npm run client` in another terminal | mock + a private key for signing |

**Verified locally**: with the mock facilitator,
`POST /coach` returns `402` + a valid x402 v2 `Payment-Required` header
(base64 of `{x402Version:2, accepts:[{scheme:"exact",network:"eip155:84532",amount:"10000",asset:"0x036CbD…7e USDC", payTo, maxTimeoutSeconds:300}]}`).
The full HTTP dance is proven; settlement requires a real facilitator.

### Three facilitator options

The middleware needs a facilitator URL on startup to know which schemes are
valid. Pick one of:

| Option | URL | Used for |
|---|---|---|
| **Local mock** (default in `.env.example`) | `http://localhost:5050` | Offline dev / blocked networks. Trusts every payload, no real chain settlement. |
| **Public foundation** | `https://facilitator.x402.org` | Real Base Sepolia settlement. **Note**: TLS handshake can fail from some networks (corporate proxies, mainland China). Try a VPN or cloud host. |
| **Circle Gateway** | TBA | Track https://developers.circle.com/gateway/nanopayments — once Circle publishes the Arc-supporting facilitator URL, swap `FACILITATOR_URL` and `NETWORK=eip155:5042002` to settle on Arc. |

## Demo setup (offline, mock facilitator)

This is the fastest path to seeing 402 negotiation working. No external network
needed, no faucet keys.

```powershell
cd spike/x402
npm install
cp .env.example .env

# Terminal 1
npm run mock-facilitator

# Terminal 2
npm run server

# Terminal 3 — verify a 402 response
curl -i -X POST http://localhost:4040/coach -H "Content-Type: application/json" -d "{}"
```

You should see status `402` with a `Payment-Required` header.

## Demo setup (real Base Sepolia settlement)

```powershell
cp .env.example .env
notepad .env
#   FACILITATOR_URL=https://facilitator.x402.org   (requires network reachability)
#   PAY_TO=<an address you can read>
#   CLIENT_PRIVATE_KEY=<a Base Sepolia faucet key with USDC + ETH>

npm run server          # Terminal 1
npm run client          # Terminal 2 — signs + retries, real settlement
```

Faucets that drop USDC + ETH on Base Sepolia:
- https://faucet.circle.com
- https://www.alchemy.com/faucets/base-sepolia

## Migrating to Arc testnet

Three changes:

1. `NETWORK=eip155:5042002` (Arc testnet chain id, hex `0x4cef52`)
2. `FACILITATOR_URL=<Circle Gateway facilitator URL>` — Circle has not published
   one as of writing; the docs reference `developers.circle.com/gateway/nanopayments/...`
   but the actual facilitator endpoint will be announced. Track:
   https://developers.circle.com/gateway/nanopayments
3. Client side: replace `privateKeyToAccount` with a Circle Dev-Controlled
   Wallet signer (see `spike/circle-wallets/`).

The HTTP dance and the middleware code stay identical.

## Files

```
src/
├── server.ts             Express + @x402/express middleware on POST /coach
├── client.ts             @x402/fetch wrapper that signs + retries on 402
└── mock-facilitator.ts   Local /supported, /verify, /settle that trusts every payload
```

## What the dance looks like (cap from the spec)

```
POST /coach
  ↓
402 Payment Required
  PAYMENT-REQUIRED: {"scheme":"exact","price":"$0.01","network":"eip155:84532",...}
  ↓
client signs EIP-3009 TransferWithAuthorization
  ↓
POST /coach
  PAYMENT-SIGNATURE: <base64 signed payload>
  ↓
server verifies via facilitator
  ↓
200 OK
  PAYMENT-RESPONSE: <settlement confirmation>
  body: { coachMessage: "…", pricePaid: "$0.01 USDC", settled: true }
```
