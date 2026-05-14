# StakeWord Design System

## Overview

StakeWord should feel like a **commitment desk for builders**: part on-chain control room, part personal accountability coach. The product is not a generic wellness tracker and not a traditional fintech transfer app. It is where a user turns an intention into an ERC-8183 job, stakes USDC, lets Claude evaluate proof, and accepts public on-chain consequences.

The visual direction is **sharp builder fintech**: calm enough to trust with money, opinionated enough to feel native to hackathon shipping culture. Use a dark graphite foundation, acid green commitment accents, warm paper cards, and precise timeline/status components. The interface should make every goal feel like a signed mission with a visible chain of proof.

**Key characteristics:**
- Acid green primary action for staking, submitting proof, and completed states.
- Graphite / ink surfaces for on-chain seriousness and evaluator confidence.
- Warm off-white cards for forms, dashboards, and proof review.
- Large condensed display typography for the “ship or pay” brand voice.
- Rounded but not soft shapes: 18-28 px cards, 999 px pills, crisp 1 px borders.
- Signature components built around commitments: job cards, stake vault, evaluator timeline, proof uploader, and x402 coach meter.

## Colors

### Brand & Accent
- **Commit Green** (`{colors.primary}` — `#B6FF4D`): Primary CTA, active commitment states, success highlights.
- **Commit Green Hover** (`{colors.primary-hover}` — `#D7FF89`): Hover and active fills.
- **Commit Green Deep** (`{colors.primary-deep}` — `#355F00`): Text on pale green surfaces.
- **Proof Blue** (`{colors.proof}` — `#52D7FF`): Claude evaluator, proof, and x402 activity.
- **Signal Violet** (`{colors.signal}` — `#8B5CF6`): Optional accent for AI reasoning, hashes, and advanced states.

### Surface
- **Graphite** (`{colors.graphite}` — `#10130F`): Main dark canvas and footer surface.
- **Ink** (`{colors.ink}` — `#171A14`): Primary text on light surfaces.
- **Paper** (`{colors.paper}` — `#F7F3E8`): Main light canvas.
- **Card** (`{colors.card}` — `#FFFDF5`): Card interiors and forms.
- **Mist** (`{colors.mist}` — `#E7EAD9`): Secondary surfaces, dividers, and quiet panels.
- **Line** (`{colors.line}` — `#D7DBC8`): Hairline borders on light surfaces.

### Text
- **Text Primary** (`{colors.text}` — `#171A14`): Main copy on light surfaces.
- **Text Secondary** (`{colors.text-muted}` — `#62685A`): Descriptions, metadata, helper copy.
- **Text Inverse** (`{colors.text-inverse}` — `#F7F3E8`): Main copy on graphite surfaces.
- **Text Dim** (`{colors.text-dim}` — `#B9BEAA`): Muted copy on dark surfaces.

### Semantic
- **Success** (`{colors.success}` — `#34D66B`): Completed commitments and verified proof.
- **Warning** (`{colors.warning}` — `#FFD166`): Deadlines, low progress, pending evaluator review.
- **Danger** (`{colors.danger}` — `#FF5C5C`): Failed commitments, rejected proofs, destructive actions.
- **Info** (`{colors.info}` — `#52D7FF`): x402 payments, Claude activity, chain status.

## Typography

### Font Family
Use accessible open-source fonts:

1. **Archivo Black** for large display headlines and short section titles. It gives the product a bold “ship now” voice without feeling playful.
2. **Instrument Sans** for body text, UI labels, form controls, tables, and dense dashboards.
3. **IBM Plex Mono** for addresses, hashes, job IDs, x402 amounts, and chain metadata.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---:|---:|---:|---:|---|
| `{typography.display-hero}` | 84px | 900 | 0.92 | -0.025em | Landing hero headline |
| `{typography.display-lg}` | 56px | 900 | 0.96 | -0.02em | Section headline |
| `{typography.display-md}` | 36px | 900 | 1.05 | -0.015em | Card headline / dashboard stat |
| `{typography.title}` | 24px | 700 | 1.2 | -0.01em | Panel title |
| `{typography.body-lg}` | 20px | 500 | 1.5 | 0 | Lead paragraph |
| `{typography.body}` | 16px | 500 | 1.5 | 0 | Default copy |
| `{typography.body-sm}` | 14px | 500 | 1.45 | 0 | Supporting copy |
| `{typography.caption}` | 12px | 700 | 1.3 | 0.06em | Labels, badges, metadata |
| `{typography.mono}` | 13px | 600 | 1.4 | 0 | Hashes, addresses, job IDs |

### Principles
- Headlines should be short and forceful: “Stake on shipping”, “Proof or payout”, “Claude signs the result”.
- Keep display letter spacing only slightly tight. `Archivo Black` becomes crowded below `-0.03em`.
- Use mono sparingly but visibly for the on-chain layer.
- Avoid long centered paragraphs. StakeWord should read like a command surface, not a blog.

## Layout

### Spacing System
- **Base unit:** 4 px.
- **Tokens:** `{spacing.xs}` 4 px · `{spacing.sm}` 8 px · `{spacing.md}` 12 px · `{spacing.lg}` 16 px · `{spacing.xl}` 24 px · `{spacing.2xl}` 32 px · `{spacing.3xl}` 48 px · `{spacing.4xl}` 72 px.
- **Section padding:** 72-96 px desktop, 40-56 px mobile.
- **Card padding:** 20-32 px depending on density.

### Grid & Container
- Marketing container maxes at 1180 px.
- Hero uses a split layout: promise + CTA on the left, live commitment builder on the right.
- Product dashboard uses a 12-column grid:
  - 7 columns for commitment timeline and proof flow.
  - 5 columns for vault, evaluator, and x402 meter.
- Mobile stacks in this order: hero, commitment builder, stats, timeline, vault, proof.

### Responsive Strategy

| Name | Width | Key Changes |
|---|---:|---|
| Mobile | < 768px | Single column, hero headline 48-56 px, sticky bottom CTA optional |
| Tablet | 768-1023px | Two-column cards, dashboard panels stack by priority |
| Desktop | ≥ 1024px | Full split hero and 12-column dashboard |

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Level 0 | Flat surface, no shadow | Page bands |
| Level 1 | 1 px border + soft card contrast | Forms, cards, tables |
| Level 2 | Border + 16 px soft shadow | Active commitment builder, proof review |
| Level 3 | Dark surface + glow accent | Hero, evaluator status, completed state |

Depth should come from contrast, borders, and one restrained glow. Avoid glassmorphism and generic purple gradients.

## Shapes

| Token | Value | Use |
|---|---:|---|
| `{rounded.sm}` | 10px | Inputs, small chips |
| `{rounded.md}` | 16px | Dense dashboard cards |
| `{rounded.lg}` | 22px | Standard panels |
| `{rounded.xl}` | 28px | Hero cards, main commitment builder |
| `{rounded.pill}` | 999px | Badges, CTAs, status chips |

## Components

### Buttons

**`button-primary`**
- Commit Green fill, Ink text, 999 px radius, 14-16 px semibold label.
- Use for “Create commitment”, “Stake USDC”, “Submit proof”.

**`button-secondary`**
- Card or graphite surface, 1 px border, high-contrast text.
- Use for “View job”, “Read plan”, “Open vault”.

**`button-danger`**
- Danger fill or outline, only for irreversible actions like cancel/reject.

### Signature Cards

**`commitment-builder-card`**
- Main creation surface. Contains goal prompt, stake amount, deadline, evaluator, and generated ERC-8183 job preview.

**`stake-job-card`**
- Compact job summary with status, stake, deadline, job ID, and current progress.

**`vault-card`**
- Shows pooled USDC, USYC yield mode, completer pool, and season distribution rule.

**`evaluator-card`**
- Claude status, latest decision, reason hash, and “complete(jobId, reasonHash)” activity.

**`proof-uploader`**
- Evidence drop zone with image/link/text modes and clear verification state.

**`x402-meter`**
- Small metered-service panel showing coach calls, verification charges, and cumulative USDC paid.

**`job-timeline`**
- Vertical or horizontal progress tracker:
  Open → Funded → Submitted → Completed / Rejected / Expired.

### Badges

**`badge-funded`**
- Warning or Info surface, used while funds are locked.

**`badge-completed`**
- Commit Green surface, used for completed commitments and verified evidence.

**`badge-risk`**
- Danger surface, used for missed deadlines, rejected evidence, or low confidence.

**`badge-chain`**
- Mono label for Arc, ERC-8183, job IDs, hashes, and wallet addresses.

## Page Patterns

### Landing Page
- Hero: “Stake on shipping. Claude verifies on-chain.”
- Right-side live commitment builder.
- Three proof points: ERC-8183 jobs, protocol vault, x402 metered coach.
- Social proof area for hackathon builders and live staking stats.

### App Dashboard
- Active commitment card at the top.
- Timeline and proof upload as the main workflow.
- Vault and x402 meter as side panels.
- Public profile module showing completed jobs and credibility history.

### Commitment Detail
- Job ID and chain metadata visible but not overwhelming.
- Claude evaluator decision area should feel like a signed report.
- Settlement state should be visually decisive: completed, failed, or expired.

## Motion

- Use a restrained page-load sequence: hero text, builder card, stats.
- Commitment state changes should animate with a short 180-240 ms slide/fade.
- Completed states can use a single green pulse or glow.
- Avoid excessive animated blobs; motion should reinforce progress and proof.

## Do's and Don'ts

### Do
- Make the staking action feel serious and explicit.
- Show the ERC-8183 job lifecycle visually.
- Use mono labels for chain proof and payment metadata.
- Keep Claude visible as an evaluator, not just a chatbot.
- Use green for commitment action and completion.

### Don't
- Do not copy Wise-specific language, fonts, or currency converter patterns.
- Do not make the product look like a generic wellness habit tracker.
- Do not hide risk, failure, or settlement mechanics behind vague UI.
- Do not overuse AI-purple gradients.
- Do not make proof upload feel like an afterthought; it is a core action.

## Preview

See `design-preview.html` for a static landing/dashboard preview using this visual direction.
