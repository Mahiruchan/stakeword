import { NewCommitmentForm } from "@/components/NewCommitmentForm";

export const dynamic = "force-dynamic";

export default function NewCommitmentPage() {
  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-8">
        <h1 className="m-0 font-display text-[44px] leading-[1] tracking-[-0.025em]">
          New commitment
        </h1>
        <p className="mt-3 text-text-muted">
          Stake USDC against a specific, verifiable goal. You're both the client and the
          provider. Claude is the evaluator.
        </p>
      </header>
      <NewCommitmentForm />
    </div>
  );
}
