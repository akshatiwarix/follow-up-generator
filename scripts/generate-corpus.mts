import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateMeetingContexts } from "../data/generate-contexts";
import { generateFollowUp } from "../lib/generation";
import { gradeFollowUp } from "../lib/grounding";
import type { FollowUpResult, MeetingContext } from "../lib/domain";

/**
 * One-time, local: calls the Google Generative AI API once per meeting and
 * writes the committed data/follow-up-corpus.json. Needs
 * GOOGLE_GENERATIVE_AI_API_KEY in the environment — see PLAN.md § Deployment
 * plan. Not required at app runtime: the Library/detail pages read the
 * committed file, never call the model themselves.
 *
 * Writes after every meeting (not just at the end) and skips meetings
 * already present in an existing output file, so a transient failure loses
 * at most one meeting's progress, not the whole run — the free tier
 * occasionally 503s under "high demand".
 */
const OUT_PATH = path.join(process.cwd(), "data", "follow-up-corpus.json");
const RETRIES_PER_MEETING = 3;
const RETRY_DELAY_MS = 5000;
const REQUEST_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadExisting(): Map<string, FollowUpResult> {
  if (!existsSync(OUT_PATH)) return new Map();
  const existing = JSON.parse(readFileSync(OUT_PATH, "utf-8")) as FollowUpResult[];
  return new Map(existing.map((entry) => [entry.context.id, entry]));
}

function writeResults(results: FollowUpResult[]): void {
  writeFileSync(OUT_PATH, JSON.stringify(results, null, 2) + "\n");
}

async function generateWithRetry(context: MeetingContext) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRIES_PER_MEETING; attempt++) {
    try {
      return await generateFollowUp(context);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  attempt ${attempt}/${RETRIES_PER_MEETING} failed: ${message}`);
      if (attempt < RETRIES_PER_MEETING) await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

async function main() {
  const contexts = generateMeetingContexts();
  const existing = loadExisting();
  const results: FollowUpResult[] = [];

  for (const context of contexts) {
    const cached = existing.get(context.id);
    // Compare content, not just id: if the corpus generator's parameters
    // change (as happened mid-build, 50 meetings -> 20), an id can be
    // reused for a differently-shaped context. A stale cache hit here would
    // silently pair the wrong context with an old followUp/grade.
    if (cached && JSON.stringify(cached.context) === JSON.stringify(context)) {
      results.push(cached);
      console.log(`${context.id} (${context.company})... cached, groundedness ${cached.grade.groundednessScore}`);
      continue;
    }

    process.stdout.write(`${context.id} (${context.company})... `);
    const followUp = await generateWithRetry(context);
    const grade = gradeFollowUp(context, followUp);
    results.push({ context, followUp, grade });
    console.log(`groundedness ${grade.groundednessScore}`);
    writeResults(results);
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\nWrote ${results.length} entries to ${OUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
