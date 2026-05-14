"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProofMode = "text" | "url" | "image-base64";

interface SubmitResult {
  verdict: "pass" | "fail" | "needs-more";
  reasoning: string;
  onChain: { submitTx: string; settleTx: string } | null;
  onChainError?: string;
}

interface Props {
  commitmentId: string;
}

export function ProofSubmissionForm({ commitmentId }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<ProofMode>("text");
  const [content, setContent] = useState("");
  const [caption, setCaption] = useState("");
  const [imageMediaType, setImageMediaType] = useState<"image/png" | "image/jpeg" | "image/webp">(
    "image/png",
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError(`Unsupported image type: ${file.type}`);
      return;
    }
    setImageMediaType(file.type as typeof imageMediaType);
    const buf = await file.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    setContent(b64);
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    const body =
      mode === "image-base64"
        ? { contentType: mode, content, mediaType: imageMediaType, caption }
        : { contentType: mode, content };
    try {
      const res = await fetch(`/api/commitments/${commitmentId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as SubmitResult & { error?: string; details?: string };
      if (!res.ok && !json.verdict) {
        setError(json.details ?? json.error ?? "Submission failed");
      }
      setResult(json);
      // refresh server data on the page (will pick up status change)
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["text", "url", "image-base64"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setContent("");
            }}
            className={`rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] ${
              mode === m
                ? "border-ink bg-ink text-paper"
                : "border-line bg-card text-text-muted"
            }`}
          >
            {m === "image-base64" ? "screenshot" : m}
          </button>
        ))}
      </div>

      {mode === "text" && (
        <textarea
          required
          rows={5}
          maxLength={10000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste evidence text: PR description, log excerpt, count of commits, etc."
          className="w-full rounded-[18px] border border-line bg-card p-4 focus:border-primary focus:outline-none"
        />
      )}

      {mode === "url" && (
        <input
          required
          type="url"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="https://github.com/you/repo/pull/42 or https://demo.example.com"
          className="w-full rounded-[18px] border border-line bg-card px-4 py-3 focus:border-primary focus:outline-none"
        />
      )}

      {mode === "image-base64" && (
        <div className="space-y-3">
          <input
            required
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFileChange}
            className="block w-full text-[14px] file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-[12px] file:font-bold file:text-paper hover:file:bg-graphite-soft"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="One-line caption: what does this screenshot show?"
            className="w-full rounded-[18px] border border-line bg-card px-4 py-3 focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {error && (
        <div className="rounded-[18px] border border-danger/40 bg-danger/10 p-4 text-[14px] text-danger">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-[22px] border border-line bg-paper p-5">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.06em] ${
                result.verdict === "pass"
                  ? "bg-primary/20 text-primary-deep"
                  : result.verdict === "fail"
                    ? "bg-danger/20 text-danger"
                    : "bg-warning/20 text-ink"
              }`}
            >
              Claude: {result.verdict}
            </span>
          </div>
          <p className="mt-3 text-[14px] leading-[1.5]">{result.reasoning}</p>
          {result.onChain && (
            <div className="mt-3 space-y-1 text-[12px] font-mono">
              <a className="block underline" href={result.onChain.submitTx} target="_blank" rel="noreferrer">
                submit() tx →
              </a>
              <a className="block underline" href={result.onChain.settleTx} target="_blank" rel="noreferrer">
                {result.verdict === "pass" ? "complete()" : "reject()"} tx →
              </a>
            </div>
          )}
          {result.onChainError && (
            <p className="mt-3 text-[12px] text-danger">on-chain error: {result.onChainError}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || content.length === 0}
        className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-primary px-6 text-[15px] font-extrabold text-ink shadow-[var(--shadow-button-primary)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Asking Claude…" : "Submit proof"}
      </button>
    </form>
  );
}
