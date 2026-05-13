# Agora Agents Hackathon — Requirements & Reference

> Canteen × Circle × Arc · Online · May 11–25, 2026

---

## Overview

Build AI agents that **trade, invest, create, and interface with markets**, settled instantly on Arc with USDC. Apply at [agora.thecanteenapp.com](https://agora.thecanteenapp.com) using passphrase **`SITEx1313`** on Luma.

**Why Arc:** ~$0.01/tx in USDC · sub-second deterministic finality · no volatile gas tokens.

---

## Getting Started

1. Join [Canteen Discord](https://discord.gg/TGnyfKh23V) — introduce yourself
2. Join [Arc Builder Discord](https://discord.com/invite/buildonarc) — mention Canteen + Agora
3. Install Arc CLI: `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`
4. Docs: [arc-node.thecanteenapp.com](https://arc-node.thecanteenapp.com)

**Submit:** live demo · founder pitch video · public GitHub repo · traction data (users, volume)

---

## Prizes — $50k Total

| Tier | Amount | Teams |
|------|--------|-------|
| 1st place | $10,000 | 1 |
| 2nd place | $7,500 × 2 | 2 |
| 3rd place | $5,000 × 3 | 3 |
| Standout | ~$650–750 each · $7,500 total | 10–12 |
| Developer feedback | $500 | — |
| Easter eggs / side quests | $2,000 | — |

---

## Judging Criteria

| Weight | Dimension | What judges look for |
|--------|-----------|----------------------|
| **30%** | Agentic Sophistication | Full autonomy > meaningful agency > AI-flavored automation |
| **30%** | Traction | Real users, real transactions, real volume during the 2-week window |
| **20%** | Circle Tool Usage | Creative use of Wallets, CCTP, Gateway, App Kit, Contracts, USYC, USDC |
| **20%** | Innovation | Novel approaches, emergent behavior, new territory |

> "The best projects tend to break the rules."

---

## Circle / Arc Tech Stack

| Tool | Use Case |
|------|----------|
| **CCTP** | Cross-chain USDC transfers — arbitrage, collateral rebalancing |
| **Gateway** | Unified USDC balance, <500ms cross-chain — multi-venue trading |
| **Nanopayments** | Gas-free USDC payments down to $0.000001 via Gateway |
| **Wallets** | Embedded secure wallets for autonomous agents |
| **Contracts** | Position management, liquidation protection, escrow logic |
| **Paymaster** | Pay gas in USDC — no volatile tokens |
| **USYC** | Tokenized money market fund — park idle capital, yield between trades |
| **USDC / EURC** | Native settlement, multi-currency markets |
| **App Kit** | Drop-in Bridge / Swap / Send / Unified Balance components |

Docs: [docs.arc.network](https://docs.arc.network) · [developers.circle.com](https://developers.circle.com)

---

## RFBs (Requests for Builders)

> Not tracks — just validated problem spaces. Build what you care about most.

### RFB 01 — Perpetual Futures Trading Agent
24/7 leverage management across Hyperliquid, dYdX, GMX, Vertex. Arc as settlement chain.  
**AI decides:** leverage level, stop-loss/take-profit, funding rate arb, liquidation protection.  
**Metrics:** active traders, volume, PnL/Sharpe, AUM.

### RFB 02 — Prediction Market Trader Intelligence
Find +EV bets by synthesizing news, data, sentiment at speed. Size positions with Kelly Criterion.  
**AI decides:** mispriced probabilities, bet sizing, hedge timing, source credibility weighting.  
**Metrics:** accuracy rate, volume wagered, documented returns.

### RFB 03 — Prediction Market Verticals
Launch markets that don't exist yet — macro, geopolitics, institutional hedging, USDC↔EURC FX.  
**Build:** market creation tools, oracle integrations, automated liquidity provisioning.  
**Metrics:** markets created, liquidity provided, resolution accuracy, volume per market.

### RFB 04 — Adaptive Portfolio Manager
Constant rebalancing, regime detection, tax-loss harvesting — cross-chain.  
**AI decides:** risk-on/off allocation, USYC yield parking, harvest timing, diversification.  
**Metrics:** users, AUM, returns vs benchmark, rebalancing frequency.

### RFB 05 — Cross-Platform Arbitrage Agent
Detect price discrepancies across CEXs/DEXs before they vanish. Route via CCTP. Survive slippage.  
**AI decides:** real arb vs noise, trade sizing, bridge route, post-cost profitability.  
**Metrics:** opportunities captured, total profit, execution time, success rate.

### RFB 06 — Social Trading Intelligence
AI selects, weights, and monitors traders to copy — not blind mirroring.  
**AI decides:** which traders to follow, capital allocation, strategy degradation signals.  
**Metrics:** leaders/followers, AUM copied, performance vs leader, follower retention.

---

## Research Hooks

| # | Hook | Ties to |
|---|------|---------|
| 1 | Trading-R1 — reasoning trace as the product, hash on Arc | RFB 06 |
| 2 | Polymarket Builder Codes — agent earns USDC per fill | RFB 02 |
| 3 | NFI blacklist as rugpull oracle → instant prediction market | RFB 03 |
| 4 | Translation as alpha — pay translators per fill in USDC | RFB 03 |
| 5 | HL whale migration index token, auto-rebalanced via Gateway | RFB 04 / 06 |
| 6 | Slash-bonded leaderboard copy-trading via Arc smart contract | RFB 06 |

---

## Sample Apps (Fork-Ready)

- [arc-commerce](https://github.com/circlefin/arc-commerce) — USDC credit payments  
- [arc-multichain-wallet](https://github.com/circlefin/arc-multichain-wallet) — unified balance  
- [arc-escrow](https://github.com/circlefin/arc-escrow) — AI-powered work + USDC settlement  
- [arc-fintech](https://github.com/circlefin/arc-fintech) — multichain treasury  
- [arc-p2p-payments](https://github.com/circlefin/arc-p2p-payments) — gasless P2P payments