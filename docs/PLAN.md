# StakeWord Development Plan

> An AI-powered self-contract ERC-8183 fulfillment protocol: the user is both the client and the provider, while Claude is the evaluator.

---

## 1. Product Positioning

**The first self-contract ERC-8183 job protocol**. Users stake USDC on their own goals; the **protocol vault** uses one institutional allowlist to put the pooled funds into USYC; **Claude acts as the on-chain evaluator**; and **failed principal + pooled yield** are automatically redistributed to users who complete their commitments.

**Key highlights:**
- Uses the deployed [`AgenticCommerce`](https://testnet.arcscan.app/address/0x0747EEf0706327138c69792bF28Cd525089e4583) ERC-8183 reference implementation on Arc as the fulfillment container
- Claude directly calls `complete(jobId, reasonHash)` on-chain and is the evaluator role
- Users get Circle Dev-Controlled Wallets (SCA account type, Arc testnet) and only interact with USDC
- The protocol vault holds USYC through one allowlisted address, with yield distributed to the season's completer pool
- Claude coaching and verification are metered through x402 USDC micropayments, producing real transaction data
- Similar commitments use 2-3 peer reviewers to reduce the risk of relying on a single AI vision check

---

## 2. Core User Flow

```
1. Sign up → Circle Dev-Controlled Wallet is created automatically (SCA on ARC-TESTNET)
2. Describe a goal → Claude uses a multi-turn conversation to generate verifiable terms + commitment text
3. Stake:
   3a. User approves USDC → AgenticCommerce.createJob(provider=self, evaluator=ClaudeOracle, description=...)
   3b. provider (=self) calls setBudget(jobId, stake)
   3c. client (=self) calls fund(jobId) → Job enters Funded state
   3d. Protocol pools USDC → USYC through the vault only, invisible to the user
4. Commitment period:
   4a. Claude proactive nudges / coaching chats → each interaction can charge $0.01 USDC through x402
   4b. User uploads evidence → Claude vision verifies → approved evidence counts toward progress
   4c. Completion condition met → provider calls AgenticCommerce.submit(jobId, deliverableHash)
   4d. evaluator (Claude wallet) calls complete(jobId, reasonHash)
5. Settlement:
   5a. Success → user receives principal + their share of completer-pool yield
   5b. Failure → principal remains in the protocol vault and is distributed to successful users at season end
6. On-chain identity:
   Each user's wallet address + ERC-8183 job history = public fulfillment profile
```

---

## 3. Key Design

### Design 1: ERC-8183 Reference Contract as Fulfillment Container

StakeWord uses the deployed `AgenticCommerce` contract on Arc testnet as the core fulfillment container:

- Contract address: `0x0747EEf0706327138c69792bF28Cd525089e4583`
- `spike/erc8183/` verifies Arc testnet chain `5042002` is online and both USDC/USYC respond to ERC-20 calls
- `npm run read-job -- 1` reads a real on-chain job, with Completed/Funded status examples
- ABI plus `createJob`, `setBudget`, `fund`, `submit`, `complete`, and `getJob` TypeScript pipeline are implemented and pass `tsc --noEmit`

| ERC-8183 field | StakeWord meaning |
|---|---|
| `client` | User who funds the job |
| `provider` | Same user, fulfilling their own commitment |
| `evaluator` | Claude oracle wallet, shared by the platform |
| `description` | Natural-language commitment text |
| `deliverable` (`bytes32`) | `keccak256(evidence package + timestamp)` |
| `reason` (`bytes32`) | `keccak256(Claude verification report)` |
| `Job.status` | Open → Funded → Submitted → Completed/Rejected/Expired |

### Design 2: Protocol Vault for USYC

USYC is an institutionally permissioned asset with a high minimum size and a 24-48 hour allowlist process. StakeWord avoids exposing USYC directly to retail users by routing yield through a protocol vault.

```
User:  USDC ──→ Protocol EscrowVault ──→ AgenticCommerce.fund()
                       │
                       └── Vault only (single allowlist) → USYC ──── earns yield
                                                              │
                          Success: user receives USDC          │
                          Failure: principal enters completer pool
                          Season end: yield + failed principal split by completions
```

**Benefits:**
- Only one vault address needs to be allowlisted
- Users only see USDC, keeping the UX clean
- The product story becomes direct: "if you fail, completers get paid"

### Design 3: x402 Metered AI Coaching

Each Claude coaching or verification action can become a small USDC payment, creating transaction count and USDC volume automatically.

`spike/x402/` validates `@x402/express` 2.12.0 + `@x402/fetch` 2.12.0:

- TypeScript compilation passes
- Local mock facilitator + real x402 server flow works
- `POST /coach` returns `402`, and the `Payment-Required` header is valid x402 v2 base64
- Decoded payload is `{scheme:"exact", network:"eip155:84532", amount:"10000"(=0.01 USDC), payTo, maxTimeoutSeconds:300}`
- Mock facilitator endpoints `/supported`, `/verify`, and `/settle` work for a fully offline demo
- Switching to Arc only requires `NETWORK=eip155:5042002` + `FACILITATOR_URL=<Circle Gateway>`

| Trigger | Price |
|---|---|
| Claude proactive nudge | $0.001 |
| Claude vision verification for one image | $0.005 |
| Claude summary / analysis report | $0.01 |
| Claude multi-turn goal adjustment | $0.02 |

Pricing can be tuned after user testing. The initial recommendation is to keep the barrier low.

### Design 4: Traction Model for Hackathon Shipping

The target users are **the Canteen Discord hackathon builders + the Web3 developer Twitter circle**.

Commitment examples:
- "Ship one dapp before 5/25, stake $20"
- "Finish the ERC-8183 integration this week, stake $10"
- "Review three project PRs by tomorrow, stake $5"

StakeWord becomes a companion tool for the hackathon. Builders use it themselves, which naturally creates Twitter distribution. Traction comes from real staking flow and x402 micropayments, with a clear narrative: "people in this hackathon used our product to ship."

**12-day target:** 30-100 real staking users, $500-$3000 TVL, and 500-2000 x402 micropayment transactions.

---

## 4. Technical Architecture

### Frontend
- **Stack:** Next.js + Tailwind CSS
- **Wallet:** Circle Wallets SDK (SCA on ARC-TESTNET, see `spike/circle-wallets/`)
- **Hosting:** Self-hosted server with CI/CD for automated build and deployment

### Backend
- **API layer:** Next.js API Routes for the app + one standalone Node service for long-running work
- **Long-running jobs:** Claude proactive scan loop, x402 server, Arc evaluator calls
- **AI:** Anthropic Claude API including vision + prompt caching for common system prompts
- **Queue:** Simple Postgres polling table for the MVP, no Redis unless needed

### Contracts
- **AgenticCommerce (ERC-8183 ref impl):** `0x0747EEf0706327138c69792bF28Cd525089e4583` on Arc testnet, called directly
- **StakeWordVault:** Small contract that holds USYC and implements completer-pool distribution for yield + failed principal
- **EvaluatorPolicy:** Claude oracle wallet decisions for `complete()` are signed by the backend Node service and sent through Circle Wallets SDK

### Data
- **Postgres (Supabase):** Users, commitments (`joinid` + AgenticCommerce jobId), x402 transactions, evidence metadata
- **Object storage:** Supabase Storage or R2 for evidence images
- **On-chain anchoring:** All deliverable hashes and reason hashes are `keccak256` values posted on-chain, with original text stored locally

---

## 5. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Claude vision verification is not robust enough | 2-3 peer reviewers for similar commitments + secondary checks for anomalous evidence + private anti-cheat rules |
| USYC allowlist is not approved | Fall back to "no yield, failed principal only" completer pool while keeping the core story intact |
| x402 Circle Gateway facilitator is not live before the hackathon | Demo with facilitator.x402.org + Base Sepolia, then switch to Arc once the facilitator is available |
| Traction is weak | Fallback to embedding StakeWord in a Twitter bot where users can mention it to create commitments |
| Competition rules disallow off-RFB submissions | The ERC-8183, protocol vault, and x402 design can migrate to RFB 02/06 (prediction market trader / social trading) |

---

## 6. 12-Day Execution Plan

| Date | Owner | Work |
|---|---|---|
| 5/14 AM | Me (spike) | Apply for USYC testnet allowlist, wait 24-48h |
| 5/14 23:00 | You | Watch Twitch KickOff 2, confirm official challenge tone, report any surprises |
| 5/15 | Teammate | Next.js skeleton + Circle Wallets integration using `spike/circle-wallets/` |
| 5/15 | Me | StakeWordVault contract sketch → deploy to testnet → forge verify |
| 5/16 | Together | ERC-8183 end-to-end: frontend creates job → backend evaluator auto-completes |
| 5/17 | Together | Add x402 coaching API, tune Claude prompts, finalize pricing flow |
| 5/18-5/22 | Together | Launch MVP and drive traction |
| 5/19-5/20 | Team / You | Acquire users from Twitch chat, Twitter, and Discord |
| 5/23 | Me | Draft pitch video script, with you/teammate on camera |
| 5/24 | Together | Final README + accumulated `arc-canteen update-product` updates |
| 5/25 | Team | Submit |

---

## 7. Rubric Self-Check

| Dimension | Weight | Implementation | Expected score |
|---|---|---|---|
| Agentic Sophistication | 30% | Claude is the on-chain evaluator, makes real decisions across 5 stages, and exposes a metered x402 service | 24-28 |
| Traction | 30% | Hackathon builders as seed users, x402 creates automatic transaction volume, real staking flow | 18-24 |
| Circle Tool Usage | 20% | Wallets / USDC / USYC / Contracts / Paymaster / Send / x402 / ERC-8183 ref impl | 16-19 |
| Innovation | 20% | Self-contract ERC-8183 + failed-stake redistribution + on-chain fulfillment profile | 14-17 |
| **Expected total** | | | **72-88 / 100** |

---

## 8. Submission Checklist

- ✅ Live usable product deployed to our own server through CI/CD, with frontend + backend in one repo
- ✅ Founder pitch video, 3-5 minutes
- ✅ Public GitHub repository
- ✅ Real traction data: staking users, cumulative USDC volume, x402 transaction count, completion rate
- ✅ `arc-canteen update-product` at least once per day so judges can see progress

---

## 9. Related Files

- `RESEARCH.md` — comparable product history + USYC feasibility + spike evidence
- `spike/erc8183/` — ERC-8183 end-to-end TypeScript scripts with read-only validation complete
- `spike/x402/` — x402 server + client + mock facilitator with offline flow complete
- `spike/circle-wallets/` — Circle Dev-Controlled Wallets creation template
- `spike/usyc-research/USYC-feasibility.md` — USYC constraints + protocol vault design
