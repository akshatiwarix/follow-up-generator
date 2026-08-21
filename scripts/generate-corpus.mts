import { writeFileSync } from "node:fs";
import path from "node:path";
import { generateMeetingContexts } from "../data/generate-contexts";
import { generateFollowUp } from "../lib/generation";
import { gradeFollowUp } from "../lib/grounding";
import type { FollowUpResult } from "../lib/domain";

/**
 * One-time, local: calls the AI Gateway once per meeting and writes the
 * committed data/follow-up-corpus.json. Needs an AI Gateway credential in
 * the environment (VERCEL_OIDC_TOKEN from `vercel env pull`, or
 * AI_GATEWAY_API_KEY) — see PLAN.md § Deployment plan. Not required at app
 * runtime: the Library/detail pages read the committed file, never call
 * the model themselves.
 */
async function main() {
  const contexts = generateMeetingContexts();
  const results: FollowUpResult[] = [];

  for (const context of contexts) {
    process.stdout.write(`${context.id} (${context.company})... `);
    const followUp = await generateFollowUp(context);
    const grade = gradeFollowUp(context, followUp);
    results.push({ context, followUp, grade });
    console.log(`groundedness ${grade.groundednessScore}`);
  }

  const outPath = path.join(process.cwd(), "data", "follow-up-corpus.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2) + "\n");
  console.log(`\nWrote ${results.length} entries to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
