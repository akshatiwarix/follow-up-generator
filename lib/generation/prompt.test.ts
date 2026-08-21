import { describe, expect, it } from "vitest";
import type { MeetingContext } from "@/lib/domain";
import { buildPrompt } from "./prompt";

const context: MeetingContext = {
  id: "m-fixture",
  company: "Acme Corp",
  industry: "logistics",
  dealStage: "proposal",
  stageSignalsConflict: false,
  contacts: [{ name: "Jordan Lee", role: "VP Operations", isNamed: true }],
  painPoints: ["manual dispatch scheduling"],
  commitments: [{ by: "rep", text: "send updated pricing", isVague: false }],
  openQuestions: [],
  nextMeeting: { confirmed: true, timeframe: "next Tuesday" },
  ambiguous: false,
  ambiguityKind: null,
};

describe("buildPrompt", () => {
  it("embeds the meeting context as JSON", () => {
    const prompt = buildPrompt(context);
    expect(prompt).toContain('"company": "Acme Corp"');
    expect(prompt).toContain('"timeframe": "next Tuesday"');
  });

  it("instructs the model to cite exact dot-paths", () => {
    const prompt = buildPrompt(context);
    expect(prompt).toContain("nextMeeting.timeframe");
    expect(prompt).toContain("commitments.1.text");
  });

  it("states the no-fabrication rule for gaps", () => {
    const prompt = buildPrompt(context);
    expect(prompt.toLowerCase()).toContain("do not invent a specific");
    expect(prompt).toContain("isVague");
    expect(prompt).toContain("stageSignalsConflict");
  });
});
