# contracts

`StakeWordVault` — protocol-owned vault that books per-commitment USDC stakes,
routes pooled funds through Circle's USYC Teller (once allowlisted), and
redistributes failed principal + accrued yield to successful completers at
season close.

## Build & test

```sh
cd contracts
forge install foundry-rs/forge-std --no-commit
forge build
forge test -vvv
```

The test suite uses a `MockUSDC` (`IERC20`) and covers:

- deposit booking + double-record guard
- settleCompleted refunds principal
- settleFailed parks funds in the vault for redistribution
- distributeToWinner sends to a completer
- access control (keeper/owner gates)
- season advancement

## Deploy to Arc testnet

```sh
forge script script/Deploy.s.sol \
  --rpc-url arc-testnet \
  --broadcast \
  --verify \
  --verifier-url https://testnet.arcscan.app/api \
  -vvvv
```

Required env (loaded from project root `.env`):

```
ARC_RPC_URL=...
USDC_ADDRESS=0x3600000000000000000000000000000000000000
KEEPER_ADDRESS=<platform evaluator wallet address>
DEPLOYER_PRIVATE_KEY=<funded testnet key>
ARCSCAN_API_KEY=<arcscan key for verify>
```

## Why USYC is opt-in

The vault accepts an optional `IUSYCTeller` (`setTeller(address)`). USYC requires
a Circle allowlist on the vault address — typically 24–48h after filing a ticket.
Until that lands, leave `teller == address(0)`: deposits stay as plain USDC and
the rest of the protocol works unchanged. Once allowlisted, the owner sets the
Teller and subsequent deposits convert to USYC automatically.

## Integration with the web app

After deploy:

1. Set `STAKEWORD_VAULT_ADDRESS=<address>` in `apps/web/.env`
2. Update the evaluator service to call `recordDeposit(commitmentId, staker, amount)`
   after each `ERC-8183 fund()` confirmation
3. Settle via `settleCompleted` / `settleFailed` whenever the evaluator decides
4. At season close, off-chain bookkeeping calls `distributeToWinner` per
   successful completer

The vault is intentionally dumb about distribution math (the share formula
varies per season); the keeper computes shares and posts payouts one by one.
