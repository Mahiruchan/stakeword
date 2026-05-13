# USYC feasibility research

> Verdict: **USYC cannot be exposed directly to retail users in StakeWord**, even on
> testnet. The PLAN's "users earn USYC yield during the lock" wording must be
> rewritten. A workable substitute is a **protocol-owned USYC vault** that
> earns yield off all locked USDC and redistributes that yield to *completers*.

## Citations (from the synced context-arc repo)

### Mandatory allowlist gate

`~/.arc-canteen/context/docs/docs.arc.network/arc/references/contract-addresses.md`:

> USYC is only accessible to **institutions outside the United States**, subject to
> eligibility restrictions and a **\$100,000 USD minimum investment**.
> See USYC Document Certification Requirements for more information.

> **Getting testnet USYC:**
> 1. Obtain testnet USDC from the Circle Faucet
> 2. **Request allowlisting by opening a ticket** with your wallet address.
>    Requests are typically processed in **24–48 hours**.
> 3. Once approved, call the USYC Teller contract or interact with the USYC
>    Portal to deposit testnet USDC and receive testnet USYC.

So both mainnet and testnet require human review per address.

### Contracts on Arc testnet

| Contract | Address |
|---|---|
| USYC | `0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C` (verified live, 6 decimals) |
| Entitlements | `0xcc205224862c7641930c87679e98999d23c26113` (allowlist gate) |
| Teller | `0x9fdF14c5B14173D74C08Af27AebFf39240dC105A` (mint/redeem) |

Liveness confirmed by `spike/erc8183 npm run verify`.

## What this kills in the PLAN

The original PLAN positions USYC as:

- *"Locked funds earn via USYC yield, turning punitive mechanics into incentive mechanics"*
- *"Innovation 20%: ... USYC生息 ..."*
- *"On lock, funds move into USYC automatically"*
- *"On successful verification → redeem USYC → return principal + yield"*

All four of those assume each user can hold USYC. They can't:

- Retail user picks up the app → wallet has no allowlist
- The deposit flow would fail at the Entitlements check
- Even granting them a 48-hour review window is a non-starter for a 2-week
  hackathon

## Workable substitute: protocol-owned vault

Have **one allowlisted vault address** (you/teammate self-attest, file the
ticket, wait the 48h once) that holds the pooled USDC and converts to USYC.

```
              ┌─────────────────────────────────────────────────┐
              │              StakeWord Protocol                  │
              │                                                  │
   user───────┼─USDC─→ EscrowVault ──pool──→ USYC ──yield ──→ Pool
              │           │                                  │
              │           │ on completion:                   │
              │           ↓                                  │
              │       redeem(principal) + bonus  ←───────────┘
              │           │
              │           ↓
   user ←─USDC + share-of-yield ───┘
              │
              └─────────────────────────────────────────────────┘
```

### Concrete contract sketch

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 { function transfer(address,uint256) external returns (bool); function transferFrom(address,address,uint256) external returns (bool); function approve(address,uint256) external returns (bool); function balanceOf(address) external view returns (uint256); }
interface IUSYC is IERC20 {}
interface IUSYCTeller {
    function deposit(uint256 usdcAmount) external returns (uint256 usycMinted);
    function redeem(uint256 usycAmount) external returns (uint256 usdcReturned);
}

contract StakeWordVault {
    IERC20    public immutable usdc;
    IUSYC     public immutable usyc;
    IUSYCTeller public immutable teller;
    address   public immutable evaluator;

    struct Commitment {
        address user;
        uint256 principal;       // USDC locked
        uint256 usycShares;      // USYC backing this commitment
        uint64  expiresAt;
        bytes32 termsHash;       // keccak256(commitment text + criteria)
        bool    resolved;
    }
    Commitment[] public commitments;

    /// User locks USDC. Vault buys USYC immediately.
    function commit(uint256 amount, uint64 expiresAt, bytes32 termsHash) external returns (uint256 id) {
        usdc.transferFrom(msg.sender, address(this), amount);
        usdc.approve(address(teller), amount);
        uint256 shares = teller.deposit(amount);
        id = commitments.length;
        commitments.push(Commitment(msg.sender, amount, shares, expiresAt, termsHash, false));
    }

    /// Evaluator (Claude oracle) decides success or failure.
    /// Success: redeem principal + share of accrued yield (proportional to time held).
    /// Failure: principal goes to the "winners' pool" — vault keeps it as USYC and
    /// distributes pro-rata to successful commitments at season end.
    function resolve(uint256 id, bool success) external {
        require(msg.sender == evaluator, "not evaluator");
        Commitment storage c = commitments[id];
        require(!c.resolved, "already resolved");
        c.resolved = true;
        if (success) {
            uint256 usdcBack = teller.redeem(c.usycShares);
            usdc.transfer(c.user, usdcBack);  // principal + yield
        }
        // failure: shares stay in vault → winners share later
    }
}
```

(This is a sketch. Real version needs accounting for pro-rata yield, season
boundaries, and re-entrancy guards. ERC-4626 vault patterns apply.)

### Narrative wins

The "winners share losers' yield" frame is **strictly more interesting** than the
original "you keep your own yield":

- Inverts the punishment metaphor — your failure literally **bankrolls others' success**
- Creates organic social pressure to complete (your friends are betting that you won't)
- Twitter-friendly: *"I just made $0.43 because Dave didn't finish his deadlift challenge."*
- Removes the **only** load-bearing claim about USYC from the user surface area
  — they never see USYC, they only see USDC in/out

## Action items

| When | Task |
|---|---|
| Today | File USYC testnet allowlist ticket for **one** address (vault owner key). Wait 24–48h. |
| Day +2 | Stand up `StakeWordVault` skeleton on Arc testnet; mock `IUSYCTeller` while waiting for allowlist. |
| Day +3 | Wire real Teller calls; smoke-test deposit/redeem against allowlisted vault. |
| PR | Rewrite PLAN section "Module 4: 链上资金管理" and "Why USYC" to use vault framing. |

## Fallback if allowlist doesn't come through in time

Hold pooled USDC in vault, accrue "fake yield" off a non-USYC source
(Aave-equivalent, or zero yield + just-the-losers-fund-winners model). Drop
the "USYC" name from the pitch. **Innovation score drops marginally** but
nothing else breaks — the inverted-yield narrative still holds because the
losers' pool funds the winners.

## Bottom line

The PLAN's "Innovation 20%" wedge as written is **non-shippable in 2 weeks**.
The proposed substitute keeps the punishment-to-yield inversion, adds a
sharper social story, and gracefully degrades if USYC allowlisting stalls.
