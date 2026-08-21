export type GroundednessBand = "high" | "medium" | "low";

export function groundednessBand(score: number): GroundednessBand {
  if (score >= 85) return "high";
  if (score >= 65) return "medium";
  return "low";
}

export const GROUNDEDNESS_BAND_CLASSES: Record<GroundednessBand, string> = {
  high: "bg-ground-high-dim text-ground-high",
  medium: "bg-ground-medium-dim text-ground-medium",
  low: "bg-ground-low-dim text-ground-low",
};
