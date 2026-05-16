# StakeWord

> Self-contract ERC-8183 protocol on Arc testnet. Stake USDC on your own goals; Claude evaluates and settles on-chain; failed stakes reward the people who actually finish.

A submission to the **Agora Agents Hackathon** (Canteen × Circle × Arc, 2026-05-11 → 2026-05-25).

## What it does

- **One-click onboarding.** Visit `/app` → middleware drops a session cookie → a Circle Dev-Controlled wallet is auto-provisioned on Arc testnet. No seed phrase, no MetaMask popup.
- **ERC-8183 commitments.** Each goal becomes a real on-chain job on Arc's `AgenticCommerce` contract (`0x0747…4583`). The user is both `client` and `provider`; a platform-controlled evaluator wallet plays the `evaluator` role.
- **Live 4-tx streaming UX.** `POST /api/commitments` streams NDJSON; the form renders a live progress timeline for `createJob → setBudget → approve → fund` with per-step explorer links.
- **Claude as on-chain evaluator.** Upload proof (text / URL / screenshot). Kimi-K2.6 (via Anthropic-format gateway) reads your criteria and returns `pass` / `fail` / `needs-more`. On `pass`, the evaluator wallet calls `complete(jobId, reasonHash)`. On `fail`, `reject(...)`.
- **ERC-8004 reputation.** The first time a user funds a commitment, the protocol mints them an ERC-8004 Identity NFT on Arc's `IdentityRegistry`. Every settled commitment fires a `giveFeedback(...)` on the `ReputationRegistry`, so the user's pass/fail history is verifiable on-chain forever.
- **x402-style metered coach.** Each accountability-coach chat message costs $0.01 USDC. One real USDC transfer per session funds a prepaid balance; messages decrement internally — equivalent to how Circle Gateway batches nanopayments.
- **Protocol-owned vault** (deploy-ready). `StakeWordVault.sol` books per-commitment stakes, optionally routes pooled USDC through USYC for yield (once Circle allowlists the vault address), and redistributes failed principal + yield to completers at season close.

## Tech stack

| Layer | Choice |
|---|---|
| Chain | **Arc testnet** (chainId 5042002) |
| Identity | **ERC-8004** IdentityRegistry + ReputationRegistry |
| Commitment | **ERC-8183** AgenticCommerce reference implementation |
| Settlement | **USDC** on Arc (`0x3600…0000`) |
| Wallets | **Circle Developer-Controlled Wallets** (SCA accounts) |
| AI | **Kimi-K2.6** via infini-ai (Anthropic-compatible API) — text + vision |
| Payments | x402 nanopayments (proven in `spike/x402/`, prepaid model in the app) |
| Vault | Custom `StakeWordVault.sol` (Foundry) with optional USYC routing |
| Web | Next.js 16 + Tailwind v4 + Drizzle + better-sqlite3 |

## Repository layout

```
apps/web/                  Next.js app (frontend + API routes + middleware)
├── app/                   App router pages
│   ├── page.tsx           landing
│   ├── app/               signed-in surface (dashboard / new / detail)
│   └── api/               commitments, proof, coach, fund-evaluator, reputation, me
├── components/            React components
├── lib/                   env, db, chain, circle, llm, reputation, actions
└── middleware.ts          session cookie bootstrap

contracts/                 Foundry project
└── src/StakeWordVault.sol Protocol vault (Solidity)

docs/                      PLAN, RESEARCH, ERC-8004 spec
spike/                     Independent proofs of concept
├── erc8183/               on-chain lifecycle (read-only verified)
├── x402/                  HTTP 402 dance with mock facilitator
├── circle-wallets/        Wallet creation pattern
├── usyc-research/         USYC feasibility + vault design
└── circle-bootstrap/      Entity Secret generator + smoke tests
```

## Running it locally

```sh
# 1) Get credentials
#    Circle:  https://console.circle.com → API key + register Entity Secret
#             (use spike/circle-bootstrap for the Entity Secret if needed)
#    Kimi:    https://cloud.infini-ai.com → API key
#    Arc RPC: `arc-canteen rpc-url` (see https://github.com/the-canteen-dev/ARC-cli)

# 2) Configure
cp apps/web/.env.example apps/web/.env
# fill: CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, ARC_RPC_URL, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL

# 3) Install + push schema
npm install
npm run db:push --workspace=web

# 4) Run
npm run dev --workspace=web
# open http://localhost:3000
```

Then:

1. Open `/app` — your wallet is auto-created. Copy the address.
2. Paste it into [Circle's faucet](https://faucet.circle.com) to grab testnet USDC.
3. Click **Create commitment**, fill the form, watch the 4-tx progress timeline.
4. On the commitment page, submit proof — Claude evaluates, then the evaluator wallet settles on-chain. Your ERC-8004 reputation updates automatically.
5. Chat with the coach (top up the prepaid x402 balance once).

## Contracts deployed / used

| Contract | Address (Arc testnet) | Purpose |
|---|---|---|
| AgenticCommerce (ERC-8183) | [`0x0747…4583`](https://testnet.arcscan.app/address/0x0747EEf0706327138c69792bF28Cd525089e4583) | job lifecycle |
| IdentityRegistry (ERC-8004) | [`0x8004A818…D9e`](https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) | agent NFT mint |
| ReputationRegistry (ERC-8004) | [`0x8004B663…713`](https://testnet.arcscan.app/address/0x8004B663056A597Dffe9eCcC1965A193B7388713) | feedback events |
| USDC | [`0x3600…0000`](https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000) | settlement |
| USYC | [`0xe9185F0c…b86C`](https://testnet.arcscan.app/address/0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C) | yield (vault path, allowlist required) |
| StakeWordVault | _not yet deployed — `contracts/script/Deploy.s.sol`_ | redistribution |

## Documentation

Start here: [`docs/README.md`](./docs/README.md) — index of every doc with one-line descriptions.

Highlights:

- [`docs/JUDGES.md`](./docs/JUDGES.md) — rubric mapping. For each weighted dimension, exactly where in the code or UI to verify the claim.
- [`docs/PLAN.md`](./docs/PLAN.md) — current development plan (v2)
- [`docs/RESEARCH.md`](./docs/RESEARCH.md) — competitive landscape + USYC feasibility + spike evidence
- [`docs/PITCH.md`](./docs/PITCH.md) — 5-section pitch video script with a demo cue sheet
- [`DESIGN.md`](./DESIGN.md) — full design system (tokens, components, page patterns)
- [`design-preview.html`](./design-preview.html) — static visual mockup
- [`apps/web/README.md`](./apps/web/README.md) — Next.js app structure + route map
- [`contracts/README.md`](./contracts/README.md) — Foundry project + StakeWordVault deploy
- [`spike/README.md`](./spike/README.md) — standalone proofs-of-concept
