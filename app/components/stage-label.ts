import type { DealStage } from "@/lib/domain";

export const STAGE_LABELS: Record<DealStage, string> = {
  discovery: "Discovery",
  qualification: "Qualification",
  evaluation: "Evaluation",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
};
