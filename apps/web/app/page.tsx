import { ButtonLink } from "@/components/Button";
import { CommitmentBuilder } from "@/components/CommitmentBuilder";
import { Container } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { JobTimeline, type JobStep } from "@/components/JobTimeline";
import { Nav } from "@/components/Nav";
import { ProofUploaderPreview } from "@/components/ProofUploaderPreview";
import { Stat } from "@/components/Stat";
import { VaultCard, type VaultMetric } from "@/components/VaultCard";
import { X402Meter } from "@/components/X402Meter";

const HERO_STATS = [
  { value: "$2.4K", label: "Target TVL" },
  { value: "8183", label: "Job standard" },
  { value: "0.01", label: "USDC coach call" },
] as const;

const DEMO_STEPS: ReadonlyArray<JobStep> = [
  {
    state: "done",
    title: "createJob(provider=self, evaluator=ClaudeOracle)",
    description: "Commitment text generated and anchored as job description.",
    hash: "0x0747...4583",
  },
  {
    state: "done",
    title: "fund(jobId)",
    description: "USDC stake locked, vault routing enabled for the season.",
    hash: "$20 USDC",
  },
  {
    state: "pending",
    title: "submit(deliverableHash)",
    description: "Awaiting proof upload and Claude vision verification.",
    hash: "pending",
  },
  {
    state: "pending",
    title: "complete(reasonHash)",
    description: "Claude signs the outcome and completes the job on-chain.",
    hash: "Claude",
  },
];

const VAULT_METRICS: ReadonlyArray<VaultMetric> = [
  { label: "Pooled USDC", value: "$2,480" },
  { label: "Completer pool", value: "$312" },
  { label: "Season rule", value: "pro rata" },
];

export default function Home() {
  return (
    <main>
      <Nav />

      <section className="pb-[72px] pt-8">
        <Container>
          <div className="grid items-center gap-[42px] lg:grid-cols-[1.04fr_0.96fr]">
            <div>
              <Eyebrow>ERC-8183 self-contract protocol</Eyebrow>
              <h1 className="my-[26px] max-w-[680px] font-display text-[clamp(52px,8vw,88px)] leading-[0.9] tracking-[-0.025em]">
                Stake on shipping. Claude verifies on-chain.
              </h1>
              <p className="m-0 max-w-[620px] text-[20px] font-medium leading-[1.55] text-text-muted">
                Turn a hackathon goal into a funded job. You are both client and
                provider, Claude is the evaluator, and failed stakes reward the
                people who actually finish.
              </p>
              <div className="mt-8 flex flex-wrap gap-[14px]">
                <ButtonLink href="#builder">Create commitment</ButtonLink>
                <ButtonLink
                  href="https://github.com/CUinspace233/stakeword/blob/main/DESIGN.md"
                  variant="secondary"
                >
                  Read design system
                </ButtonLink>
              </div>
              <div className="mt-10 grid max-w-[620px] grid-cols-1 gap-3 sm:grid-cols-3">
                {HERO_STATS.map((s) => (
                  <Stat key={s.label} value={s.value} label={s.label} />
                ))}
              </div>
            </div>

            <CommitmentBuilder
              chainLabel="ARC 5042002"
              goal="Ship one working dapp before 5/25"
              provider="self"
              evaluator="ClaudeOracle"
              stakeUsdc="$20"
              fundHref="#flow"
            />
          </div>
        </Container>
      </section>

      <section id="flow" className="bg-graphite py-[72px] text-paper md:py-[88px]">
        <Container>
          <header className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <h2 className="m-0 max-w-[620px] font-display text-[clamp(38px,5vw,58px)] leading-[0.95] tracking-[-0.02em]">
              Every promise becomes a visible job lifecycle.
            </h2>
            <p className="m-0 max-w-[400px] font-medium leading-[1.55] text-text-dim">
              The product UI keeps the chain state, evaluator decision, vault
              economics, and coaching meter in view without turning the app into
              a block explorer.
            </p>
          </header>

          <div className="grid gap-[18px] lg:grid-cols-[1.18fr_0.82fr]">
            <div>
              <JobTimeline jobId={42} status="Funded" steps={DEMO_STEPS} />
              <ProofUploaderPreview />
            </div>

            <aside className="grid gap-[18px]">
              <VaultCard metrics={VAULT_METRICS} />
              <X402Meter pricePerCall="0.01 USDC" callsToday={148} fill={0.68} />
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}
