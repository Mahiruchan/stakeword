import { Pill } from "./Pill";

export function ProofUploaderPreview() {
  return (
    <div
      id="proof"
      className="mt-4 grid grid-cols-[1fr_auto] items-center gap-[14px] rounded-[20px] border border-proof/28 bg-proof/[0.11] p-4"
    >
      <div>
        <h4 className="m-0 text-paper">Proof uploader</h4>
        <p className="mt-[5px] text-[13px] text-text-dim">
          Drop screenshots, repo links, and demo URLs. Claude checks them against
          the original terms.
        </p>
      </div>
      <Pill tone="info">vision ready</Pill>
    </div>
  );
}
