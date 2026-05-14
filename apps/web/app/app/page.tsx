import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ButtonLink } from "@/components/Button";
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
          <div className="flex justify-between">
            <span className="text-text-muted">Wallet</span>
            <a
              className="font-bold underline-offset-4 hover:underline"
              href={`${ARC_TESTNET_EXPLORER}/address/${session.walletAddress ?? ""}`}
              target="_blank"
              rel="noreferrer"
            >
              {shorten(session.walletAddress)}
            </a>
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
          <form action="/api/fund-evaluator" method="post" className="pt-3">
            <input type="hidden" name="amount" value="0.5" />
            <button
              type="submit"
              formAction="/api/fund-evaluator?amount=0.5"
              className="w-full rounded-full border border-line bg-card px-3 py-2 text-[12px] font-bold hover:bg-paper"
            >
              Send 0.5 USDC for evaluator gas
            </button>
          </form>
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
          <p className="rounded-[22px] border border-dashed border-line p-8 text-center text-text-muted">
            Nothing here yet. Create your first commitment to lock USDC against a
            real deadline.
          </p>
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
