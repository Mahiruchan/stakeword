# apps/web

Next.js 16 app — the StakeWord product surface plus its backend.

## Route map

### Public

| Route | What |
|---|---|
| `/` | Landing page, hero + design preview |
| `/leaderboard` | Aggregate view of every commitment in the protocol |
| `/u/[address]` | Public on-chain profile for any wallet (validates `^0x[a-f0-9]{40}$`) |

### Signed-in surface (anyone with the cookie middleware sets)

| Route | What |
|---|---|
| `/app` | Dashboard. Wallet snapshot, USDC balance, evaluator gas top-up, ReputationBadge, FirstRunChecklist or commitments list |
| `/app/new` | Create a commitment. Streams a 5-step on-chain progress timeline |
| `/app/c/[id]` | Commitment detail. Submit proof, chat with the metered coach, retry settle if stuck, share when completed |

### API routes (all `runtime: "nodejs"`)

| Route | Method | What |
|---|---|---|
| `/api/me` | GET | Session info — wallet address + USDC balance + evaluator address |
| `/api/commitments` | POST | Create commitment + drive 4-tx setup on Arc + ERC-8004 register (NDJSON stream) |
| `/api/commitments` | GET | Caller's commitments |
| `/api/commitments/[id]/proof` | POST | Run Claude verify, then submit + settle on-chain, then ERC-8004 feedback |
| `/api/commitments/[id]/retry-settle` | POST | Re-run settlement when commitment is stuck in `submitted` |
| `/api/coach` | GET | Coach balance + message history for a commitment |
| `/api/coach` | POST | Atomically debit \$0.01 USDC (prepaid), call Kimi, persist turn |
| `/api/coach/topup` | POST | Real USDC transfer user → evaluator, credits prepaid balance |
| `/api/fund-evaluator` | POST | One-shot top-up for evaluator gas |
| `/api/reputation` | GET | Aggregated ERC-8004 pass/fail counts for the current session |
| `/api/leaderboard` | GET | Public aggregate JSON of all commitments |

## Library layout

```
lib/
├── env.ts                      zod-validated env access
├── session.ts                  cookie → DB row → lazy Circle wallet
├── evaluator.ts                shared platform oracle wallet bootstrap
├── actions.ts                  typed ERC-8183 onchain helpers
├── db/
│   ├── schema.ts               Drizzle schema (sessions / commitments / proofs / coach / system)
│   └── client.ts               better-sqlite3 + drizzle factory
├── chain/
│   ├── constants.ts            chain id, contract addresses, decimals
│   ├── abi.ts                  AgenticCommerce + ERC-20 ABIs
│   └── client.ts               viem PublicClient + getJob + getUsdcBalance + extractJobIdFromTx
├── circle/
│   ├── client.ts               Circle SDK singleton
│   └── wallets.ts              createUserWallet, executeContract, transferUsdc
├── llm/
│   ├── client.ts               Anthropic SDK pointed at infini-ai's Kimi endpoint
│   ├── coach.ts                refineCommitment (criteria sharpener)
│   ├── chat.ts                 coachChat (metered)
│   └── verify.ts               verifyTextEvidence + verifyImageEvidence
└── reputation/
    ├── constants.ts            ERC-8004 registry addresses
    ├── abi.ts                  IdentityRegistry + ReputationRegistry ABIs
    └── agent.ts                registerAgent, giveFeedback, getReputationSummary
```

## Why the cookie middleware

Next.js Server Components can read but not write cookies. Session creation needs a cookie *before* the Server Component runs, otherwise `currentSession()` would have to call `cookies().set(...)` which throws inside an RSC. The fix lives in [`middleware.ts`](./middleware.ts): if `sw_sid` is missing, it sets the cookie on both the request (forwarded to the Server Component) and the response (sent back to the browser). The actual DB row + Circle wallet are provisioned lazily by [`lib/session.ts`](./lib/session.ts) on first DB lookup.

## Dev

```sh
cp .env.example .env
# fill: CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, ARC_RPC_URL,
#       LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
pnpm install              # from monorepo root
pnpm --filter web db:push # apply Drizzle schema to ./stakeword.db
pnpm dev                  # http://localhost:3000
```

If you don't have a Circle Entity Secret yet, run [`spike/circle-bootstrap`](../../spike/circle-bootstrap) — one command generates + registers it.

## Test

```sh
pnpm typecheck           # strict tsc --noEmit
pnpm build               # next build (turbopack)
```

No automated test suite yet. Manual smoke after `pnpm dev`:

```sh
curl -c /tmp/c.txt http://localhost:3000/api/me           # session bootstrap
curl -b /tmp/c.txt http://localhost:3000/api/leaderboard  # empty aggregate
curl -b /tmp/c.txt http://localhost:3000/api/reputation   # null agent until first commit
```

## Where things settle

Everything that involves money settles on Arc testnet via Circle Dev-Controlled Wallets:

| Action | Caller wallet | Contract |
|---|---|---|
| `createJob` | user (client) | AgenticCommerce |
| `setBudget` | user (provider) | AgenticCommerce |
| `approve` USDC | user (client) | USDC |
| `fund(jobId)` | user (client) | AgenticCommerce |
| `register(agentURI)` | user | ERC-8004 IdentityRegistry |
| `submit(deliverableHash)` | user (provider) | AgenticCommerce |
| `complete(reasonHash)` / `reject(reasonHash)` | evaluator | AgenticCommerce |
| `giveFeedback(...)` | evaluator | ERC-8004 ReputationRegistry |
| `transferUsdc` (coach top-up) | user → evaluator | USDC |

The evaluator wallet is platform-controlled, bootstrapped once at first request, persisted in the `system_state` table.
