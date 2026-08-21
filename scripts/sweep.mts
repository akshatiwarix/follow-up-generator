import { loadCorpus, aggregateCorpusGroundedness } from "../lib/follow-up";
import { gradeFollowUp } from "../lib/grounding";
import { generatedFollowUpSchema } from "../lib/domain";
import { generateMeetingContexts, AMBIGUITY_KINDS, AMBIGUOUS_COUNT, CORPUS_SIZE } from "../data/generate-contexts";
import { timeframes } from "../data/banks";

/**
 * Invariants over the committed corpus (data/follow-up-corpus.json). See
 * PLAN.md § Validation / test plan. No network — everything here is a pure
 * check against already-committed data.
 */

let failures = 0;

function check(n: number, description: string, passed: boolean): void {
  console.log(`${passed ? "  ok" : "FAIL"}  ${n}. ${description}`);
  if (!passed) failures++;
}

function containsAny(text: string, phrases: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return phrases.some((phrase) => lower.includes(phrase.toLowerCase()));
}

const corpus = loadCorpus();

check(1, "corpus size", corpus.length === CORPUS_SIZE);

const ambiguous = corpus.filter((entry) => entry.context.ambiguous);
const everyKindPresent = AMBIGUITY_KINDS.every((kind) =>
  ambiguous.some((entry) => entry.context.ambiguityKind === kind),
);
check(2, "ambiguity mix (exactly AMBIGUOUS_COUNT, every kind represented)", ambiguous.length === AMBIGUOUS_COUNT && everyKindPresent);

check(
  3,
  "every committed GeneratedFollowUp validates against its zod schema",
  corpus.every((entry) => generatedFollowUpSchema.safeParse(entry.followUp).success),
);

check(
  4,
  "grading reproducibility (recompute matches committed grade)",
  corpus.every((entry) => {
    const recomputed = gradeFollowUp(entry.context, entry.followUp);
    return JSON.stringify(recomputed) === JSON.stringify(entry.grade);
  }),
);

const groundedness = aggregateCorpusGroundedness(corpus);
check(5, "groundedness floor (overall >= 80)", groundedness.overall >= 80);
check(6, "difficulty realism (ambiguous average < clean average)", groundedness.ambiguous < groundedness.clean);

check(
  7,
  "zero fabrication on ambiguous gaps (no invalid citations, no bare fabricated timeframe)",
  corpus.every((entry) => {
    if (!entry.context.ambiguous) return true;
    if (entry.grade.invalidCitations.length > 0) return false;
    if (entry.context.ambiguityKind === "missing_next_meeting") {
      const allText = [
        entry.followUp.subject,
        ...entry.followUp.draftLines.map((line) => line.text),
        ...entry.followUp.nextSteps.map((step) => step.text),
      ].join(" ");
      if (containsAny(allText, timeframes)) return false;
    }
    return true;
  }),
);

const contextsA = generateMeetingContexts();
const contextsB = generateMeetingContexts();
check(8, "corpus-context generation is deterministic", JSON.stringify(contextsA) === JSON.stringify(contextsB));

console.log("");
if (failures > 0) {
  console.log(`${failures} invariant(s) failed.`);
  process.exit(1);
}
console.log(
  `Headline: overall groundedness: ${groundedness.overall}  (clean: ${groundedness.clean}, ambiguous: ${groundedness.ambiguous})`,
);
