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

  // Charge prepaid balance up front
  const balance = db
    .select()
    .from(coachBalance)
    .where(eq(coachBalance.sessionId, session.id))
    .get();
  const available = balance ? BigInt(balance.balanceBaseUnits) : 0n;
  if (available < COST_PER_CALL_BASE_UNITS) {
    return NextResponse.json(
      {
        error: "insufficient_balance",
        message: "Top up the coach balance — calls cost 0.01 USDC each.",
        currentBalanceBaseUnits: available.toString(),
        costBaseUnits: COST_PER_CALL_BASE_UNITS.toString(),
      },
      { status: 402 },
    );
  }

  // Load conversation history
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

  // Persist user message immediately
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

  // Call the model
  const reply = await coachChat({
    criteria: commitment.criteria,
    history: historyForLlm,
    userMessage: parsed.data.message,
  });

  // Debit + record assistant message atomically (single-threaded sqlite, OK)
  const newBalance = available - COST_PER_CALL_BASE_UNITS;
  const newSpent = (balance ? BigInt(balance.totalSpentBaseUnits) : 0n) + COST_PER_CALL_BASE_UNITS;
  const newCallsCount = (balance?.callsCount ?? 0) + 1;
  db.update(coachBalance)
    .set({
      balanceBaseUnits: newBalance.toString(),
      totalSpentBaseUnits: newSpent.toString(),
      callsCount: newCallsCount,
      updatedAt: new Date(),
    })
    .where(eq(coachBalance.sessionId, session.id))
    .run();

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
