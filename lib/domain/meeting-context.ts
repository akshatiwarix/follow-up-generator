import { z } from "zod";

export const dealStageSchema = z.enum([
  "discovery",
  "qualification",
  "evaluation",
  "proposal",
  "negotiation",
  "closed_won",
]);
export type DealStage = z.infer<typeof dealStageSchema>;

export const ambiguityKindSchema = z.enum([
  "missing_next_meeting",
  "vague_commitment",
  "unresolved_objection",
  "unnamed_stakeholder",
  "unclear_deal_stage",
]);
export type AmbiguityKind = z.infer<typeof ambiguityKindSchema>;

export const contactFactSchema = z.object({
  name: z.string().nullable(),
  role: z.string(),
  isNamed: z.boolean(),
});
export type ContactFact = z.infer<typeof contactFactSchema>;

export const commitmentFactSchema = z.object({
  by: z.enum(["rep", "prospect"]),
  text: z.string(),
  isVague: z.boolean(),
});
export type CommitmentFact = z.infer<typeof commitmentFactSchema>;

export const openQuestionSchema = z.object({
  text: z.string(),
  resolved: z.boolean(),
});
export type OpenQuestion = z.infer<typeof openQuestionSchema>;

export const nextMeetingProposalSchema = z.object({
  confirmed: z.boolean(),
  timeframe: z.string().nullable(),
});
export type NextMeetingProposal = z.infer<typeof nextMeetingProposalSchema>;

export const meetingContextSchema = z.object({
  id: z.string(),
  company: z.string(),
  industry: z.string(),
  dealStage: dealStageSchema,
  stageSignalsConflict: z.boolean(),
  contacts: z.array(contactFactSchema),
  painPoints: z.array(z.string()),
  commitments: z.array(commitmentFactSchema),
  openQuestions: z.array(openQuestionSchema),
  nextMeeting: nextMeetingProposalSchema,
  ambiguous: z.boolean(),
  ambiguityKind: ambiguityKindSchema.nullable(),
});
export type MeetingContext = z.infer<typeof meetingContextSchema>;
