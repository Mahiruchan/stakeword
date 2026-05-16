import { anthropic, firstText, modelId } from "./client";

const SYSTEM = `You are StakeWord's accountability coach.
Context: the user has locked USDC on a specific commitment and is paying $0.01 USDC per message for your help.

Be:
- Terse. Builders ship, not read essays. Max 80 words per reply unless asked to elaborate.
- Specific. Demand a measurable next action.
- Tough. If the user is making excuses, name it once and pivot to "what's the smallest thing that proves progress today?".
- Honest about your role: you're paid per message, so don't pad replies.

When the user shares progress, reference their criteria precisely. When they share a plan, ask what evidence would prove it's done.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  criteria: string;
  history: ReadonlyArray<ChatMessage>;
  userMessage: string;
}

export async function coachChat(req: ChatRequest): Promise<string> {
  const response = await anthropic().messages.create({
    model: modelId(),
    max_tokens: 500,
    system: `${SYSTEM}\n\nUser commitment criteria:\n${req.criteria}`,
    messages: [
      ...req.history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: req.userMessage },
    ],
  });
  return firstText(response.content).trim();
}
