import { z } from "zod";

const schema = z.object({
  CIRCLE_API_KEY: z.string().min(10),
  CIRCLE_ENTITY_SECRET: z.string().length(64),

  // The evaluator (Claude oracle) wallet — created once at bootstrap, persisted in DB.
  // If present in env, app uses this; otherwise app falls back to the row in `system_state`.
  EVALUATOR_WALLET_ID: z.string().optional(),
  EVALUATOR_WALLET_ADDRESS: z.string().optional(),

  ARC_RPC_URL: z.string().url(),

  LLM_API_KEY: z.string().min(10),
  LLM_BASE_URL: z.string().url(),
  LLM_MODEL: z.string().default("kimi-k2.6"),

  DATABASE_URL: z.string().default("file:./stakeword.db"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`,
    );
  }
  cached = parsed.data;
  return cached;
}
