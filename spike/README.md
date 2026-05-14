# spike/

Standalone proofs-of-concept that each verify a single technical risk before it landed in the production app. Every directory here is self-contained: own `package.json`, own `.env`, own README.

Run any spike with:

```sh
cd spike/<name>
npm install
# follow its README — most have an `.env.example` to copy first
```

## What's in here

| Spike | Question it answered | Result |
|---|---|---|
| [`erc8183/`](./erc8183/) | Is the AgenticCommerce ERC-8183 reference contract live on Arc testnet? Can a TS client drive the full lifecycle? | ✓ Contract at `0x0747…4583` deployed. `verify` script reads chainId/blockNumber/USDC/USYC. `read-job` script pulled real third-party jobs back. `full-lifecycle` script (needs Circle keys) drives createJob → setBudget → approve → fund → submit → complete end-to-end. |
| [`x402/`](./x402/) | Does the official `@x402/express` + `@x402/fetch` package combo actually negotiate 402 → signed payment → 200? | ✓ Locally with the included mock facilitator, `POST /coach` returns `402 Payment Required` with a valid base64-encoded x402 v2 payload. Client side signs an EIP-3009 authorization. Real settlement requires a Circle Gateway facilitator on Arc once Circle publishes one. |
| [`circle-wallets/`](./circle-wallets/) | Does the Circle Dev-Controlled Wallets SDK v10 actually create Arc-testnet SCA wallets we can program? | ✓ Two scripts: `wallets:create` (mints a wallet set + 2 SCA wallets, returns ids), `wallets:list` (prints USDC balances). Reused as `lib/circle/wallets.ts` in the production app. |
| [`circle-bootstrap/`](./circle-bootstrap/) | Can we register the Circle Entity Secret programmatically without using their Configurator UI? | ✓ One command generates a fresh 32-byte secret, encrypts with Circle's RSA public key, posts the ciphertext, downloads the recovery file. Plus an `llm-smoketest.ts` that probes Kimi-K2.6 via infini-ai's Anthropic-compatible endpoint (text + vision both confirmed working). |
| [`usyc-research/`](./usyc-research/) | Can users hold USYC directly? If not, what's the minimum-viable workaround? | **No.** USYC is allowlisted to institutions, $100K minimum, even on testnet (24–48h ticket per address). The writeup walks through the docs evidence, sketches a protocol-owned vault that holds pooled USYC on one allowlisted address while users see only USDC, and gives a graceful-degradation path if the allowlist stalls. This is what became `contracts/src/StakeWordVault.sol`. |

## How these relate to the production app

```
spike/erc8183/        →  apps/web/lib/chain/* + apps/web/lib/actions.ts
spike/circle-wallets/ →  apps/web/lib/circle/*
spike/circle-bootstrap →  one-shot dev tool, still useful for Entity Secret + LLM verification
spike/x402/           →  apps/web/app/api/coach/* (prepaid model) + future Gateway facilitator wiring
spike/usyc-research/  →  contracts/src/StakeWordVault.sol
```

Each spike is preserved as-is so reviewers can re-verify any single piece without booting the whole app.

## Why split this from the app

- Each spike has its own SDK version pinned independently (Circle SDK has churned during the hackathon, isolating helped)
- Reviewers (and future-us) can run any one in isolation without environment overlap
- Failed spikes — like the USYC allowlist path — are still useful as documented dead-ends

## Adding a new spike

```sh
mkdir spike/<name>
cd spike/<name>
npm init -y
npm install <whatever-is-being-validated>
# write a README explaining the question + how to reproduce
```

Each spike's README should answer four things in the first 20 lines:

1. What question this spike tries to answer
2. What command to run
3. What output to expect on success
4. How this relates to the production code
