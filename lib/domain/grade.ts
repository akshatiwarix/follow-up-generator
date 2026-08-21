import { z } from "zod";
import { meetingContextSchema } from "./meeting-context";
import { generatedFollowUpSchema } from "./follow-up";

export const followUpGradeSchema = z.object({
  citationCoverage: z.number().min(0).max(1),
  citationAccuracy: z.number().min(0).max(1),
  groundednessScore: z.number().int().min(0).max(100),
  ungroundedLines: z.array(z.number().int()),
  invalidCitations: z.array(z.number().int()),
});
export type FollowUpGrade = z.infer<typeof followUpGradeSchema>;

export const followUpResultSchema = z.object({
  context: meetingContextSchema,
  followUp: generatedFollowUpSchema,
  grade: followUpGradeSchema,
});
export type FollowUpResult = z.infer<typeof followUpResultSchema>;

export const corpusGroundednessSchema = z.object({
  overall: z.number(),
  clean: z.number(),
  ambiguous: z.number(),
});
export type CorpusGroundedness = z.infer<typeof corpusGroundednessSchema>;

export const followUpsResponseSchema = z.object({
  entries: z.array(followUpResultSchema),
  groundedness: corpusGroundednessSchema,
});
export type FollowUpsResponse = z.infer<typeof followUpsResponseSchema>;
