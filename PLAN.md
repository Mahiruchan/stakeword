# StakeWord Development Plan

> An AI-powered on-chain goal commitment protocol

---

## 1. Product Positioning

**One-liner:** Users stake USDC on their own goals; Claude acts as an AI coach throughout—supervising, intervening, and validating. Success returns principal plus yield; failure triggers automatic redistribution of funds.

**Key differentiators:**
- What you stake on is **yourself**, not the market
- AI is not just a verifier but a **fully engaged coach making decisions throughout**
- Locked funds earn via **USYC yield**, turning punitive mechanics into incentive mechanics
- Commitment outcomes are anchored on-chain, building a **credible behavioral profile**

---

## 2. Core User Flow

```
1. Connect wallet (automatic creation with Circle Wallets)
   ↓
2. Describe goal → Claude refines commitment terms conversationally
   ↓
3. Lock USDC → automatically deposited into USYC for yield
   ↓
4. Commitment period: Claude proactive nudges + user uploads proof + Claude validates
   ↓
5. Settlement:
   - Success → principal + USYC earnings returned
   - Failure → Claude decides fund destination (charity / pool / extend lock)
   ↓
6. Commitment record on-chain, written into the user behavioral profile
```

---

## 3. Feature Breakdown

### Module 1: Smart Commitment Generator

**What Claude does:**
- Multi-turn dialogue to turn fuzzy goals into **verifiable clauses**
  - User: “I want to get healthier”
  - Claude asks: “By when? How often? How do we measure?”
  - Final clause: “Complete 20 runs of 30+ minutes within 30 days; each upload requires a Strava screenshot”
- Uses user history to estimate **completion likelihood** and suggest a reasonable stake amount
- Produces a formal **commitment contract** (natural language + structured data)

**Frontend work:**
- Conversational UI (ChatGPT-like)
- Visual commitment cards
- Stake slider + AI-recommended value

---

### Module 2: AI Coach During the Commitment Period

**What Claude does (critical for bonus points):**

| Trigger | Claude’s decision |
|--------|-------------------|
| User falls behind | Proactive pushes: encouragement, warnings, adjustment suggestions |
| User completes streak | Positive reinforcement; optional “stake bump” |
| Extended inactivity | Ask what’s blocking them; optional goal reduction |
| Suspicious proofs | Ask for extra evidence; enable anti-cheating flow |
| Approaching deadline | Estimate remaining feasibility; sprint strategy |

**Frontend work:**
- Progress dashboard (done / remaining / projected completion rate)
- Message notification center
- Evidence upload UI (images, links, text)

---

### Module 3: Intelligent Verification System

**What Claude does:**
- Visual analysis of screenshots (Strava, Apple Health, reading apps, etc.)
- Extract key metrics (duration, distance, dates)
- Cross-check against commitment terms
- Dynamically tune verification strictness (mitigate learned exploits)
- Generate verification reports and sign for on-chain posting

**Technical notes:**
- Use Claude vision for screenshot understanding
- Hash each verification result on-chain (Arc is inexpensive)
- Anomalous verifications trigger a secondary confirmation flow

---

### Module 4: On-chain Fund Management

**Circle stack:**

| Tool | Role |
|------|------|
| **Wallets** | Auto-create Dev-Controlled Wallet on signup |
| **USDC** | Locked principal |
| **USYC** | Yield while locked (**core innovation**) |
| **Contracts** | Custody + conditional release + automatic transfers |
| **Paymaster** | Pay gas in USDC—users barely notice gas |
| **Send** | Execute payouts on failure |

**Contract logic:**
- On lock, funds move into USYC automatically
- On successful verification → redeem USYC → return principal + yield
- On failed verification → `Send` to addresses decided by Claude

---

### Module 5: Commitment Profiles & Social Layer

**What Claude does:**
- After each commitment closes, produce a **completion summary report**
- Analyze behavior patterns (persistence, best time windows, failure reasons)
- Generate **shareable achievement cards**

**Frontend work:**
- User home: totals completed, total locked volume, credibility score
- Public leaderboards: in-flight commitments, recently completed commitments
- Share-card design optimized for Twitter/X

**On-chain data:**
- Every commitment state transition is recorded on-chain
- User address → verifiable fulfillment history

---

## 4. Technical Architecture

### Frontend
- **Stack:** Next.js + Tailwind CSS
- **Wallet:** Circle Wallets SDK
- **Hosting:** Dedicated server (self-hosted)
- **CI/CD:** Continuous deployment pipeline (to be configured for automated builds and releases)

### Backend
- **API:** Next.js API routes or standalone Node service
- **AI:** Anthropic Claude API (including vision)
- **Jobs:** Queue for Claude-driven proactive pushes

### On-chain
- **Network:** Arc Testnet (via Canteen RPC)
- **Contracts:** One core custody contract + USYC interaction logic
- **Tooling:** ARC CLI (provided)

### Storage
- **Structured data:** Postgres (users, commitments, fulfillment logs)
- **Evidence files:** Object storage (S3 / R2)
- **Anchoring:** Hash critical verification outcomes on-chain

---

## 5. Hard Problems & Mitigations

### Problem 1: How does Claude “proactively” intervene?
**Mitigation:** Backend cron scans all active commitments; based on progress, call Claude to decide whether to notify. Claude returns structured output (notify / skip + notification content).

### Problem 2: Screenshot spoofing?
**Mitigation:**
- Claude vision checks metadata (timestamp, device) where available
- Cross-compare screenshots for the same user (fonts, UI consistency)
- At critical milestones ask for screen recording or multi-angle proof
- Do not disclose exact anti-cheating rules so attackers cannot optimize against them

### Problem 3: USYC integration complexity?
**Mitigation:** Circle exposes standard USYC interfaces—call subscribe/redeem APIs directly. If time-constrained: lock plain USDC first; add USYC as a stretch goal.

### Problem 4: Where do failed stakes go?
**Mitigation:** Three modes selectable at commitment creation:
- **Charity:** Claude maps goal type to a relevant charitable address
- **Social:** Distribute among others who completed similar goals
- **Tiered:** Partial refund + partial burn to avoid total loss-aversion fallout

---

## 6. Cold Start (Critical for Traction)

1. **Founder commitment:** Personally run 3 public commitments; document end-to-end
2. **Discord:** Run a “finish your commitment during the hackathon” challenge in Canteen Discord
3. **Seed users:** Invite ~10 friends to small stakes ($1–5)
4. **Virality:** Post-completion cards use “want to bet against me?” challenger copy
5. **Public dashboard:** Live totals for locked volume, completion rate, user count

---

## 7. Demo & Submission

### Must-haves
- ✅ Live demo (complete flow works for a real user)
- ✅ Founder pitch video (3–5 minutes)
- ✅ Public GitHub repository
- ✅ Real traction metrics (users, locked volume, completions)

### Pitch video outline
1. **30s** — End-to-end walkthrough of one real commitment
2. **1 min** — Why “staking on yourself” inverts prediction markets
3. **1 min** — Claude’s agentic decisions (beyond simple verification)
4. **1 min** — Circle tooling, especially USYC as the innovation wedge
5. **30s** — Traction snapshot and vision

---

## 8. Rubric Self-Check

| Dimension | How this plan maps |
|-----------|--------------------|
| Agentic 30% | Claude decides across five stages: clause drafting, progress intervention, evidence validation, fund routing, behavioral analysis |
| Traction 30% | Low-friction acquisition + self-spread mechanics + public dashboard |
| Circle Tool 20% | Six tools: Wallets, USDC, USYC, Contracts, Paymaster, Send |
| Innovation 20% | Perspective flip + USYC yield + on-chain behavioral profile |
