"use client";

import { useState } from "react";
import { CopyAddressButton } from "./CopyAddressButton";

interface Props {
  goal: string;
  stakeUsdc: string;
  jobId: number | null;
  /** Wallet that staked. Used to build the public profile URL. */
  stakerAddress: string | null;
  /** Full origin of this app, e.g. https://stakeword.app (no trailing slash). */
  origin: string;
}

const TWEET_TEMPLATE = (
  goal: string,
  stake: string,
  jobId: number | null,
  profileUrl: string,
): string => {
  const job = jobId == null ? "" : ` (ERC-8183 job #${jobId})`;
  return (
    `I just shipped a commitment on @StakeWord${job}: ` +
    `${goal} · staked ${stake} USDC on Arc testnet · settled on-chain.\n\n` +
    `Public on-chain track record: ${profileUrl}`
  );
};

export function ShareCompletion({ goal, stakeUsdc, jobId, stakerAddress, origin }: Props) {
  const [copied, setCopied] = useState(false);
  if (!stakerAddress) return null;

  const profileUrl = `${origin}/u/${stakerAddress}`;
  const tweet = TWEET_TEMPLATE(goal, stakeUsdc, jobId, profileUrl);
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;

  const onCopyTweet = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(tweet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* secure context only */
    }
  };

  return (
    <section className="rounded-[22px] border border-primary-deep/20 bg-primary/12 p-5">
      <h3 className="m-0 font-display text-[20px] tracking-[-0.015em]">
        Settled on-chain ✓
      </h3>
      <p className="mt-1 text-[13px] text-text-muted">
        Receipts are public and permanent. Cash in the credibility.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <a
          href={twitterHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[42px] items-center justify-center rounded-full bg-ink px-4 text-[13px] font-bold text-paper hover:bg-graphite-soft"
        >
          Post receipt on Twitter / X →
        </a>
        <button
          type="button"
          onClick={onCopyTweet}
          className="rounded-full border border-line bg-card px-4 text-[12px] font-bold hover:bg-paper"
        >
          {copied ? "Tweet copied ✓" : "Copy tweet"}
        </button>
        <CopyAddressButton address={profileUrl} label="Copy profile URL" />
      </div>
    </section>
  );
}
