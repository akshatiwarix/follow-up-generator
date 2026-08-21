import type { MeetingContext } from "@/lib/domain";

/**
 * The prompt embeds the MeetingContext as literal JSON and asks the model to
 * cite dot-paths into that exact structure (e.g. "nextMeeting.timeframe",
 * "commitments.1.text") — those paths are what lib/grounding/resolve-field.ts
 * resolves at grading time, so the field-path convention here and there must
 * stay in lockstep.
 */
export function buildPrompt(context: MeetingContext): string {
  const contextJson = JSON.stringify(context, null, 2);

  return `You are drafting a sales follow-up email on behalf of a rep, immediately after a call with a prospect. You are given the meeting's context as JSON below. Every fact in your draft must be traceable to this JSON — you are being graded on it.

MEETING CONTEXT:
${contextJson}

Write:
1. A short, external, prospect-facing follow-up email as an ordered list of lines ("draftLines"). Each line that asserts a specific fact (a name, a date, a commitment, a pain point, the deal stage) must carry a "citation" — { field, value } — where "field" is the exact dot-path into the JSON above (for example "contacts.0.name", "nextMeeting.timeframe", "commitments.1.text") and "value" is the fact as it appears in the line. Purely connective lines that assert nothing (a greeting, "thanks for your time", a sign-off) should carry "citation": null.
2. A structured next-step summary ("nextSteps"), each item with "text", "owner" (one of "rep", "prospect", "unassigned"), "dueHint" (a short string or null), and the same "citation" shape.

The single most important rule: if something in the context is unconfirmed, vague, or missing — an unconfirmed next meeting ("nextMeeting.confirmed": false), a commitment flagged "isVague": true, an unresolved open question, deal-stage signals that conflict ("stageSignalsConflict": true), or a stakeholder with no name — do not invent a specific to fill the gap. State the gap plainly instead (for example "we didn't land on a firm date for our next call" rather than guessing one), or leave it out of the next steps entirely. A citation pointing at a field that has no real value there is a fabrication, and is scored as one.`;
}
