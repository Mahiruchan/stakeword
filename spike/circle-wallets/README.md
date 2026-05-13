# Spike 3 · Circle Dev-Controlled Wallets on Arc testnet

Minimal pattern proving you can create + list Circle wallets on Arc with the
official SDK. StakeWord uses this to auto-provision a wallet per user (no
seed-phrase UX, no key custody — Circle holds them via Entity Secret).

## Setup

1. https://console.circle.com → sign up (free for testnet)
2. Keys → Create a key → **API key → Standard Key** → copy
3. Register Entity Secret: https://developers.circle.com/wallets/dev-controlled/register-entity-secret
4. `cp .env.example .env` and paste both

```powershell
cd spike/circle-wallets
npm install
npm run typecheck
npm run wallets:create     # prints walletSetId + 2 addresses; copy walletSetId into .env
npm run wallets:list       # prints addresses with USDC balances
```

## Why two wallets per user

In StakeWord's ERC-8183 model:
- **wallet[0]** = `client` (user funds escrow with USDC)
- **wallet[1]** = `provider` (user submits deliverable hash — could be same address; modelled separate so the audit trail is clear)

The **`evaluator`** field on each ERC-8183 job is the Claude oracle wallet,
which is a single platform-controlled wallet shared by everyone (one per env,
not per user).

## Production handoff

When StakeWord ships:
- A new user signing up triggers `createWallets` exactly once
- We store `walletId` (uuid) in Supabase, NOT the address (addresses are
  cheap to re-fetch; ids are the API key)
- All transaction calls use `walletId` (the SDK v10 prefers ID over address)
