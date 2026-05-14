import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";

let cached: Anthropic | undefined;

export function anthropic(): Anthropic {
  if (cached) return cached;
  const { LLM_API_KEY, LLM_BASE_URL } = env();
  cached = new Anthropic({
    apiKey: LLM_API_KEY,
    baseURL: LLM_BASE_URL,
  });
  return cached;
}

export function modelId(): string {
  return env().LLM_MODEL;
}

/** Pull the first text block out of a multi-block content response. */
export function firstText(
  blocks: ReadonlyArray<{ type: string; text?: string }>,
): string {
  for (const b of blocks) {
    if (b.type === "text" && typeof b.text === "string") return b.text;
  }
  return "";
}
