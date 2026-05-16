# Checklist

> Every row is in one of three columns:
> - ✅ **Verified working** — observed passing during a session
> - 🟡 **Code written, not live-tested** — TypeScript compiles, ABI matches docs, but never executed end-to-end against the real chain or service
> - ❌ **Not done** — absent from the repo
>
> The "How verified" column is the receipt. If you can't reproduce the verification step, treat that row as 🟡.

## Tier 1 — verified working

| Area | Item | How verified |
|---|---|---|
| **Build** | TypeScript strict typecheck across the web app | `npm run typecheck --workspace=web` exits 0 |
| **Build** | Next.js production build | `npm run build --workspace=web` succeeds, 14 routes register, middleware bundles separately |
| **Build** | Dev server boots | `npm run dev --workspace=web` reaches `Ready in 459ms`, listens on :3000 |
| **UI** | Design tokens applied | Playwright probe at \`/\` confirmed `h1` uses Archivo Black, `body` uses Instrument Sans, CSS var `--color-primary` resolves to `#b6ff4d` |
| **UI** | Landing renders all sections from mockup | Playwright snapshot showed nav + hero + stats + commitment-builder + dashboard band all present |
| **DB** | Drizzle schema applies cleanly | `npm run db:push --workspace=web` succeeds, creates `stakeword.db` with all 6 tables |
| **Middleware** | Cookie bootstrap before RSC | First curl to `/api/me` returns a populated session JSON without erroring on the "RSC can't write cookies" path |
| **Session** | Circle Dev-Controlled wallet auto-provisioned per session | Live curl `/api/me` returned `walletAddress: 0x01efd024e2b15ee68e7bae3a1df240300c22f4ab` (fresh address, never previously seen) |
| **Session** | Evaluator wallet bootstrap (shared platform oracle) | Same call returned `evaluatorAddress: 0xbb17ade11631ef38703b6de0104b424076d0a93c`; second call returned the same address (= persisted in system_state) |
| **API** | `/api/me` no longer leaks `walletId` | Live curl body contains `sessionId`, `walletAddress`, `usdcBalance`, `evaluatorAddress` and no `walletId` field |
| **API** | `/api/leaderboard` returns aggregate JSON | Live curl: `{aggregate: {totalStakeBaseUnits:"0", …, uniqueAddresses:0}, leaderboard: []}` |
| **API** | `/api/reputation` returns null for unregistered session | Live curl: `{"agentId":null,"pass":null,"fail":null}` |
| **API** | `/api/coach?commitmentId=x` returns empty balance + history | Live curl: `{"balance":{"balanceBaseUnits":"0",…},"messages":[]}` |
| **API** | `/u/[address]` 404s on invalid addresses | Live curl `/u/0xnotanaddress` returned 404 |
| **API** | `/u/[address]` 200s on valid addresses | Live curl `/u/0x000000000000000000000000000000000000dEaD` returned 200 |
| **Chain** | AgenticCommerce (ERC-8183) contract live on Arc | `spike/erc8183 npm run verify` shows deployed bytecode at `0x0747…4583`; `npm run read-job -- 1` returns a real third-party Completed job (`"Review a market brief on stablecoin payments in Asia"`) |
| **Chain** | USDC contract on Arc responds | Same verify: symbol = `USDC`, decimals = 6 |
| **Chain** | USYC contract on Arc responds (read-only) | Same verify: symbol = `USYC`, decimals = 6. We can read; we have NO write access (no allowlist). |
| **Chain** | Arc testnet RPC token works | Live `eth_chainId` returns `0x4cef52` (5042002); `eth_getBlockNumber` returned 42M+ |
| **Circle** | API key + Entity Secret pair is valid + paired | `spike/circle-bootstrap/smoketest.ts` ran `listWalletSets()` and got 200 OK + empty array |
| **Circle** | Entity Secret registration helper ran cleanly | `spike/circle-bootstrap/register-entity-secret.ts` printed `Entity Secret is registered` + downloaded recovery file |
| **LLM** | Kimi-K2.6 text completion via infini-ai (Anthropic-format) | Live curl to `cloud.infini-ai.com/maas/v1/messages` returned 200 with `content: [{type:"thinking",…},{type:"text",…}]` |
| **LLM** | Kimi-K2.6 vision input | Same curl with `{type:"image", source:{type:"base64",…}}` returned 200 with content describing a 1×1 black PNG correctly |

## Tier 2 — code written, not live-tested

> These are the riskiest rows. The code compiles, the ABI signatures match the published docs, but I never ran the full request against the real chain. The reason in almost every case: my session wallet has 0 USDC.

| Area | Item | Why not tested |
|---|---|---|
| **Commitments** | `/api/commitments` POST drives `createJob → setBudget → approve → fund` | Needs USDC in the session wallet; no faucet run during this session |
| **Commitments** | Streaming NDJSON timeline animates the 5 steps in the form | Server stream code typechecks; client consumer never saw real chunks |
| **Commitments** | `extractJobIdFromTx` decodes `JobCreated` event from receipt | Logic only exercised in `spike/erc8183/read-job.ts`, not from the API |
| **ERC-8004** | `register(agentURI)` mints Identity NFT on first fund | Never invoked end-to-end |
| **ERC-8004** | Transfer event decoded to extract `agentId` (tokenId) | Same |
| **ERC-8004** | `giveFeedback(...)` on every settle | Same |
| **ERC-8004** | `getSummary` aggregation surfaced in ReputationBadge | Only tested with `agentId: null` path; the populated path with real data was not |
| **Proof** | Text proof → Kimi `verifyTextEvidence` → settle on chain → reputation feedback | Full pipeline never run |
| **Proof** | URL proof same path | Same |
| **Proof** | Image proof via FileReader → `verifyImageEvidence` | Buffer-in-browser bug fixed, but the new FileReader code path was never live-loaded in a browser |
| **Proof** | `submit(deliverableHash)` then `complete/reject(reasonHash)` | Never run |
| **Proof** | Retry-settle endpoint (`/api/commitments/[id]/retry-settle`) | Never invoked |
| **Coach** | `/api/coach/topup` does real USDC transfer user→evaluator | Code written; needs USDC; never run |
| **Coach** | `/api/coach` POST: atomic debit transaction + Kimi call + history append | Only the GET path tested. The transaction-wrapped debit and the refund-on-LLM-failure path are unverified at runtime |
| **Coach** | Coach UI with live balance ticker | Never used end-to-end |
| **UI** | Fund-evaluator button (the rewritten one after I found the broken `<form>`) | The new client component was never live-clicked |
| **UI** | ShareCompletion (Twitter intent, copy-tweet, copy-profile-URL) | Never seen rendered with a real completed commitment |
| **UI** | Leaderboard table with non-empty rows | Tested empty only |
| **UI** | `/u/[address]` profile with non-empty history | Tested empty only |
| **Contracts** | `StakeWordVault.sol` compiles | Foundry install was blocked by GH API rate limit; `forge build` never ran on this machine. Solidity passes my eyes but no compiler check. |
| **Contracts** | Foundry test suite passes | Same — tests are written but never executed |
| **Contracts** | Deploy script broadcasts to Arc testnet | Never run |

## Tier 3 — not done

| Area | Item | Notes |
|---|---|---|
| **Vault** | Deploy `StakeWordVault.sol` to Arc testnet | One `forge script` away once Foundry installs + deployer wallet funded |
| **Vault** | Wire keeper to evaluator wallet, add `recordDeposit` calls into `/api/commitments` after fund | Code stub not started |
| **USYC** | Allowlist ticket filed with Circle | Needs the deployed vault address first |
| **USYC** | Vault `setTeller(...)` flipped on | Gated on allowlist clearing |
| **Deploy** | Live web URL anywhere (Vercel / Render / cloud server) | Local-only. Submission form's "Project Live URL" field is optional but real users can't try the product without it. |
| **Coach** | Scanner / cron — proactive nudges based on deadline proximity | No worker process exists yet |
| **Circle App Kit** | `<UnifiedBalance>` / `<Bridge>` components mentioned in `docs.arc.io` not integrated | Would bump Circle-tools count from 8 → 9 |
| **Tests** | Automated unit tests | None |
| **Tests** | Playwright E2E suite | None |
| **Tests** | Solidity test execution | Tests written, never run |
| **Submission** | Google Form filled out (`forms.gle/hFPM2t4Jt1zGfqzM7`) | Form located; fields enumerated in `docs/PITCH.md` notes. No draft answers written. |
| **Submission** | Pitch video recorded | Script only (`docs/PITCH.md`). Not filmed. Note: target ≤3:00 per the form; current script is closer to 4:00 and needs a trim pass. |
| **Submission** | Project description / problem statement / traction paragraphs drafted | Not written |
| **Traction** | Real users | 0 users. Leaderboard renders empty. ERC-8004 reputation has zero feedback events. |
| **Outreach** | Twitter / X posts | None |
| **Outreach** | Canteen Discord posts (under user account) | None — explicit team decision earlier in the project (avoid bot-like behavior) |

## What this means for the demo

If the demo today is a live screen recording:

- **Works**: every UI page loads, the wallet appears, the leaderboard / profile pages render, the dashboard layout is what `design-preview.html` promised.
- **Stops working**: the moment you click "Stake + create on-chain" without USDC. The first `createJob` tx will be submitted by Circle's wallet API, but funded with no USDC the wallet will fail and the stream emits an `error` event.

If the demo is recorded:

1. Faucet the printed wallet first (https://faucet.circle.com pasted with the address from `/app`).
2. Top up the evaluator wallet (one click on the dashboard).
3. Then everything in Tier 2 above will either work or surface a real bug that we'll find for the first time.

**Recommendation**: do the faucet step + one full commitment lifecycle once **before** recording. Anything that surfaces broken there is a real bug that needs fixing first.
