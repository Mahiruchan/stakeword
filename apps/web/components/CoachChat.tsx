"use client";

import { useEffect, useRef, useState } from "react";

interface CoachMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  costBaseUnits: string;
  createdAt: string;
}

interface BalanceView {
  balanceBaseUnits: string;
  totalSpentBaseUnits: string;
  callsCount: number;
}

interface InitialGet {
  balance: BalanceView;
  messages: CoachMessageView[];
}

interface Props {
  commitmentId: string;
}

function formatBalance(baseUnits: string): string {
  return `$${(Number(baseUnits) / 1_000_000).toFixed(4)}`;
}

export function CoachChat({ commitmentId }: Props) {
  const [messages, setMessages] = useState<ReadonlyArray<CoachMessageView>>([]);
  const [balance, setBalance] = useState<BalanceView>({
    balanceBaseUnits: "0",
    totalSpentBaseUnits: "0",
    callsCount: 0,
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const res = await fetch(`/api/coach?commitmentId=${encodeURIComponent(commitmentId)}`);
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as InitialGet;
      if (cancelled) return;
      setMessages(data.messages);
      setBalance(data.balance);
    };
    load().catch(() => {
      /* ignore */
    });
    return () => {
      cancelled = true;
    };
  }, [commitmentId]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [messages]);

  const onTopup = async (amount: string): Promise<void> => {
    setError(null);
    setToppingUp(true);
    try {
      const res = await fetch("/api/coach/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string; credited?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Top-up failed");
        return;
      }
      // Refresh balance
      const next = await fetch(`/api/coach?commitmentId=${encodeURIComponent(commitmentId)}`);
      if (next.ok) {
        const data = (await next.json()) as InitialGet;
        setBalance(data.balance);
      }
    } finally {
      setToppingUp(false);
    }
  };

  const onSend = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!input.trim()) return;
    setError(null);
    setBusy(true);

    const draftId = `local-${Date.now()}`;
    const localUser: CoachMessageView = {
      id: draftId,
      role: "user",
      content: input,
      costBaseUnits: "0",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, localUser]);
    const sent = input;
    setInput("");

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitmentId, message: sent }),
      });
      const body = (await res.json()) as
        | { reply: string; balanceBaseUnits: string; totalSpentBaseUnits: string; callsCount: number }
        | { error: string; message?: string };

      if (!res.ok || !("reply" in body)) {
        const errBody = body as { error: string; message?: string };
        setError(errBody.message ?? errBody.error);
        setBusy(false);
        return;
      }
      const reply = body as Extract<typeof body, { reply: string }>;
      const asstMessage: CoachMessageView = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: reply.reply,
        costBaseUnits: "10000",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, asstMessage]);
      setBalance({
        balanceBaseUnits: reply.balanceBaseUnits,
        totalSpentBaseUnits: reply.totalSpentBaseUnits,
        callsCount: reply.callsCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusy(false);
    }
  };

  const lowBalance = BigInt(balance.balanceBaseUnits) < 10000n; // < 1 call

  return (
    <section className="rounded-[24px] border border-line bg-card p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-[18px] font-bold tracking-[-0.01em]">x402 coach</h3>
          <p className="m-0 text-[12px] text-text-muted">$0.01 USDC per message</p>
        </div>
        <div className="text-right font-mono text-[12px]">
          <div>balance {formatBalance(balance.balanceBaseUnits)}</div>
          <div className="text-text-muted">
            {balance.callsCount} calls · spent {formatBalance(balance.totalSpentBaseUnits)}
          </div>
        </div>
      </header>

      {lowBalance && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[14px] bg-warning/15 px-3 py-2 text-[12px]">
          <span>Top up to chat with the coach.</span>
          {(["0.05", "0.20", "1.00"] as const).map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={toppingUp}
              onClick={() => onTopup(amt)}
              className="rounded-full border border-line bg-card px-3 py-1 font-bold disabled:opacity-60"
            >
              +{amt} USDC
            </button>
          ))}
        </div>
      )}

      <div
        ref={feedRef}
        className="mb-3 h-72 overflow-y-auto rounded-[16px] bg-paper/70 p-3 text-[13px]"
      >
        {messages.length === 0 ? (
          <p className="m-0 text-text-muted">
            Say hi. The coach reads your commitment criteria and will push back on vague plans.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`mb-2 max-w-[85%] rounded-[14px] px-3 py-2 ${
                m.role === "user"
                  ? "ml-auto bg-ink text-paper"
                  : "bg-card border border-line"
              }`}
            >
              <p className="m-0 whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && m.costBaseUnits !== "0" && (
                <span className="mt-1 block font-mono text-[10px] text-text-muted">
                  −{formatBalance(m.costBaseUnits)} via x402
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-[14px] border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}

      <form onSubmit={onSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy || lowBalance}
          placeholder={lowBalance ? "Top up first" : "Ask the coach…"}
          className="flex-1 rounded-full border border-line bg-paper px-4 py-2 text-[14px] focus:border-primary focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || lowBalance || !input.trim()}
          className="rounded-full bg-primary px-4 py-2 text-[13px] font-extrabold text-ink disabled:opacity-60"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </section>
  );
}
