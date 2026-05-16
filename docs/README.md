# docs/

Where to find things. Each file is self-contained — read top-down or jump in.

| File | What's in it | Read it when… |
|---|---|---|
| [PLAN.md](./PLAN.md) | Current development plan. Product positioning, user flow, four key design decisions (ERC-8183 container, USYC protocol vault, x402 coach, hackathon-builder traction), risks & mitigations, 12-day timeline, rubric self-check. | You want to understand why the product is shaped the way it is. |
| [PLAN_zh.md](./PLAN_zh.md) | Same plan in Chinese (the original v1 framing). | Reading the bilingual evolution; the canonical version is PLAN.md. |
| [RESEARCH.md](./RESEARCH.md) | Evidence backing every plan decision: 15 years of behavior-betting product history (Beeminder, Stickk, Pact, Yotta, …), why USYC's allowlist gate forced the protocol-vault pivot, and spike-by-spike verification of ERC-8183 / x402 / Circle Wallets liveness. | You want the receipts for any claim in PLAN.md. |
| [PITCH.md](./PITCH.md) | 5-section pitch video script (cold open → inversion → Claude as evaluator → Circle stack + ERC-8004 wedge → traction + 7-day plan) plus a per-second demo cue sheet. | You're about to record the submission video, or you want to see the founder narrative. |
| [JUDGES.md](./JUDGES.md) | Rubric mapping. For each of the four weighted dimensions (Agentic 30 / Traction 30 / Circle Tools 20 / Innovation 20) — exactly where in the code and UI to verify the claim. | You're evaluating this submission. |
| [CHECKLIST.md](./CHECKLIST.md) | State of every feature — what's live-tested, what's only coded, what's not done. Three tiers, with the verification receipt for each Tier 1 row. | You want to know what works before recording a demo or shipping. |
| [Agora_Hackthon_Requirements.md](./Agora_Hackthon_Requirements.md) | Verbatim copy of the official Agora hackathon requirements doc the organizers handed out. | You want to verify what the rules actually say. |
| [erc8004/ERC-8004.md](./erc8004/ERC-8004.md) | Full text of the ERC-8004 EIP cached locally. Identity + Reputation + Validation registries. | You're reviewing how StakeWord uses ERC-8004 and want the source spec. |

## Other docs in the repo

- [`../README.md`](../README.md) — product overview + run instructions
- [`../DESIGN.md`](../DESIGN.md) — full design system (tokens, components, page patterns)
- [`../design-preview.html`](../design-preview.html) — static visual mockup of the landing + dashboard
- [`../apps/web/README.md`](../apps/web/README.md) — Next.js app structure, route map, dev guide
- [`../contracts/README.md`](../contracts/README.md) — Foundry project: `StakeWordVault.sol` build/test/deploy
- [`../spike/README.md`](../spike/README.md) — standalone proofs-of-concept (ERC-8183 lifecycle, x402 dance, Circle Wallets, USYC feasibility, Circle bootstrap)
