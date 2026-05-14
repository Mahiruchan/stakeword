import { anthropic, firstText, modelId } from "./client";

const COACH_SYSTEM = `You are StakeWord's no-nonsense accountability coach.
A user has staked USDC on a personal commitment. You help them turn a vague goal into a verifiable contract, then nudge them on progress.

Rules:
- Be terse. Builders ship; they don't read essays.
- Push back on vague goals: ask for a measurable deliverable, a deadline, and an evidence format.
- Never agree to a commitment that has no way to be verified.
- When refining a commitment, output BOTH:
  1. A short rewritten "criteria" (1-3 sentences, specific, third-person, verifiable).
  2. A "coach_response" — what you say back to the user, max 60 words.
`;

export interface RefineRequest {
  goal: string;
  history: ReadonlyArray<{ role: "user" | "assistant"; text: string }>;
}

export interface RefineResponse {
  criteria: string;
  coachResponse: string;
}

export async function refineCommitment(req: RefineRequest): Promise<RefineResponse> {
  const userMessage = `Goal candidate: ${req.goal}

Past turns:
${req.history.map((h) => `${h.role}: ${h.text}`).join("\n") || "(none)"}

Return JSON only, exactly:
{ "criteria": "...", "coach_response": "..." }`;

  const response = await anthropic().messages.create({
    model: modelId(),
    max_tokens: 600,
    system: COACH_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = firstText(response.content);
  const trimmed = stripCodeFence(text);
  const parsed = safeJson(trimmed);
  return {
    criteria: typeof parsed.criteria === "string" ? parsed.criteria : "",
    coachResponse:
      typeof parsed.coach_response === "string" ? parsed.coach_response : text.trim(),
  };
}

function stripCodeFence(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function safeJson(s: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
