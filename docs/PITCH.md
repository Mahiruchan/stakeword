# StakeWord — pitch video script

> Target: 3–5 minutes total. Hackathon required deliverable per Agora_Hackthon_Requirements.md §"Submit".
>
> Audience: judges who have already read the README. Skip the obvious. Show the unique thing in motion.

## Structure (5 sections, ~30–60s each)

| § | Time | Beat |
|---|---|---|
| 1 | 0:00–0:30 | Cold open — a single real commitment going live on-chain, end to end |
| 2 | 0:30–1:30 | Why \"staking on yourself\" inverts prediction markets |
| 3 | 1:30–2:30 | Claude as the on-chain evaluator — five places it makes a decision |
| 4 | 2:30–3:30 | The Circle stack we wired up — and why ERC-8004 is the wedge |
| 5 | 3:30–4:00 | Traction snapshot + the next 7 days |

---

## §1 — Cold open (0:00–0:30)

**Visual cue:** screen recording at 1.25× speed of a real session.

1. Open `localhost:3000/app` cold (no DB rows) — middleware mints a Circle wallet on Arc.
2. Copy address → Circle faucet → 10 USDC lands → balance ticks up live.
3. Click **Create commitment**. Fill:
   - **Goal:** \"Ship StakeWord MVP by 5/25.\"
   - **Criteria:** \"Public URL on Arc testnet running ERC-8183 end-to-end, demonstrated in a screen recording.\"
   - **Stake:** \$5
4. Submit. The 4-tx progress timeline ticks: createJob ✓ → setBudget ✓ → approve ✓ → fund ✓.
5. Then the **5th** tick fires: ERC-8004 register ✓.
6. Cut to the commitment detail page. The job is **Funded** on chain.

**Voiceover:**
> \"In thirty seconds, I went from zero to a real ERC-8183 job on Arc testnet — funded with USDC, with my agent identity minted on ERC-8004, all from a single web flow. No seed phrase, no MetaMask popup. Watch.\"

---

## §2 — The inversion (0:30–1:30)

**Visual cue:** static graphic — \"Prediction markets: bet on the world. StakeWord: bet on yourself.\"

**Voiceover:**
> \"Every prediction-market team in this hackathon is asking: who wins the election, will Polymarket's number be wrong. They're modeling other people's behavior. StakeWord asks the opposite question: **what will you actually finish**?
>
> Users stake USDC on their own goals. The user is both the client and the provider on an ERC-8183 job. Claude is the evaluator. Failed stakes don't go to the house — they go to the people who actually finished.
>
> This isn't another wellness habit tracker. It's a hackathon-builder accountability rail. Stake \$20 to ship a dapp by Friday. If you ship, you get your USDC back. If you don't, the people who did get richer. Your reputation is anchored on ERC-8004 forever.\"

---

## §3 — Claude as evaluator (1:30–2:30)

**Visual cue:** screen recording of the proof flow.

1. Upload a screenshot of the deployed dapp.
2. Add the caption: \"Live at stakeword.app/c/abc on Arc testnet, ERC-8183 job #42 Completed.\"
3. Submit proof.
4. Claude's verdict renders inline: `verdict: pass · reasoning: \"Screenshot shows...\"`.
5. Two on-chain links appear under the verdict: `submit() tx →` and `complete() tx →`.
6. Cut to the ERC-8004 reputation badge ticking up on the dashboard: \"#agent · 1 completed · 100% pass.\"

**Voiceover:**
> \"Claude makes five real decisions per commitment:
>
> 1. Turning your fuzzy goal into a verifiable criterion at creation time.
> 2. Coaching you mid-commitment via x402-metered chat — one cent per message, paid in USDC out of a prepaid balance.
> 3. Reading your evidence — text, URL, or screenshot via vision.
> 4. Signing the on-chain `complete()` or `reject()` from the evaluator wallet.
> 5. Anchoring the verdict as ERC-8004 reputation feedback.
>
> The evaluator is not a chat bot. It's an on-chain economic actor. It can refuse to settle a bad submission. It puts its keccak256 reasoning on Arc forever.\"

---

## §4 — Circle stack + the ERC-8004 wedge (2:30–3:30)

**Visual cue:** stack diagram — Arc → USDC → Circle Wallets → ERC-8183 AgenticCommerce → ERC-8004 IdentityRegistry → ReputationRegistry → x402-metered coach.

**Voiceover:**
> \"We wired up eight pieces of the Circle / Arc stack:
>
> 1. Arc testnet as settlement.
> 2. USDC as the stake asset.
> 3. Circle Dev-Controlled Wallets for one-click onboarding — no seed phrase.
> 4. ERC-8183 reference contract for the job lifecycle.
> 5. ERC-8004 IdentityRegistry — every user is a minted agent NFT.
> 6. ERC-8004 ReputationRegistry — every settled commitment is a permanent feedback event.
> 7. x402-style metered AI coach — prepaid balance, instant debits.
> 8. StakeWordVault — Foundry-tested, opt-in USYC routing for season-end yield distribution.
>
> One detail worth pausing on: **we're the only self-contract ERC-8183 project in the cohort, anchored to ERC-8004 reputation**. Circle's own flagship sample, \`arc-escrow\`, doesn't use ERC-8183. The Most Novel score is built from this combination.\"

---

## §5 — Traction + 7-day plan (3:30–4:00)

**Visual cue:** the public `/leaderboard` page — live counts of in-flight stakes, completion rate, total USDC pooled.

**Voiceover (be honest):**
> \"As of this video, we have N real commitments live on Arc, X USDC pooled, NN% completion rate so far.
>
> Our cold-start audience isn't generic 'people who want to be more productive' — it's the 400 builders in this hackathon's Discord. Every team here is shipping under deadline pressure. That is StakeWord's product.
>
> Next seven days: deploy the vault to mainnet, get USYC allowlisted, launch a Twitter challenge with the people in this room, and ship to a hundred users.\"

---

## Demo cue sheet (for the screen recording)

| Time | Window | Action |
|---|---|---|
| 0:00 | Browser | Cold-open `/app` (fresh incognito) |
| 0:08 | Browser | Copy wallet address |
| 0:10 | New tab | Circle faucet, paste, click \"Send\" |
| 0:18 | Back to `/app` | Refresh — balance ticks |
| 0:22 | Browser | Click **Create commitment** |
| 0:26 | Browser | Form pre-fill, click Submit |
| 0:30 | Browser | 5-tick progress timeline animates |
| 0:50 | Browser | Auto-redirect to commitment detail |
| 0:55 | Cut | Static infographic for §2 |
| 1:30 | Browser | Commitment detail, scroll to ProofSubmissionForm |
| 1:40 | Drop screenshot, type caption, submit |
| 2:00 | Browser | Verdict + tx links appear |
| 2:10 | Browser | Reputation badge ticks |
| 2:30 | Cut | Stack diagram for §4 |
| 3:30 | Browser | `/leaderboard` page |

## Tools

- **Screen recorder:** OBS at 1920×1080, 30fps, segment per section.
- **Voiceover:** record after the visual is locked. Don't try to do them simultaneously.
- **Editor:** anything that does scrubbing well — DaVinci Resolve free is fine.
- **Speed up:** post-process the on-chain tx confirmations to 1.5× — Arc is fast but \"watching it fill\" needs to feel snappy.

## What NOT to do in this video

- Don't read out loud from the README. The README is the README; the video is the video.
- Don't show any code unless it directly demonstrates the on-chain action. Code on screen ≠ judging signal.
- Don't pad to hit 5 minutes. 4:00 with everything shown is better than 5:00 with filler.
- Don't promise things we don't have. Talk about Vault as deployed-ready, not deployed.
