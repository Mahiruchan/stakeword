import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { Nav } from "@/components/Nav";
import { Pill } from "@/components/Pill";
import { Stat } from "@/components/Stat";
import { getDb } from "@/lib/db/client";
import { commitments } from "@/lib/db/schema";
import { ARC_TESTNET_EXPLORER } from "@/lib/chain/constants";

export const dynamic = "force-dynamic";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

interface PageCtx {
  params: Promise<{ address: string }>;
}

function shorten(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function fmtStake(baseUnits: string): string {
  return `$${(Number(baseUnits) / 1_000_000).toFixed(2)}`;
}

export default async function PublicProfile({ params }: PageCtx) {
  const { address } = await params;
  if (!ADDRESS_RE.test(address)) notFound();
  const normalized = address.toLowerCase();
  const db = getDb();
  // Match either case-form against the stored address.
  const rows = db
    .select()
    .from(commitments)
    .all()
    .filter((c) => (c.clientAddress ?? "").toLowerCase() === normalized);
  rows.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));

  const completed = rows.filter((c) => c.status === "completed").length;
  const failed = rows.filter((c) => c.status === "rejected" || c.status === "expired").length;
  const inflight = rows.filter(
    (c) => c.status === "open" || c.status === "funded" || c.status === "submitted",
  ).length;
  const settled = completed + failed;
  const passRate = settled === 0 ? null : Math.round((completed / settled) * 100);
  const totalStaked = rows.reduce(
    (acc, c) => acc + BigInt(c.stakeUsdcBaseUnits),
    0n,
  );

  return (
    <main className="min-h-screen bg-paper">
      <Nav />
      <Container className="pb-20 pt-10">
        <header className="mb-8 grid gap-4 rounded-[28px] border border-line bg-card p-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="rounded-full bg-mist px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
              StakeWord builder · ERC-8004 agent
            </span>
            <h1 className="mt-3 font-mono text-[24px] tracking-[-0.015em]">
              {shorten(address)}
            </h1>
            <p className="mt-2 text-text-muted">
              Every commitment below is a real ERC-8183 job on Arc testnet. Receipts are
              public and permanent — no rewrites possible.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
              <a
                className="rounded-full border border-line bg-paper px-3 py-1 font-mono hover:bg-mist"
                href={`${ARC_TESTNET_EXPLORER}/address/${address}`}
                target="_blank"
                rel="noreferrer"
              >
                arcscan →
              </a>
              <a
                className="rounded-full border border-line bg-paper px-3 py-1 font-mono hover:bg-mist"
                href={`${ARC_TESTNET_EXPLORER}/address/0x8004B663056A597Dffe9eCcC1965A193B7388713`}
                target="_blank"
                rel="noreferrer"
              >
                ERC-8004 ReputationRegistry →
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat value={String(completed)} label="Completed" />
            <Stat
              value={passRate === null ? "—" : `${passRate}%`}
              label="Pass rate"
            />
            <Stat value={String(inflight)} label="In-flight" />
            <Stat value={fmtStake(totalStaked.toString())} label="Total staked" />
          </div>
        </header>

        <section>
          <h2 className="m-0 text-[20px] font-bold tracking-[-0.015em]">
            Commitment history
          </h2>
          {rows.length === 0 ? (
            <p className="mt-3 rounded-[18px] border border-dashed border-line p-6 text-center text-text-muted">
              This address has no StakeWord commitments yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {rows.map((c) => (
                <li
                  key={c.id}
                  className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-[20px] border border-line bg-card p-5"
                >
                  <div>
                    <p className="m-0 text-[16px] font-bold">{c.goal}</p>
                    <p className="mt-1 text-[12px] text-text-muted">{c.criteria}</p>
                    <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-text-muted">
                      <span>job #{c.jobId ?? "—"}</span>
                      <span>·</span>
                      <span>stake {fmtStake(c.stakeUsdcBaseUnits)}</span>
                      <span>·</span>
                      <span>{c.updatedAt?.toLocaleDateString()}</span>
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
      </Container>
    </main>
  );
}
