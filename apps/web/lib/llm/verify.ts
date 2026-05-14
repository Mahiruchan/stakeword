import { anthropic, firstText, modelId } from "./client";

const VERIFIER_SYSTEM = `You are StakeWord's evaluator.
You receive (1) the user's signed commitment criteria, and (2) submitted evidence (text, URL, or image).
You must decide whether the evidence demonstrates the criteria were met.

Rules:
- Demand specific match. If the criteria say "5 commits to repo X" and the evidence shows 3, that's fail.
- Reject vague or unverifiable evidence with "needs-more".
- Output JSON only, exactly:
  { "verdict": "pass" | "fail" | "needs-more", "reasoning": "max 80 words explaining your call" }
`;

export type ProofVerdict = "pass" | "fail" | "needs-more";

export interface VerifyResponse {
  verdict: ProofVerdict;
  reasoning: string;
}

interface VerifyTextRequest {
  criteria: string;
  evidence: string;
}

interface VerifyImageRequest {
  criteria: string;
  imageBase64: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  caption: string;
}

export async function verifyTextEvidence(
  req: VerifyTextRequest,
): Promise<VerifyResponse> {
  const user = `Commitment criteria:\n${req.criteria}\n\nEvidence:\n${req.evidence}`;
  const response = await anthropic().messages.create({
    model: modelId(),
    max_tokens: 400,
    system: VERIFIER_SYSTEM,
    messages: [{ role: "user", content: user }],
  });
  return parseVerify(firstText(response.content));
}

export async function verifyImageEvidence(
  req: VerifyImageRequest,
): Promise<VerifyResponse> {
  const response = await anthropic().messages.create({
    model: modelId(),
    max_tokens: 400,
    system: VERIFIER_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: req.mediaType, data: req.imageBase64 },
          },
          {
            type: "text",
            text: `Commitment criteria:\n${req.criteria}\n\nCaption: ${req.caption}`,
          },
        ],
      },
    ],
  });
  return parseVerify(firstText(response.content));
}

function parseVerify(text: string): VerifyResponse {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    const obj = JSON.parse(cleaned) as Partial<VerifyResponse>;
    const verdict: ProofVerdict =
      obj.verdict === "pass" || obj.verdict === "fail" || obj.verdict === "needs-more"
        ? obj.verdict
        : "needs-more";
    return {
      verdict,
      reasoning: typeof obj.reasoning === "string" ? obj.reasoning : cleaned,
    };
  } catch {
    return { verdict: "needs-more", reasoning: cleaned };
  }
}
