import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { sessions, type Session } from "./db/schema";
import { createUserWallet } from "./circle/wallets";

const COOKIE_NAME = "sw_sid";

/**
 * Returns the current session, lazily creating the row + Circle wallet on first
 * access. Middleware ensures the cookie is already present so this function
 * never mutates cookies — safe to call from Server Components.
 */
export async function currentSession(): Promise<Session> {
  const jar = await cookies();
  const id = jar.get(COOKIE_NAME)?.value;
  if (!id) {
    throw new Error(
      "Session cookie missing. Middleware should have set it — check matcher in middleware.ts.",
    );
  }
  const db = getDb();
  const existing = db.select().from(sessions).where(eq(sessions.id, id)).get();
  if (existing) return existing;

  const wallet = await createUserWallet(`StakeWord session ${id.slice(0, 8)}`);
  const row: Session = {
    id,
    walletId: wallet.walletId,
    walletAddress: wallet.address,
    createdAt: new Date(),
  };
  db.insert(sessions).values(row).run();
  return row;
}
