import { describe, expect, it } from "vitest";
import type { FollowUpResult, MeetingContext, GeneratedFollowUp, FollowUpGrade } from "@/lib/domain";
import { aggregateCorpusGroundedness } from "./corpus-groundedness";

const baseContext: MeetingContext = {
  id: "m-fixture",
  company: "Acme Corp",
  industry: "logistics",
  dealStage: "proposal",
  stageSignalsConflict: false,
  contacts: [],
  painPoints: [],
  commitments: [],
  openQuestions: [],
  nextMeeting: { confirmed: true, timeframe: "next Tuesday" },
  ambiguous: false,
  ambiguityKind: null,
};

const followUp: GeneratedFollowUp = {
  subject: "Following up",
  draftLines: [{ text: "hi", citation: null }],
  nextSteps: [],
};

function fixture(groundednessScore: number, ambiguous: boolean): FollowUpResult {
  const grade: FollowUpGrade = {
    citationCoverage: 1,
    citationAccuracy: 1,
    groundednessScore,
    ungroundedLines: [],
    invalidCitations: [],
  };
  return {
    context: { ...baseContext, ambiguous, ambiguityKind: ambiguous ? "missing_next_meeting" : null },
    followUp,
    grade,
  };
}

describe("aggregateCorpusGroundedness", () => {
  it("averages overall, clean, and ambiguous separately", () => {
    const results = [fixture(100, false), fixture(80, false), fixture(60, true), fixture(40, true)];

    const groundedness = aggregateCorpusGroundedness(results);

    expect(groundedness.overall).toBe(70);
    expect(groundedness.clean).toBe(90);
    expect(groundedness.ambiguous).toBe(50);
  });

  it("returns 0 for an empty corpus", () => {
    expect(aggregateCorpusGroundedness([])).toEqual({ overall: 0, clean: 0, ambiguous: 0 });
  });

  it("handles a corpus with no ambiguous meetings", () => {
    const results = [fixture(100, false), fixture(90, false)];
    const groundedness = aggregateCorpusGroundedness(results);
    expect(groundedness.ambiguous).toBe(0);
    expect(groundedness.clean).toBe(95);
  });
});
