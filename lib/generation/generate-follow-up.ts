import { generateText, Output } from "ai";
import { generatedFollowUpSchema, type GeneratedFollowUp, type MeetingContext } from "@/lib/domain";
import { buildPrompt } from "./prompt";

/**
 * The one live dependency in this repo. Plain "provider/model" string routes
 * through the Vercel AI Gateway automatically (OIDC in production, an
 * AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN locally — see PLAN.md § Deployment
 * plan). Called from scripts/generate-corpus.mts (once, at corpus-build
 * time) and from app/api/generate (live, for Try It Yourself).
 */
export const GENERATION_MODEL = "anthropic/claude-sonnet-5";

export async function generateFollowUp(context: MeetingContext): Promise<GeneratedFollowUp> {
  const { output } = await generateText({
    model: GENERATION_MODEL,
    output: Output.object({ schema: generatedFollowUpSchema }),
    prompt: buildPrompt(context),
  });
  return output;
}
