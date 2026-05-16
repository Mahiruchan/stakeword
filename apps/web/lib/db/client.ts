import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { env } from "../env";
import * as schema from "./schema";

let cached: BetterSQLite3Database<typeof schema> | undefined;

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (cached) return cached;
  const fileURL = env().DATABASE_URL;
  const filePath = fileURL.startsWith("file:") ? fileURL.slice("file:".length) : fileURL;
  const sqlite = new Database(filePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  cached = drizzle(sqlite, { schema });
  return cached;
}
