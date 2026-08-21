import type { MeetingContext, GeneratedFollowUp, FollowUpGrade } from "@/lib/domain";
import { resolveField } from "./resolve-field";

function valuesMatch(resolved: string, cited: string): boolean {
  const a = resolved.trim().toLowerCase();
  const b = cited.trim().toLowerCase();
  if (a.length === 0 || b.length === 0) return false;
  return a.includes(b) || b.includes(a);
}

/**
 * Pure, deterministic: same (context, followUp) pair always produces the
 * same grade. No network, no randomness — see PLAN.md § Rules of the
 * architecture. This is what `npm run sweep` invariant 4 (grading
 * reproducibility) checks against the committed corpus.
 */
export function gradeFollowUp(context: MeetingContext, followUp: GeneratedFollowUp): FollowUpGrade {
  const { draftLines } = followUp;
  const totalLines = draftLines.length;

  const citedLines = draftLines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.citation !== null);

  const citationCoverage = totalLines === 0 ? 0 : citedLines.length / totalLines;

  const invalidCitations: number[] = [];
  let validCount = 0;

  for (const { line, index } of citedLines) {
    const citation = line.citation;
    if (!citation) continue;
    const resolved = resolveField(context, citation.field);
    if (resolved !== undefined && valuesMatch(resolved, citation.value)) {
      validCount++;
    } else {
      invalidCitations.push(index);
    }
  }

  const citationAccuracy = citedLines.length === 0 ? 0 : validCount / citedLines.length;

  const ungroundedLines = draftLines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.citation === null)
    .map(({ index }) => index);

  const groundednessScore = Math.round(100 * citationCoverage * citationAccuracy);

  return {
    citationCoverage,
    citationAccuracy,
    groundednessScore,
    ungroundedLines,
    invalidCitations,
  };
}
