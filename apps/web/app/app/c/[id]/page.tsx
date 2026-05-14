import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { CoachChat } from "@/components/CoachChat";
import { Pill } from "@/components/Pill";
import { ProofSubmissionForm } from "@/components/ProofSubmissionForm";
import { getDb } from "@/lib/db/client";
import { commitments, proofs } from "@/lib/db/schema";
import { currentSession } from "@/lib/session";
import { AGENTIC_COMMERCE_CONTRACT, ARC_TESTNET_EXPLORER } from "@/lib/chain/constants";
import { getJob } from "@/lib/chain/client";
import { formatUsdc } from "@/lib/chain/client";

export const dynamic = "force-dynamic";

interface PageCtx {
  params: Promise<{ id: string }>;
}

export default async function CommitmentDetail({ params }: PageCtx) {
  const { id } = await params;
  const session = await currentSession();
  const db = getDb();
  const commitment = db
    .select()
    .from(commitments)
    .where(and(eq(commitments.id, id), eq(commitments.sessionId, session.id)))
    .get();
  if (!commitment) notFound();

  const proofList = db
    .select()
    .from(proofs)
    .where(eq(proofs.commitmentId, id))
    .orderBy(desc(proofs.createdAt))
    .all();

  let onChainBudget: string | null = null;
  let onChainStatus: string | null = null;
  if (commitment.jobId != null) {
    try {
      const job = await getJob(BigInt(commitment.jobId));
      onChainBudget = formatUsdc(job.budget);
      onChainStatus = job.status;
    } catch {
      onChainStatus = "(read error)";
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="mb-2 flex items-center gap-3">
          <Pill tone="mono">job #{commitment.jobId ?? "—"}</Pill>
          <Pill tone={commitment.status === "completed" ? "status" : "mono"}>
            {commitment.status}
          </Pill>
          {onChainStatus && (
            <span className="font-mono text-[12px] text-text-muted">
              on-chain: {onChainStatus}
            </span>
          )}
        </div>
        <h1 className="m-0 max-w-[680px] font-display text-[40px] leading-[1.05] tracking-[-0.02em]">
          {commitment.goal}
        </h1>
        <p className="mt-3 max-w-[720px] text-text-muted">{commitment.criteria}</p>
        <div className="mt-4 flex flex-wrap gap-3 font-mono text-[12px] text-text-muted">
          <span>stake: ${(Number(commitment.stakeUsdcBaseUnits) / 1_000_000).toFixed(2)}</span>
          {onChainBudget && <span>· on-chain budget: {onChainBudget} USDC</span>}
          <span>· due {new Date(commitment.expiresAt * 1000).toLocaleString()}</span>
        </div>
        {commitment.jobId != null && (
          <a
            href={`${ARC_TESTNET_EXPLORER}/address/${AGENTIC_COMMERCE_CONTRACT}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block font-mono text-[12px] underline-offset-4 hover:underline"
          >
            View AgenticCommerce contract →
          </a>
        )}
      </header>

      {commitment.status === "funded" && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="m-0 text-[22px] font-bold tracking-[-0.015em]">Submit proof</h2>
            <p className="mb-5 mt-1 text-[14px] text-text-muted">
              Claude evaluates against your criteria. If she says <strong>pass</strong>,
              we submit + complete on-chain. If <strong>fail</strong>, the job is
              rejected. <strong>needs-more</strong> means try again with stronger
              evidence — no on-chain action yet.
            </p>
            <ProofSubmissionForm commitmentId={commitment.id} />
          </section>
          <CoachChat commitmentId={commitment.id} />
        </div>
      )}

      <section>
        <h2 className="m-0 text-[22px] font-bold tracking-[-0.015em]">Proof history</h2>
        {proofList.length === 0 ? (
          <p className="mt-3 text-text-muted">No proofs yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {proofList.map((p) => (
              <li
                key={p.id}
                className="rounded-[20px] border border-line bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] ${
                      p.verdict === "pass"
                        ? "bg-primary/20 text-primary-deep"
                        : p.verdict === "fail"
                          ? "bg-danger/20 text-danger"
                          : "bg-warning/20 text-ink"
                    }`}
                  >
                    {p.verdict ?? "pending"}
                  </span>
                  <time className="font-mono text-[12px] text-text-muted">
                    {p.createdAt.toLocaleString()}
                  </time>
                </div>
                {p.reasoning && (
                  <p className="mt-3 text-[14px] leading-[1.5]">{p.reasoning}</p>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-[12px] text-text-muted">
                    Raw evidence ({p.contentType})
                  </summary>
                  <pre className="mt-2 max-h-60 overflow-auto rounded-[12px] bg-mist p-3 font-mono text-[11px]">
                    {p.contentType === "image-base64"
                      ? `(${p.content.length} bytes base64)`
                      : p.content}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
