import type { FollowUpResult, CorpusGroundedness } from "@/lib/domain";

function average(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export function aggregateCorpusGroundedness(results: readonly FollowUpResult[]): CorpusGroundedness {
  const all = results.map((r) => r.grade.groundednessScore);
  const clean = results.filter((r) => !r.context.ambiguous).map((r) => r.grade.groundednessScore);
  const ambiguous = results.filter((r) => r.context.ambiguous).map((r) => r.grade.groundednessScore);

  return {
    overall: average(all),
    clean: average(clean),
    ambiguous: average(ambiguous),
  };
}
