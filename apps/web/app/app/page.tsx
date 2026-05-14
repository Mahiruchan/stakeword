import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ButtonLink } from "@/components/Button";
import { CopyAddressButton } from "@/components/CopyAddressButton";
import { FundEvaluatorButton } from "@/components/FundEvaluatorButton";
import { Pill } from "@/components/Pill";
import { getDb } from "@/lib/db/client";
import { commitments } from "@/lib/db/schema";
import { currentSession } from "@/lib/session";
import { getUsdcBalanceForWallet } from "@/lib/circle/wallets";
import { getEvaluatorWallet } from "@/lib/evaluator";
import { ARC_TESTNET_EXPLORER } from "@/lib/chain/constants";

export const dynamic = "force-dynamic";

function shorten(address: string | null | undefined): string {
  if (!address) return "—";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatStake(baseUnits: string): string {
  const n = Number(baseUnits) / 1_000_000;
  return `$${n.toFixed(2)}`;
}

interface FirstRunChecklistProps {
  walletAddress: string | null;
  usdcBalance: string;
}

function FirstRunChecklist({ walletAddress, usdcBalance }: FirstRunChecklistProps) {
  const hasFunds = Number(usdcBalance) > 0;
  return (
    <div className="rounded-[24px] border border-dashed border-line bg-card p-8">
      <h3 className="m-0 font-display text-[22px] tracking-[-0.015em]">
        Three steps to your first commitment
      </h3>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        <li
          className={`rounded-[18px] border p-4 ${
            walletAddress
              ? "border-primary-deep/20 bg-primary/10"
              : "border-line bg-paper"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px]">1</span>
            <strong className="text-[14px]">Wallet</strong>
            {walletAddress && <span className="text-primary-deep">✓</span>}
          </div>
          <p className="mt-2 text-[12px] text-text-muted">
            Auto-provisioned via Circle Dev-Controlled Wallets on first visit.
          </p>
          {walletAddress && (
            <p className="mt-2 font-mono text-[10px] text-text-muted">
              {walletAddress.slice(0, 10)}…
            </p>
          )}
        </li>
        <li
          className={`rounded-[18px] border p-4 ${
            hasFunds ? "border-primary-deep/20 bg-primary/10" : "border-line bg-paper"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px]">2</span>
            <strong className="text-[14px]">Fund</strong>
            {hasFunds && <span className="text-primary-deep">✓</span>}
          </div>
          <p className="mt-2 text-[12px] text-text-muted">
            Drop testnet USDC onto your wallet. Free, ~30 seconds.
          </p>
          {!hasFunds && walletAddress && (
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block rounded-full bg-ink px-3 py-1 text-[11px] font-bold text-paper"
            >
              Open Circle faucet →
            </a>
          )}
        </li>
        <li className="rounded-[18px] border border-line bg-paper p-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px]">3</span>
            <strong className="text-[14px]">Stake</strong>
          </div>
          <p className="mt-2 text-[12px] text-text-muted">
            Pick a measurable goal. Lock USDC. Claude evaluates your proof when you
            submit it.
          </p>
          {hasFunds && (
            <Link
              href="/app/new"
              className="mt-2 inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-ink"
            >
              Create commitment →
            </Link>
          )}
        </li>
      </ol>
    </div>
  );
}

export default async function Dashboard() {
  const session = await currentSession();
  const evaluator = await getEvaluatorWallet();

  let balance = "0";
  if (session.walletId) {
    try {
      balance = await getUsdcBalanceForWallet(session.walletId);
    } catch {
      balance = "?";
    }
  }

  const db = getDb();
  const rows = db
    .select()
    .from(commitments)
    .where(eq(commitments.sessionId, session.id))
    .orderBy(desc(commitments.createdAt))
    .all();

  return (
    <div className="space-y-10">
      <section className="grid gap-4 rounded-[28px] border border-line bg-card p-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="m-0 font-display text-[40px] leading-[1.05] tracking-[-0.02em]">
            Your commitment desk
          </h1>
          <p className="mt-3 max-w-[520px] text-text-muted">
            Each commitment becomes an ERC-8183 job on Arc testnet. Stake USDC, ship,
            then drop proof. Claude evaluates and settles the job on-chain.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/app/new">Create commitment</ButtonLink>
            <ButtonLink href="https://faucet.circle.com" variant="secondary">
              Get testnet USDC
            </ButtonLink>
          </div>
        </div>
        <div className="space-y-3 rounded-[22px] bg-mist p-5 font-mono text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-text-muted">Wallet</span>
            <div className="flex items-center gap-2">
              <a
                className="font-bold underline-offset-4 hover:underline"
                href={`${ARC_TESTNET_EXPLORER}/address/${session.walletAddress ?? ""}`}
                target="_blank"
                rel="noreferrer"
              >
                {shorten(session.walletAddress)}
              </a>
              {session.walletAddress && (
                <CopyAddressButton address={session.walletAddress} label="Copy" />
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">USDC balance</span>
            <span className="font-bold">{balance} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Evaluator</span>
            <a
              className="font-bold underline-offset-4 hover:underline"
              href={`${ARC_TESTNET_EXPLORER}/address/${evaluator.address}`}
              target="_blank"
              rel="noreferrer"
            >
              {shorten(evaluator.address)}
            </a>
          </div>
          <div className="pt-3">
            <FundEvaluatorButton amount="0.5" />
          </div>
        </div>
      </section>

      <section>
        <header className="mb-4 flex items-end justify-between">
          <h2 className="m-0 text-[28px] font-display tracking-[-0.015em]">
            Your commitments
          </h2>
          <span className="text-text-muted text-[13px]">{rows.length} total</span>
        </header>

        {rows.length === 0 ? (
          <FirstRunChecklist
            walletAddress={session.walletAddress ?? null}
            usdcBalance={balance}
          />
        ) : (
          <ul className="grid gap-3">
            {rows.map((c) => (
              <li
                key={c.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[22px] border border-line bg-card p-5"
              >
                <div>
                  <Link
                    href={`/app/c/${c.id}`}
                    className="text-[18px] font-bold hover:underline"
                  >
                    {c.goal}
                  </Link>
                  <p className="mt-1 text-[13px] text-text-muted">{c.criteria}</p>
                  <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px] text-text-muted">
                    <span>job #{c.jobId ?? "—"}</span>
                    <span>·</span>
                    <span>stake {formatStake(c.stakeUsdcBaseUnits)}</span>
                    <span>·</span>
                    <span>
                      due {new Date(c.expiresAt * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Pill tone={c.status === "completed" ? "status" : "mono"}>
                  {c.status}
                </Pill>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
