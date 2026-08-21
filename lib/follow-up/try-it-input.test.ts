import { describe, expect, it } from "vitest";
import { meetingContextSchema } from "@/lib/domain";
import { toMeetingContext, type TryItInput } from "./try-it-input";

const baseInput: TryItInput = {
  company: "Acme Corp",
  industry: "logistics",
  dealStage: "proposal",
  stageSignalsConflict: false,
  contactName: "Jordan Lee",
  contactRole: "VP Operations",
  painPoints: ["manual dispatch scheduling"],
  repCommitment: "send updated pricing",
  repCommitmentVague: false,
  prospectCommitment: "",
  prospectCommitmentVague: false,
  openQuestion: "",
  nextMeetingConfirmed: true,
  nextMeetingTimeframe: "next Tuesday",
};

describe("toMeetingContext", () => {
  it("produces a schema-valid MeetingContext", () => {
    const context = toMeetingContext(baseInput);
    expect(meetingContextSchema.safeParse(context).success).toBe(true);
  });

  it("omits empty commitments and open questions rather than emitting blanks", () => {
    const context = toMeetingContext(baseInput);
    expect(context.commitments).toEqual([{ by: "rep", text: "send updated pricing", isVague: false }]);
    expect(context.openQuestions).toEqual([]);
  });

  it("treats a blank contact name as an unnamed stakeholder", () => {
    const context = toMeetingContext({ ...baseInput, contactName: "" });
    expect(context.contacts).toEqual([{ name: null, role: "VP Operations", isNamed: false }]);
  });

  it("nulls out the timeframe when the next meeting isn't confirmed", () => {
    const context = toMeetingContext({
      ...baseInput,
      nextMeetingConfirmed: false,
      nextMeetingTimeframe: "next Tuesday",
    });
    expect(context.nextMeeting).toEqual({ confirmed: false, timeframe: null });
  });

  it("includes both commitments when both are provided", () => {
    const context = toMeetingContext({
      ...baseInput,
      prospectCommitment: "get sign-off from legal",
      prospectCommitmentVague: true,
    });
    expect(context.commitments).toEqual([
      { by: "rep", text: "send updated pricing", isVague: false },
      { by: "prospect", text: "get sign-off from legal", isVague: true },
    ]);
  });
});
