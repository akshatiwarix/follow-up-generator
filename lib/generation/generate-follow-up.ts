import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { generatedFollowUpSchema, type GeneratedFollowUp, type MeetingContext } from "@/lib/domain";
import { buildPrompt } from "./prompt";

/**
 * The one live dependency in this repo. Direct Google provider (not the
 * Vercel AI Gateway — AI Gateway requires a credit card on file even for its
 * free monthly credits, which this build deliberately avoids). Needs
 * GOOGLE_GENERATIVE_AI_API_KEY in the environment, a free key from
 * https://aistudio.google.com/apikey — see PLAN.md § Deployment plan.
 * Flash tier specifically: the free-tier key's Pro-tier quota is 0 requests.
 * Called from scripts/generate-corpus.mts (once, at corpus-build time) and
 * from app/api/generate (live, for Try It Yourself).
 */
export const GENERATION_MODEL_ID = "gemini-3.5-flash";

export async function generateFollowUp(context: MeetingContext): Promise<GeneratedFollowUp> {
  const { output } = await generateText({
    model: google(GENERATION_MODEL_ID),
    output: Output.object({ schema: generatedFollowUpSchema }),
    prompt: buildPrompt(context),
    // The free tier occasionally returns a transient 503 ("high demand");
    // the AI SDK's own backoff needs more room than its 2-retry default.
    maxRetries: 5,
  });
  return output;
}
