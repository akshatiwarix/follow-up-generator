import { describe, expect, it, vi } from "vitest";
import type { MeetingContext, GeneratedFollowUp } from "@/lib/domain";

const generateTextMock = vi.fn();

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateTextMock(...args),
  Output: { object: (config: unknown) => config },
}));

const { generateFollowUp, GENERATION_MODEL_ID } = await import("./generate-follow-up");

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

describe("generateFollowUp", () => {
  it("calls the AI SDK with the Google model and a context-specific prompt, returning its output", async () => {
    const fakeFollowUp: GeneratedFollowUp = {
      subject: "Following up",
      draftLines: [{ text: "Thanks for the time today.", citation: null }],
      nextSteps: [],
    };
    generateTextMock.mockResolvedValueOnce({ output: fakeFollowUp });

    const result = await generateFollowUp(context);

    expect(result).toEqual(fakeFollowUp);
    expect(generateTextMock).toHaveBeenCalledTimes(1);

    const callArgs = generateTextMock.mock.calls[0]?.[0] as { model: { modelId: string }; prompt: string };
    expect(callArgs.model.modelId).toBe(GENERATION_MODEL_ID);
    expect(callArgs.prompt).toContain("Acme Corp");
  });
});
