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
 * Called from scripts/generate-corpus.mts (once, at corpus-build time) and
 * from app/api/generate (live, for Try It Yourself).
 */
export const GENERATION_MODEL_ID = "gemini-pro-latest";

export async function generateFollowUp(context: MeetingContext): Promise<GeneratedFollowUp> {
  const { output } = await generateText({
    model: google(GENERATION_MODEL_ID),
    output: Output.object({ schema: generatedFollowUpSchema }),
    prompt: buildPrompt(context),
  });
  return output;
}
