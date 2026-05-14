# Spike 1 · ERC-8183 job lifecycle on Arc Testnet

Proves StakeWord can outsource its escrow + state machine to the **official
AgenticCommerce reference implementation** of ERC-8183 already deployed on Arc
Testnet at [`0x0747EEf0706327138c69792bF28Cd525089e4583`](https://testnet.arcscan.app/address/0x0747EEf0706327138c69792bF28Cd525089e4583).

Why this matters for StakeWord:

- We do not need to write or audit our own escrow contract — ERC-8183 already
  has `createJob → setBudget → approve+fund → submit(deliverableHash) → complete(reasonHash)`.
- Mapping:
  - `client` = user (the one staking USDC on themself)
  - `provider` = user themself (the one delivering proof)
  - `evaluator` = Claude oracle wallet (off-chain validator that calls `complete`)
- `description` carries the natural-language commitment text.
- `deliverable` (bytes32) is the keccak256 hash of the user's proof bundle (Strava screenshot, etc.).
- `reason` (bytes32) is the keccak256 hash of Claude's verification report.
- Both hashes leave a verifiable audit trail on Arc; the long-form proofs live in S3/Supabase.

## What this spike proves

| Phase | Script | Requires |
|---|---|---|
| Liveness probe — contracts deployed, RPC up | `npm run verify` | nothing (uses public RPC) |
| Read existing job by ID | `npm run read-job -- <id>` | nothing |
| Full create/fund/submit/complete lifecycle | `npm run full-lifecycle` | Circle API key + Entity Secret |

## Setup

```powershell
cd spike/erc8183
npm install
npm run typecheck           # passes without keys
npm run verify              # passes without keys
npm run read-job -- 0       # try a few IDs to find existing jobs
```

For the write flow:

```powershell
# 1. Sign up at https://console.circle.com (free for testnet)
# 2. Keys → Create a key → "API key → Standard Key"
# 3. Register Entity Secret: https://developers.circle.com/wallets/dev-controlled/register-entity-secret
# 4. Save to .env:
cp .env.example .env
notepad .env
# Then:
npm run full-lifecycle
```

The script will create two Arc testnet wallets, pause for you to fund the client
from `https://faucet.circle.com`, then walk all 6 lifecycle states to
`Completed`.

## Cost on testnet

Arc charges ~$0.01 per tx in USDC equivalent (USDC is the gas token). The full
lifecycle is 5 onchain txns plus a starter transfer → ~$0.06 USDC of gas plus 5
USDC moved through escrow.

## Files

```
src/
├── constants.ts        addresses, chain id, status enum
├── abi.ts              AgenticCommerce + ERC-20 ABIs
├── public-client.ts    viem PublicClient against Arc testnet
├── verify.ts           read-only liveness probe (no keys)
├── read-job.ts         read any existing jobId
└── full-lifecycle.ts   end-to-end write flow (needs Circle keys)
```

## .env.example

```
# arc-canteen status will print your personal RPC URL with token.
# Falls back to the public mainnet-style URL if unset (works for read-only).
ARC_RPC_URL=

# Required for full-lifecycle:
CIRCLE_API_KEY=
CIRCLE_ENTITY_SECRET=
```
