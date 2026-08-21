import { z } from "zod";

export const citationSchema = z.object({
  field: z.string(),
  value: z.string(),
});
export type Citation = z.infer<typeof citationSchema>;

export const draftLineSchema = z.object({
  text: z.string(),
  citation: citationSchema.nullable(),
});
export type DraftLine = z.infer<typeof draftLineSchema>;

export const nextStepOwnerSchema = z.enum(["rep", "prospect", "unassigned"]);
export type NextStepOwner = z.infer<typeof nextStepOwnerSchema>;

export const nextStepItemSchema = z.object({
  text: z.string(),
  owner: nextStepOwnerSchema,
  dueHint: z.string().nullable(),
  citation: citationSchema.nullable(),
});
export type NextStepItem = z.infer<typeof nextStepItemSchema>;

export const generatedFollowUpSchema = z.object({
  subject: z.string(),
  draftLines: z.array(draftLineSchema).min(1),
  nextSteps: z.array(nextStepItemSchema),
});
export type GeneratedFollowUp = z.infer<typeof generatedFollowUpSchema>;
