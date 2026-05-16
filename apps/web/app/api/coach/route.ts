import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { currentSession } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { coachBalance, coachMessages, commitments } from "@/lib/db/schema";
import { coachChat, type ChatMessage } from "@/lib/llm/chat";

export const runtime = "nodejs";

const COST_PER_CALL_BASE_UNITS = 10000n; // 0.01 USDC, 6 decimals
const HISTORY_LIMIT = 30;

const Input = z.object({
  commitmentId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

export async function POST(req: Request): Promise<NextResponse> {
  const session = await currentSession();
  const body = await req.json().catch(() => null);
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed" }, { status: 400 });
  }

  const db = getDb();
  const commitment = db
    .select()
    .from(commitments)
    .where(
      and(eq(commitments.id, parsed.data.commitmentId), eq(commitments.sessionId, session.id)),
    )
    .get();
  if (!commitment) return NextResponse.json({ error: "commitment not found" }, { status: 404 });

  // Atomic debit. Serializing within a SQLite transaction prevents the
  // double-click race (two concurrent POSTs both passing a read-only balance
  // check, then both decrementing). If two requests arrive at once, one
  // commits the decrement and the other re-reads and short-circuits.
  const debited = db.transaction((tx) => {
    const row = tx
      .select()
      .from(coachBalance)
      .where(eq(coachBalance.sessionId, session.id))
      .get();
    const available = row ? BigInt(row.balanceBaseUnits) : 0n;
    if (available < COST_PER_CALL_BASE_UNITS) return null;
    const newBalance = available - COST_PER_CALL_BASE_UNITS;
    const newSpent =
      (row ? BigInt(row.totalSpentBaseUnits) : 0n) + COST_PER_CALL_BASE_UNITS;
    const newCallsCount = (row?.callsCount ?? 0) + 1;
    tx.update(coachBalance)
      .set({
        balanceBaseUnits: newBalance.toString(),
        totalSpentBaseUnits: newSpent.toString(),
        callsCount: newCallsCount,
        updatedAt: new Date(),
      })
      .where(eq(coachBalance.sessionId, session.id))
      .run();
    return { newBalance, newSpent, newCallsCount, prior: available };
  });

  if (!debited) {
    const current = db
      .select()
      .from(coachBalance)
      .where(eq(coachBalance.sessionId, session.id))
      .get();
    return NextResponse.json(
      {
        error: "insufficient_balance",
        message: "Top up the coach balance — calls cost 0.01 USDC each.",
        currentBalanceBaseUnits: current?.balanceBaseUnits ?? "0",
        costBaseUnits: COST_PER_CALL_BASE_UNITS.toString(),
      },
      { status: 402 },
    );
  }

  // Load conversation history (post-debit so it can't influence the charge)
  const history = db
    .select()
    .from(coachMessages)
    .where(
      and(
        eq(coachMessages.sessionId, session.id),
        eq(coachMessages.commitmentId, parsed.data.commitmentId),
      ),
    )
    .orderBy(asc(coachMessages.createdAt))
    .all();

  const historyForLlm: ChatMessage[] = history
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content }));

  db.insert(coachMessages)
    .values({
      id: nanoid(),
      sessionId: session.id,
      commitmentId: parsed.data.commitmentId,
      role: "user",
      content: parsed.data.message,
      costBaseUnits: "0",
    })
    .run();

  // Call the model. Refund on failure since we already debited.
  let reply: string;
  try {
    reply = await coachChat({
      criteria: commitment.criteria,
      history: historyForLlm,
      userMessage: parsed.data.message,
    });
  } catch (err) {
    const refunded = debited.prior;
    db.update(coachBalance)
      .set({
        balanceBaseUnits: refunded.toString(),
        totalSpentBaseUnits: (
          BigInt(debited.newSpent) - COST_PER_CALL_BASE_UNITS
        ).toString(),
        callsCount: debited.newCallsCount - 1,
        updatedAt: new Date(),
      })
      .where(eq(coachBalance.sessionId, session.id))
      .run();
    const message = err instanceof Error ? err.message : "coach call failed";
    return NextResponse.json({ error: "llm_failed", message }, { status: 502 });
  }

  const newBalance = debited.newBalance;
  const newSpent = debited.newSpent;
  const newCallsCount = debited.newCallsCount;

  db.insert(coachMessages)
    .values({
      id: nanoid(),
      sessionId: session.id,
      commitmentId: parsed.data.commitmentId,
      role: "assistant",
      content: reply,
      costBaseUnits: COST_PER_CALL_BASE_UNITS.toString(),
    })
    .run();

  return NextResponse.json({
    reply,
    balanceBaseUnits: newBalance.toString(),
    totalSpentBaseUnits: newSpent.toString(),
    callsCount: newCallsCount,
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  const session = await currentSession();
  const url = new URL(req.url);
  const commitmentId = url.searchParams.get("commitmentId");
  if (!commitmentId) return NextResponse.json({ error: "commitmentId required" }, { status: 400 });

  const db = getDb();
  const balance = db
    .select()
    .from(coachBalance)
    .where(eq(coachBalance.sessionId, session.id))
    .get();
  const messages = db
    .select()
    .from(coachMessages)
    .where(
      and(
        eq(coachMessages.sessionId, session.id),
        eq(coachMessages.commitmentId, commitmentId),
      ),
    )
    .orderBy(asc(coachMessages.createdAt))
    .all();
  return NextResponse.json({
    balance: balance ?? {
      balanceBaseUnits: "0",
      totalSpentBaseUnits: "0",
      callsCount: 0,
    },
    messages,
  });
}
