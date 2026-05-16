"use client";

import { useState } from "react";

interface Props {
  address: string;
  label?: string;
  className?: string;
}

export function CopyAddressButton({ address, label = "Copy address", className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore — secure-context only */
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`rounded-full border border-line bg-card px-3 py-1 text-[11px] font-bold transition hover:bg-paper ${className}`}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
