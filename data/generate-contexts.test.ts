import { describe, expect, it } from "vitest";
import { meetingContextSchema } from "@/lib/domain";
import { generateMeetingContexts, AMBIGUITY_KINDS, AMBIGUOUS_COUNT, CORPUS_SIZE } from "./generate-contexts";

describe("generateMeetingContexts", () => {
  it("produces exactly CORPUS_SIZE meetings", () => {
    expect(generateMeetingContexts()).toHaveLength(CORPUS_SIZE);
  });

  it("produces a schema-valid MeetingContext for every entry", () => {
    for (const context of generateMeetingContexts()) {
      expect(meetingContextSchema.safeParse(context).success).toBe(true);
    }
  });

  it("flags exactly AMBIGUOUS_COUNT meetings as ambiguous, 4 of each kind", () => {
    const contexts = generateMeetingContexts();
    const ambiguous = contexts.filter((c) => c.ambiguous);
    expect(ambiguous).toHaveLength(AMBIGUOUS_COUNT);
    expect(ambiguous.every((c) => c.ambiguityKind !== null)).toBe(true);

    for (const kind of AMBIGUITY_KINDS) {
      const count = ambiguous.filter((c) => c.ambiguityKind === kind).length;
      expect(count).toBe(AMBIGUOUS_COUNT / AMBIGUITY_KINDS.length);
    }
  });

  it("marks every clean meeting with ambiguityKind: null", () => {
    const contexts = generateMeetingContexts();
    const clean = contexts.filter((c) => !c.ambiguous);
    expect(clean.every((c) => c.ambiguityKind === null)).toBe(true);
  });

  it("is deterministic for a fixed seed", () => {
    const first = generateMeetingContexts(42);
    const second = generateMeetingContexts(42);
    expect(second).toEqual(first);
  });

  it("produces different output for a different seed", () => {
    const a = generateMeetingContexts(1);
    const b = generateMeetingContexts(2);
    expect(a).not.toEqual(b);
  });

  it("gives each ambiguity kind's structural gap: no confirmed next meeting", () => {
    const contexts = generateMeetingContexts();
    const missing = contexts.filter((c) => c.ambiguityKind === "missing_next_meeting");
    expect(missing.every((c) => c.nextMeeting.confirmed === false && c.nextMeeting.timeframe === null)).toBe(true);
  });

  it("gives unnamed_stakeholder meetings a contact with a null name", () => {
    const contexts = generateMeetingContexts();
    const unnamed = contexts.filter((c) => c.ambiguityKind === "unnamed_stakeholder");
    expect(unnamed.every((c) => c.contacts.some((contact) => contact.name === null))).toBe(true);
  });

  it("gives vague_commitment meetings at least one isVague commitment", () => {
    const contexts = generateMeetingContexts();
    const vague = contexts.filter((c) => c.ambiguityKind === "vague_commitment");
    expect(vague.every((c) => c.commitments.some((commitment) => commitment.isVague))).toBe(true);
  });

  it("gives unclear_deal_stage meetings stageSignalsConflict: true", () => {
    const contexts = generateMeetingContexts();
    const unclear = contexts.filter((c) => c.ambiguityKind === "unclear_deal_stage");
    expect(unclear.every((c) => c.stageSignalsConflict === true)).toBe(true);
  });
});
