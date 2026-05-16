# For judges — rubric mapping

> One-page evaluation guide. Every claim links to exactly where to verify it.

Per [`Agora_Hackthon_Requirements.md`](./Agora_Hackthon_Requirements.md), four weighted dimensions:

| Weight | Dimension | StakeWord's claim |
|---|---|---|
| **30%** | Agentic Sophistication | Claude is the on-chain evaluator. Five distinct decision points, all settling real transactions. |
| **30%** | Traction | Hackathon-builder cohort as the cold-start population. Public leaderboard, ERC-8004 reputation, Twitter-shareable receipts. |
| **20%** | Circle Tool Usage | Eight pieces of the Circle / Arc stack actually wired up. |
| **20%** | Innovation | Only self-contract ERC-8183 project + only ERC-8004-anchored reputation project. Vault inverts the punishment metaphor. |

---

## Agentic Sophistication (30) — where to verify

Claude makes five real decisions per commitment. The evaluator is **a wallet that signs transactions**, not a chat bot.

| # | Decision | Code | Surface |
|---|---|---|---|
| 1 | Turn a fuzzy goal into a verifiable criterion | [`apps/web/lib/llm/coach.ts`](../apps/web/lib/llm/coach.ts) — `refineCommitment` | `/app/new` form (criteria field is suggested by Claude) |
| 2 | Read uploaded evidence (text / URL / **vision** for screenshots) | [`apps/web/lib/llm/verify.ts`](../apps/web/lib/llm/verify.ts) — `verifyTextEvidence` + `verifyImageEvidence` | `/app/c/[id]` → ProofSubmissionForm |
| 3 | Decide `pass` / `fail` / `needs-more` against the criteria | Same file | Verdict pill on commitment detail page |
| 4 | Sign the on-chain `complete(jobId, reasonHash)` or `reject(...)` from the evaluator wallet | [`apps/web/lib/actions.ts`](../apps/web/lib/actions.ts) → `onChainComplete` / `onChainReject` | Explorer link in the proof verdict block |
| 5 | Anchor verdict as ERC-8004 Reputation feedback (`giveFeedback`) | [`apps/web/lib/reputation/agent.ts`](../apps/web/lib/reputation/agent.ts) → `giveFeedback` | ReputationBadge on `/app` + on-chain at `0x8004B663…713` |

Plus the metered coach:

- [`apps/web/lib/llm/chat.ts`](../apps/web/lib/llm/chat.ts) — `coachChat` — runs every nudge through the same Kimi-via-Anthropic adapter, debited per call via [`apps/web/app/api/coach/route.ts`](../apps/web/app/api/coach/route.ts)

---

## Traction (30) — where to verify

The category — staking on your own goals — has 15+ years of product history and zero Web3 PMF (see [`RESEARCH.md`](./RESEARCH.md)). We don't chase generic productivity users; we go after the **hackathon cohort itself**.

| Mechanic | Code | Surface |
|---|---|---|
| Public, no-auth aggregate of all activity | [`apps/web/app/leaderboard/page.tsx`](../apps/web/app/leaderboard/page.tsx) + [`api/leaderboard/route.ts`](../apps/web/app/api/leaderboard/route.ts) | `/leaderboard` |
| Public per-address profile (any wallet) | [`apps/web/app/u/[address]/page.tsx`](../apps/web/app/u/[address]/page.tsx) | `/u/<wallet>` |
| Twitter share intent on settled commitments | [`apps/web/components/ShareCompletion.tsx`](../apps/web/components/ShareCompletion.tsx) | `/app/c/[id]` when status = completed |
| Ledger of x402 metered AI activity (calls today, USDC spent) | [`apps/web/app/api/coach/route.ts`](../apps/web/app/api/coach/route.ts) + `CoachChat` | `/app/c/[id]` coach panel |

Each commitment fires three independent on-chain events (ERC-8183 fund/submit/complete + ERC-8004 register/giveFeedback) — judges can verify activity by hashing arcscan addresses against the leaderboard.

---

## Circle Tool Usage (20) — eight tools wired

| # | Tool | Where |
|---|---|---|
| 1 | **Arc testnet** (chainId 5042002) | [`lib/chain/client.ts`](../apps/web/lib/chain/client.ts) — `defineChain` + viem PublicClient |
| 2 | **USDC** on Arc (`0x3600…0000`) | Locked on every commitment, paid on every coach call |
| 3 | **Circle Dev-Controlled Wallets** | [`lib/circle/wallets.ts`](../apps/web/lib/circle/wallets.ts) — auto-provisioned per session in [`lib/session.ts`](../apps/web/lib/session.ts) |
| 4 | **ERC-8183 reference contract** (`0x0747…4583`) | [`lib/actions.ts`](../apps/web/lib/actions.ts) — full lifecycle |
| 5 | **ERC-8004 IdentityRegistry** (`0x8004A818…D9e`) | [`lib/reputation/agent.ts`](../apps/web/lib/reputation/agent.ts) — `registerAgent` |
| 6 | **ERC-8004 ReputationRegistry** (`0x8004B663…713`) | Same file — `giveFeedback` + `getReputationSummary` |
| 7 | **x402-style metered service** | [`spike/x402/`](../spike/x402/) HTTP dance + production prepaid model in [`api/coach/route.ts`](../apps/web/app/api/coach/route.ts) |
| 8 | **StakeWordVault** (Foundry, USYC-routing opt-in) | [`contracts/src/StakeWordVault.sol`](../contracts/src/StakeWordVault.sol) — Foundry-tested, deploy-ready |

Only #8 isn't yet broadcast to testnet — `forge script script/Deploy.s.sol` ships once a deployer wallet is funded.

---

## Innovation (20) — the unique wedges

1. **Self-contract ERC-8183.** Every other team using ERC-8183 models it as a marketplace (client and provider are different humans). StakeWord makes them the same wallet — the user is both buying and selling against themself. Survey of the Canteen `#agora-hackers` channel: no other team has shipped this.

2. **ERC-8004 reputation as a first-class product surface.** Most projects treat ERC-8004 as "we registered" — we put live feedback on chain after every commitment and surface the aggregate as a public profile. The "Most Novel" superlative aadi has called out repeatedly is for ERC-8004-anchored designs (see Canteen Discord `#announcements`).

3. **Punishment-to-yield inversion.** USYC vault routes pooled stake → yield → completers. Your failure literally bankrolls others' success. "I just made $0.43 because Dave didn't ship his deadlift challenge" is a Twitter-native moment.

4. **x402-style prepaid coach.** One real onchain settle per session funds an internal balance; calls debit instantly. Same economics as Circle Gateway batched nanopayments, hackathon-friendly UX.

---

## How to actually evaluate this

1. Read [`../README.md`](../README.md) for the elevator pitch (90 seconds).
2. Run [the local setup](../README.md#running-it-locally) (3 minutes if you have keys).
3. Open `/app`, faucet, click through `Create commitment` → upload proof → see ERC-8183 settle on-chain.
4. Compare against the addresses in the table above on [testnet.arcscan.app](https://testnet.arcscan.app).
5. If you have 5 more minutes, scan [`RESEARCH.md`](./RESEARCH.md) for the receipts behind the plan decisions.

If you only have one minute: visit `/leaderboard` and click any address through to `/u/<address>` — that's the entire trust loop in two pages.
