# StakeWord

StakeWord is an AI-powered self-contract protocol built on ERC-8183.

Users stake USDC on their own goals. The user is both the `client` and `provider`, while Claude acts as the on-chain `evaluator`: coaching progress, verifying evidence, and completing jobs through the ERC-8183 `AgenticCommerce` contract.

## What It Does

- Creates goal commitments as ERC-8183 jobs on Arc testnet
- Uses Circle Dev-Controlled Wallets for user accounts
- Locks USDC as commitment stake
- Routes pooled funds through a protocol vault for USYC yield
- Charges Claude coaching / verification calls through x402 micropayments
- Redistributes failed stakes and pooled yield to users who complete their commitments

## Core Stack

- **Chain:** Arc testnet
- **Contract:** `AgenticCommerce` ERC-8183 reference implementation
- **Wallets:** Circle Dev-Controlled Wallets
- **Assets:** USDC + USYC
- **AI:** Anthropic Claude API, including vision verification
- **Payments:** x402 for metered AI coaching
- **App:** Next.js + Tailwind CSS

## Environment

Copy the template and edit your real RPC URL (never commit `.env`; it stays gitignored).

```sh
cp .env.example .env
```

```env
RPC_URL=your_arc_rpc_url_here
```

For Next.js you can copy to `.env.local` instead if you prefer that convention.

Use `RPC_URL` only on the **server** (do not expose it via `NEXT_PUBLIC_*` unless you intend to publish the endpoint).

### In code

**viem**

```ts
import { http } from "viem";

const transport = http(process.env.RPC_URL!);
// pass transport into createPublicClient({ chain: yourArcChain, transport })
```

**ethers v6**

```ts
import { JsonRpcProvider } from "ethers";

new JsonRpcProvider(process.env.RPC_URL!);
```

**web3.py**

```python
import os
from web3 import Web3

Web3(Web3.HTTPProvider(os.environ["RPC_URL"]))
```