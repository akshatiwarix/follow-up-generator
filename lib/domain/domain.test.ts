import { describe, expect, it } from "vitest";
import {
  meetingContextSchema,
  generatedFollowUpSchema,
  followUpGradeSchema,
  type MeetingContext,
} from "./index";

const validContext: MeetingContext = {
  id: "m-001",
  company: "Acme Corp",
  industry: "logistics",
  dealStage: "proposal",
  stageSignalsConflict: false,
  contacts: [{ name: "Jordan Lee", role: "VP Operations", isNamed: true }],
  painPoints: ["manual dispatch scheduling"],
  commitments: [
    { by: "rep", text: "send updated pricing", isVague: false },
  ],
  openQuestions: [{ text: "budget owner sign-off", resolved: false }],
  nextMeeting: { confirmed: true, timeframe: "next Tuesday" },
  ambiguous: false,
  ambiguityKind: null,
};

describe("meetingContextSchema", () => {
  it("accepts a well-formed context", () => {
    expect(meetingContextSchema.safeParse(validContext).success).toBe(true);
  });

  it("rejects an unknown deal stage", () => {
    const result = meetingContextSchema.safeParse({
      ...validContext,
      dealStage: "not-a-stage",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing ambiguityKind on an ambiguous meeting mismatch", () => {
    // ambiguous meetings must carry a kind; schema itself allows null, the
    // corpus generator is responsible for the pairing invariant (see
    // data/generate-contexts.test.ts).
    const result = meetingContextSchema.safeParse({
      ...validContext,
      ambiguous: true,
      ambiguityKind: null,
    });
    expect(result.success).toBe(true);
  });

  it("allows a null contact name for an unnamed stakeholder", () => {
    const result = meetingContextSchema.safeParse({
      ...validContext,
      contacts: [{ name: null, role: "someone from procurement", isNamed: false }],
    });
    expect(result.success).toBe(true);
  });
});

describe("generatedFollowUpSchema", () => {
  it("accepts a draft with mixed cited and uncited lines", () => {
    const followUp = {
      subject: "Great connecting today",
      draftLines: [
        { text: "Thanks for the time today.", citation: null },
        {
          text: "As discussed, our next call is next Tuesday.",
          citation: { field: "nextMeeting.timeframe", value: "next Tuesday" },
        },
      ],
      nextSteps: [
        {
          text: "Send updated pricing",
          owner: "rep",
          dueHint: null,
          citation: { field: "commitments.0.text", value: "send updated pricing" },
        },
      ],
    };
    expect(generatedFollowUpSchema.safeParse(followUp).success).toBe(true);
  });

  it("rejects an empty draft", () => {
    const result = generatedFollowUpSchema.safeParse({
      subject: "Empty",
      draftLines: [],
      nextSteps: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown next-step owner", () => {
    const result = generatedFollowUpSchema.safeParse({
      subject: "x",
      draftLines: [{ text: "hi", citation: null }],
      nextSteps: [{ text: "x", owner: "manager", dueHint: null, citation: null }],
    });
    expect(result.success).toBe(false);
  });
});

describe("followUpGradeSchema", () => {
  it("rejects a groundedness score outside 0-100", () => {
    const result = followUpGradeSchema.safeParse({
      citationCoverage: 1,
      citationAccuracy: 1,
      groundednessScore: 150,
      ungroundedLines: [],
      invalidCitations: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a fully-grounded grade", () => {
    const result = followUpGradeSchema.safeParse({
      citationCoverage: 1,
      citationAccuracy: 1,
      groundednessScore: 100,
      ungroundedLines: [],
      invalidCitations: [],
    });
    expect(result.success).toBe(true);
  });
});
