import { describe, expect, it } from "vitest";
import type { MeetingContext, GeneratedFollowUp } from "@/lib/domain";
import { gradeFollowUp } from "./grade-follow-up";

const baseContext: MeetingContext = {
  id: "m-fixture",
  company: "Acme Corp",
  industry: "logistics",
  dealStage: "proposal",
  stageSignalsConflict: false,
  contacts: [{ name: "Jordan Lee", role: "VP Operations", isNamed: true }],
  painPoints: ["manual dispatch scheduling"],
  commitments: [{ by: "rep", text: "send updated pricing", isVague: false }],
  openQuestions: [{ text: "budget owner sign-off", resolved: false }],
  nextMeeting: { confirmed: true, timeframe: "next Tuesday" },
  ambiguous: false,
  ambiguityKind: null,
};

function followUpWithLines(
  draftLines: GeneratedFollowUp["draftLines"],
): GeneratedFollowUp {
  return { subject: "Following up", draftLines, nextSteps: [] };
}

describe("gradeFollowUp", () => {
  it("scores 100 when every line is cited and every citation matches", () => {
    const followUp = followUpWithLines([
      {
        text: "Great speaking with you, Jordan.",
        citation: { field: "contacts.0.name", value: "Jordan Lee" },
      },
      {
        text: "Our next call is next Tuesday.",
        citation: { field: "nextMeeting.timeframe", value: "next Tuesday" },
      },
    ]);

    const grade = gradeFollowUp(baseContext, followUp);

    expect(grade.citationCoverage).toBe(1);
    expect(grade.citationAccuracy).toBe(1);
    expect(grade.groundednessScore).toBe(100);
    expect(grade.ungroundedLines).toEqual([]);
    expect(grade.invalidCitations).toEqual([]);
  });

  it("scores 0 when no line carries a citation", () => {
    const followUp = followUpWithLines([
      { text: "Thanks for your time.", citation: null },
      { text: "Talk soon.", citation: null },
    ]);

    const grade = gradeFollowUp(baseContext, followUp);

    expect(grade.citationCoverage).toBe(0);
    expect(grade.groundednessScore).toBe(0);
    expect(grade.ungroundedLines).toEqual([0, 1]);
  });

  it("penalizes a citation whose value doesn't match its cited field", () => {
    const followUp = followUpWithLines([
      {
        text: "Great speaking with you, Jordan.",
        citation: { field: "contacts.0.name", value: "Jordan Lee" },
      },
      {
        text: "Our next call is next Wednesday.",
        // fabricated: context says "next Tuesday"
        citation: { field: "nextMeeting.timeframe", value: "next Wednesday" },
      },
    ]);

    const grade = gradeFollowUp(baseContext, followUp);

    expect(grade.citationCoverage).toBe(1);
    expect(grade.citationAccuracy).toBe(0.5);
    expect(grade.groundednessScore).toBe(50);
    expect(grade.invalidCitations).toEqual([1]);
  });

  it("flags a citation to a field that isn't actually confirmed", () => {
    const ambiguousContext: MeetingContext = {
      ...baseContext,
      ambiguous: true,
      ambiguityKind: "missing_next_meeting",
      nextMeeting: { confirmed: false, timeframe: null },
    };

    const followUp = followUpWithLines([
      {
        text: "Looking forward to our call next Tuesday.",
        // fabricated: nextMeeting.timeframe is null, nothing was confirmed
        citation: { field: "nextMeeting.timeframe", value: "next Tuesday" },
      },
    ]);

    const grade = gradeFollowUp(ambiguousContext, followUp);

    expect(grade.invalidCitations).toEqual([0]);
    expect(grade.citationAccuracy).toBe(0);
    expect(grade.groundednessScore).toBe(0);
  });
});
