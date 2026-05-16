import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// MVP: one wallet per session, no real auth. Session id sits in a cookie.
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  walletId: text("wallet_id"),
  walletAddress: text("wallet_address"),
  // ERC-8004 Identity Registry agentId (= ERC-721 tokenId). Null until the user
  // funds their first commitment, at which point the platform mints them an
  // agent identity. All subsequent feedback events accrue against this id.
  erc8004AgentId: text("erc_8004_agent_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type CommitmentStatus =
  | "draft" // created in DB, no on-chain job yet
  | "open" // createJob done, budget not yet set
  | "funded" // budget set, USDC funded
  | "submitted" // proof submitted via submit(deliverableHash)
  | "completed" // evaluator called complete()
  | "rejected"
  | "expired";

export const commitments = sqliteTable("commitments", {
  id: text("id").primaryKey(), // nanoid
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),

  // Natural-language commitment text
  goal: text("goal").notNull(),
  criteria: text("criteria").notNull(),

  // Stake amount in USDC base units (6 decimals → "5.00" stored as "5000000")
  stakeUsdcBaseUnits: text("stake_usdc_base_units").notNull(),

  // On-chain mapping (null until createJob has confirmed)
  jobId: integer("job_id"),
  clientWalletId: text("client_wallet_id"),
  clientAddress: text("client_address"),
  providerWalletId: text("provider_wallet_id"),
  providerAddress: text("provider_address"),

  // Final hashes recorded once submitted / completed
  deliverableHash: text("deliverable_hash"),
  reasonHash: text("reason_hash"),

  status: text("status").$type<CommitmentStatus>().notNull().default("draft"),

  // Deadline (unix seconds)
  expiresAt: integer("expires_at").notNull(),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const proofs = sqliteTable("proofs", {
  id: text("id").primaryKey(),
  commitmentId: text("commitment_id")
    .notNull()
    .references(() => commitments.id),
  // Either a public URL or a base64 image kept inline for MVP. Real impl: object store.
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // 'url' | 'text' | 'image-base64'

  // Claude's verdict and structured reasoning
  verdict: text("verdict").$type<"pass" | "fail" | "needs-more">(),
  reasoning: text("reasoning"),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Global singleton: evaluator wallet bootstrap, etc.
export const systemState = sqliteTable("system_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * x402-style prepaid coach balance.
 *
 * Production x402 flow: each AI call returns 402, client signs an EIP-3009
 * authorization, server settles via facilitator. We compress that into one real
 * tx per session — user tops up, internal debit per call. Same economic model,
 * better UX. The real x402 dance ships once Circle Gateway publishes a
 * facilitator on Arc.
 */
export const coachBalance = sqliteTable("coach_balance", {
  sessionId: text("session_id")
    .primaryKey()
    .references(() => sessions.id),
  /** Remaining prepaid USDC in base units (6 decimals). */
  balanceBaseUnits: text("balance_base_units").notNull().default("0"),
  /** Cumulative spent since session start. */
  totalSpentBaseUnits: text("total_spent_base_units").notNull().default("0"),
  callsCount: integer("calls_count").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const coachMessages = sqliteTable("coach_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  commitmentId: text("commitment_id").references(() => commitments.id),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  costBaseUnits: text("cost_base_units").notNull().default("0"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Session = typeof sessions.$inferSelect;
export type Commitment = typeof commitments.$inferSelect;
export type CommitmentInsert = typeof commitments.$inferInsert;
export type Proof = typeof proofs.$inferSelect;
export type CoachBalance = typeof coachBalance.$inferSelect;
export type CoachMessage = typeof coachMessages.$inferSelect;
