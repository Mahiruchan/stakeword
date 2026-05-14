import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { currentSession } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { commitments } from "@/lib/db/schema";
import { getEvaluatorWallet } from "@/lib/evaluator";
import {
  onChainCreateJob,
  onChainSetBudget,
  onChainApproveUsdc,
  onChainFund,
  usdcAmountToBaseUnits,
} from "@/lib/actions";

export const runtime = "nodejs";

const CreateInput = z.object({
  goal: z.string().min(3).max(500),
  criteria: z.string().min(3).max(1000),
  stakeUsdc: z.string().regex(/^\d+(\.\d{1,6})?$/),
  expiresAt: z.number().int().positive(),
});

interface StreamEvent {
  step:
    | "validated"
    | "draft-saved"
    | "createjob:pending"
    | "createjob:done"
    | "setbudget:pending"
    | "setbudget:done"
    | "approve:pending"
    | "approve:done"
    | "fund:pending"
    | "fund:done"
    | "complete"
    | "error";
  data?: Record<string, unknown>;
}

export async function POST(req: Request): Promise<Response> {
  const session = await currentSession();
  if (!session.walletId || !session.walletAddress) {
    return NextResponse.json({ error: "session has no wallet" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = CreateInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const evaluator = await getEvaluatorWallet();
  const db = getDb();
  const id = nanoid();
  const stakeBase = usdcAmountToBaseUnits(input.stakeUsdc);
  const walletId = session.walletId;
  const walletAddress = session.walletAddress as `0x${string}`;

  // NDJSON stream — each line is a self-contained event.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (e: StreamEvent): void => {
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      };

      try {
        emit({ step: "validated", data: { id } });

        db.insert(commitments)
          .values({
            id,
            sessionId: session.id,
            goal: input.goal,
            criteria: input.criteria,
            stakeUsdcBaseUnits: stakeBase.toString(),
            status: "draft",
            expiresAt: input.expiresAt,
            clientWalletId: walletId,
            clientAddress: walletAddress,
            providerWalletId: walletId,
            providerAddress: walletAddress,
          })
          .run();
        emit({ step: "draft-saved", data: { id } });

        emit({ step: "createjob:pending" });
        const created = await onChainCreateJob({
          clientWalletId: walletId,
          clientAddress: walletAddress,
          providerAddress: walletAddress,
          evaluatorAddress: evaluator.address,
          expiredAtUnix: input.expiresAt,
          description: `${input.goal}\n\nCriteria: ${input.criteria}`,
        });
        db.update(commitments)
          .set({ jobId: Number(created.jobId), status: "open", updatedAt: new Date() })
          .where(eq(commitments.id, id))
          .run();
        emit({
          step: "createjob:done",
          data: {
            jobId: Number(created.jobId),
            txHash: created.txHash,
            explorer: created.explorer,
          },
        });

        emit({ step: "setbudget:pending" });
        const setBudget = await onChainSetBudget({
          providerWalletId: walletId,
          jobId: created.jobId,
          amountUsdcBaseUnits: stakeBase,
        });
        emit({ step: "setbudget:done", data: setBudget });

        emit({ step: "approve:pending" });
        const approve = await onChainApproveUsdc({
          clientWalletId: walletId,
          amountUsdcBaseUnits: stakeBase,
        });
        emit({ step: "approve:done", data: approve });

        emit({ step: "fund:pending" });
        const fund = await onChainFund({
          clientWalletId: walletId,
          jobId: created.jobId,
        });
        db.update(commitments)
          .set({ status: "funded", updatedAt: new Date() })
          .where(eq(commitments.id, id))
          .run();
        emit({ step: "fund:done", data: fund });

        emit({ step: "complete", data: { id, jobId: Number(created.jobId) } });
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        emit({ step: "error", data: { message } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET(): Promise<NextResponse> {
  const session = await currentSession();
  const db = getDb();
  const rows = db
    .select()
    .from(commitments)
    .where(eq(commitments.sessionId, session.id))
    .orderBy(desc(commitments.createdAt))
    .all();
  return NextResponse.json({ commitments: rows });
}
