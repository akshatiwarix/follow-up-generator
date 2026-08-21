import { z } from "zod";
import { dealStageSchema, type MeetingContext } from "@/lib/domain";

/**
 * Try It Yourself's form is a small structured form, not free text — every
 * field maps directly onto a MeetingContext field, so the model always sees
 * the same JSON-with-dot-path-citations shape it does for the committed
 * corpus. Field caps keep the total prompt size bounded (~4000 chars).
 */
export const tryItInputSchema = z.object({
  company: z.string().trim().min(1).max(120),
  industry: z.string().trim().min(1).max(80),
  dealStage: dealStageSchema,
  stageSignalsConflict: z.boolean(),
  contactName: z.string().trim().max(80),
  contactRole: z.string().trim().min(1).max(80),
  painPoints: z.array(z.string().trim().min(1).max(160)).min(1).max(5),
  repCommitment: z.string().trim().max(200),
  repCommitmentVague: z.boolean(),
  prospectCommitment: z.string().trim().max(200),
  prospectCommitmentVague: z.boolean(),
  openQuestion: z.string().trim().max(200),
  nextMeetingConfirmed: z.boolean(),
  nextMeetingTimeframe: z.string().trim().max(80),
});
export type TryItInput = z.infer<typeof tryItInputSchema>;

/** Builds a MeetingContext from a Try It Yourself submission. */
export function toMeetingContext(input: TryItInput): MeetingContext {
  const commitments: MeetingContext["commitments"] = [];
  if (input.repCommitment.length > 0) {
    commitments.push({ by: "rep", text: input.repCommitment, isVague: input.repCommitmentVague });
  }
  if (input.prospectCommitment.length > 0) {
    commitments.push({
      by: "prospect",
      text: input.prospectCommitment,
      isVague: input.prospectCommitmentVague,
    });
  }

  const openQuestions: MeetingContext["openQuestions"] =
    input.openQuestion.length > 0 ? [{ text: input.openQuestion, resolved: false }] : [];

  return {
    id: "try-it",
    company: input.company,
    industry: input.industry,
    dealStage: input.dealStage,
    stageSignalsConflict: input.stageSignalsConflict,
    contacts: [
      {
        name: input.contactName.length > 0 ? input.contactName : null,
        role: input.contactRole,
        isNamed: input.contactName.length > 0,
      },
    ],
    painPoints: input.painPoints,
    commitments,
    openQuestions,
    nextMeeting: {
      confirmed: input.nextMeetingConfirmed,
      timeframe: input.nextMeetingConfirmed && input.nextMeetingTimeframe.length > 0
        ? input.nextMeetingTimeframe
        : null,
    },
    ambiguous: false,
    ambiguityKind: null,
  };
}
